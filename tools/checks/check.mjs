#!/usr/bin/env node
// Single quality check: "everything is green + no leaked secrets".
//   node tools/checks/check.mjs [--release]
// Exits 1 if any criterion below fails, otherwise 0. Forge-agnostic: the same file can
// be run locally or from any CI.
//
// Criteria (K-numbers are the project's acceptance-criterion IDs):
//   Node  Node.js >= 19 (the crypto code relies on the global `crypto`).
//   green `node test/schemes.smoke.mjs` must exit 0 (signature-scheme smoke test).
//   K5    Mobile layout: at a 390px viewport, after EVERY step of a click scenario on
//         the three pages, there is no horizontal scroll and no button smaller than
//         44px (lib/k5-audit.mjs, headless browser). Only run under --release because
//         it takes real seconds; without --release it is reported as skipped.
//   K7    Crypto has a single source of truth: js/screens/, js/core/ and root *.html
//         contain no crypto primitives (sha256, secp*, getRandomValues, BigInt, invert)
//         outside comments; only js/schemes/ and js/vendor/ may.
//   K8    Product is English-only: no Cyrillic in js/i18n/en.js, nor (outside
//         comments) in js/screens, js/core, js/schemes, js/data, root *.html, build/*.js.
//   K9    Committed bundles match a rebuild: `node tools/build.mjs --check` rebuilds into
//         a temp dir and compares sha256 with the recorded hashes.
//   K10.x Provenance registry (lib/claims-gate.mjs) -- docs/PROVENANCE.md, js/data/claims.mjs,
//         the screens and the dictionary must not drift apart:
//     K10.1  claim IDs and sources (IDs, URLs) in docs/PROVENANCE.md equal those in js/data/claims.mjs
//     K10.2  every claim has at least one ref, each with a non-empty locator and a known source
//     K10.3  RENDERED_CLAIMS in each screen == registry == SCREEN_COVERAGE; no orphan or dangling dictionary keys
//     K10.4a no figures value is hard-coded as a literal in the dictionary
//     K10.4b no unexplained number (2+ digits) in the dictionary prose
//     K10.5  js/data/** contains data only (no function / => / import outside comments)
//     K10.6  SITE.registrySha256 equals the sha256 of js/data/claims.mjs
//     K10.7  release-only (--release): no unverified locators, canonicalBase is https, author and
//            licenses are in place
//     K10.8  the canonical anchor id="claim-<id>" occurs exactly once per screen (real render)
//     K10.9  regression guard for two plausible-but-wrong locators (c11 FIPS 202, c21 Lamport/DH76)
//     K10.10 no unexplained number in the HTML <head> metatags (title/description/og/twitter)
//   K12   Every committed *.svg (e.g. favicon.svg) is well-formed XML (lib/xml-wellformed.mjs):
//         browsers silently drop an SVG image on the first XML error.
//   Also: secret-scan (lib/secret-scan.mjs) over git-tracked files, and no tracked .env.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";
import { scanRepo } from "./lib/secret-scan.mjs";
import { runClaimsGate } from "./lib/claims-gate.mjs";
import { runK5Audit } from "./lib/k5-audit.mjs";
import { runSvgGate } from "./lib/xml-wellformed.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)); // <project>/tools/checks
function repoRoot() {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  } catch {
    return path.resolve(HERE, "..", "..");
  }
}
const ROOT = repoRoot();
const say = (s) => process.stdout.write(s + "\n");
let failed = false;

// 0) Node version: >=19 is required because js/schemes/* defaultRng relies on the global
//    `globalThis.crypto` (WebCrypto). A clear message here beats a TypeError in the
//    middle of the smoke test.
const NODE_MIN_MAJOR = 19;
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (!(nodeMajor >= NODE_MIN_MAJOR)) {
  say(
    `✗ Node ${process.versions.node} is too old: Node >= ${NODE_MIN_MAJOR} is required ` +
      `(js/schemes/* defaultRng needs globalThis.crypto). Upgrade Node and rerun.`,
  );
  failed = true;
} else {
  say(`✓ Node ${process.versions.node} >= ${NODE_MIN_MAJOR}.`);
}

// 1) "All green" command: the signature-scheme smoke test.
const green = "node test/schemes.smoke.mjs";
say(`▶ green command: ${green}`);
const r = spawnSync(green, { cwd: ROOT, shell: true, stdio: "inherit" });
if (r.status !== 0) {
  say(`✗ green command failed (exit ${r.status}).`);
  failed = true;
} else say("✓ green command passed.");

// 2) K9 - build artifacts are reproducible and in sync with the sources.
//    tools/build.mjs --check rebuilds into a temp dir and compares sha256 with those
//    recorded in js/vendor/noble.PROVENANCE.md and build/BUILD.md.
say("▶ K9 build --check…");
const buildCheck = spawnSync(process.execPath, [path.join(ROOT, "tools", "build.mjs"), "--check"], {
  cwd: ROOT,
  stdio: "inherit",
});
if (buildCheck.status !== 0) {
  failed = true;
  say("✗ K9: build/** or js/vendor/noble.mjs has drifted from the sources - see the output above.");
} else {
  say("✓ K9 passed.");
}

// 3) K8 - the product is entirely English. Inverted criterion: any Cyrillic in what the
//    user sees is a defect. Greps over the rendered DOM (K8.3) are NOT part of this
//    script - that is a manual/browser step outside check.mjs.
say("▶ K8 Cyrillic grep…");
// Cyrillic letters (a-ya, A-YA, yo, YO) written as \u escapes so this file itself contains none.
const CYRILLIC = /[\u0430-\u044F\u0410-\u042F\u0451\u0401]/;

function stripJsComments(src) {
  // Good enough for a grep: drop /* ... */ and // ... line by line. Not a parser, but a
  // false positive "Cyrillic in a code string" is exactly what K8 is meant to catch.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

function stripHtmlComments(src) {
  return src.replace(/<!--[\s\S]*?-->/g, "");
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function findPatternHits(files, stripFn, pattern) {
  const hits = [];
  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const stripped = stripFn ? stripFn(text) : text;
    const lines = stripped.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (pattern.test(line)) hits.push({ file: path.relative(ROOT, file).replace(/\\/g, "/"), line: i + 1 });
    });
  }
  return hits;
}

function findCyrillicHits(files, stripFn) {
  return findPatternHits(files, stripFn, CYRILLIC);
}

let k8Failed = false;

// (1) js/i18n/en.js in full (the primary and only dictionary in v1) - zero Cyrillic.
const enJs = path.join(ROOT, "js", "i18n", "en.js");
if (fs.existsSync(enJs)) {
  const hits = findCyrillicHits([enJs], null);
  if (hits.length) {
    k8Failed = true;
    say(`✗ K8(1): Cyrillic in js/i18n/en.js: ${hits.map((h) => `:${h.line}`).join(", ")}`);
  }
}

// (2) js/screens/, js/core/, js/schemes/, js/data/ and root *.html - outside comments.
const jsDirs = ["js/screens", "js/core", "js/schemes", "js/data"].map((p) => path.join(ROOT, p));
const jsFiles = jsDirs.flatMap(walk).filter((f) => /\.(mjs|js)$/.test(f));
const htmlFiles = fs
  .readdirSync(ROOT, { withFileTypes: true })
  .filter((e) => e.isFile() && e.name.endsWith(".html"))
  .map((e) => path.join(ROOT, e.name));

const hits2js = findCyrillicHits(jsFiles, stripJsComments);
const hits2html = findCyrillicHits(htmlFiles, stripHtmlComments);
if (hits2js.length || hits2html.length) {
  k8Failed = true;
  say(`✗ K8(2): Cyrillic outside comments in screens/core/schemes/data or *.html:`);
  for (const h of [...hits2js, ...hits2html]) say(`  ${h.file}:${h.line}`);
}

// (4) build/*.js - outside comments (the generated artifacts the browser actually loads).
const buildFiles = walk(path.join(ROOT, "build")).filter((f) => f.endsWith(".js"));
const hits4 = findCyrillicHits(buildFiles, stripJsComments);
if (hits4.length) {
  k8Failed = true;
  say(`✗ K8(4): Cyrillic outside comments in build/*.js:`);
  for (const h of hits4) say(`  ${h.file}:${h.line}`);
}

if (k8Failed) failed = true;
else say("✓ K8 grep (1,2,4) passed. Note: K8(3) - a grep over the rendered DOM - is a manual/browser step, not part of this gate.");

// 4) K7 - crypto logic has a single source of truth. js/screens/, js/core/ and *.html
//    must not contain any cryptographic operation - only js/schemes/ and js/vendor/ may
//    (those are not scanned at all). Comments are ignored (prose like "no sha256 here"
//    is not caught - by design: K7 is about code, not about descriptions of code).
say("▶ K7 grep for crypto primitives outside js/schemes and js/vendor…");
// NOTE: this file set INTENTIONALLY differs from K8(2): K8 includes js/schemes/ (where
// crypto code is allowed and expected), K7 checks that it is NOT found anywhere else.
// Hence a separate jsDirsK7 without js/schemes.
const jsDirsK7 = ["js/screens", "js/core"].map((p) => path.join(ROOT, p));
const jsFilesK7 = jsDirsK7.flatMap(walk).filter((f) => /\.(mjs|js)$/.test(f));
const CRYPTO_PRIMITIVE = /\b(sha256|secp\w*|getRandomValues|BigInt|invert)\b/;
const hitsK7js = findPatternHits(jsFilesK7, stripJsComments, CRYPTO_PRIMITIVE);
const hitsK7html = findPatternHits(htmlFiles, stripHtmlComments, CRYPTO_PRIMITIVE);
if (hitsK7js.length || hitsK7html.length) {
  failed = true;
  say(`✗ K7: crypto primitive outside js/schemes/ and js/vendor/ (it must live only there):`);
  for (const h of [...hitsK7js, ...hitsK7html]) say(`  ${h.file}:${h.line}`);
} else {
  say("✓ K7 passed - crypto logic lives only in js/schemes/ and js/vendor/.");
}

// 4b) K12 - SVG files are well-formed XML (a broken favicon is otherwise invisible).
say("▶ K12 SVG well-formedness…");
const svgResult = runSvgGate({ root: ROOT });
for (const line of svgResult.messages) say(line);
if (svgResult.failed) failed = true;

// 5) K10 - provenance registry. --release also enables K10.7.
say("▶ K10 provenance registry…");
const release = process.argv.includes("--release");
const claimsResult = await runClaimsGate({ root: ROOT, release });
for (const line of claimsResult.messages) say(line);
if (claimsResult.failed) failed = true;

// 5b) K5 - 390px / horizontal scroll / tap targets, over a click scenario, in a
//     headless browser. NOT in the default run: a full pass costs real seconds (see
//     lib/k5-audit.mjs for the rationale). Only --release actually runs it; without
//     --release K5 was NOT checked in this run - do not mistake silence for a pass.
if (release) {
  say("▶ K5 audit (390px, click scenario, --release)…");
  const k5Result = await runK5Audit({ root: ROOT, strict: true });
  for (const line of k5Result.messages) say(line);
  if (k5Result.failed) failed = true;
} else {
  say("• K5 audit skipped (needs --release - headless browser, takes real seconds). Run node tools/checks/lib/k5-audit.mjs manually.");
}

// 6) secret scan over git-tracked files
say("▶ secret-scan…");
const { secrets, trackedEnv } = scanRepo(ROOT);
if (trackedEnv.length) {
  failed = true;
  say(`✗ .env is tracked by git (secrets in history!): ${trackedEnv.join(", ")}`);
  say(`  Remove it from the index:  git rm --cached ${trackedEnv.join(" ")}   (the file stays locally)`);
}
if (secrets.length) {
  failed = true;
  say(`✗ possible committed secrets (${secrets.length}):`);
  for (const s of secrets.slice(0, 20)) say(`  ${s.file}:${s.line}  [${s.rule}]  ${s.text}`);
  if (secrets.length > 20) say(`  …and ${secrets.length - 20} more`);
}
if (!trackedEnv.length && !secrets.length) say("✓ no secrets found.");

say(failed ? "\n❌ CHECK: FAIL" : "\n✅ CHECK: PASS");
process.exit(failed ? 1 : 0);
