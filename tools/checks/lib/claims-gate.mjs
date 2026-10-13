// K10: "the provenance registry does not drift apart". Seven deterministic sub-checks
// (K10.1-K10.7) plus K10.8-K10.10, no network. Called from tools/checks/check.mjs.
//
// docs/PROVENANCE.md is parsed ONLY as text, via two stable structures: `### C-N`
// headings and the pipe table of primary sources. The gate does not read the prose, so
// rewording the document cannot break it. js/data/claims.mjs, js/data/site.mjs and
// js/i18n/en.js are pure data modules without side effects, so they are compared via
// a direct `import()`. js/screens/*.mjs are NOT imported (they mutate the DOM at module
// top level and would crash in Node without `document`) - RENDERED_CLAIMS is extracted
// from them with a static regex instead.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";

const SCREEN_FILES = { s0: "intro.mjs", s1: "ecdsa.mjs", s2: "hash.mjs" };

function stripJsComments(src) {
  // Same technique as K7/K8 in check.mjs: not a parser, but a false positive such as
  // "the word `function` mentioned in a comment" is not what K10.5 must catch - it
  // must catch logic leaking into the data files, not prose about it.
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

function normalizeClaimId(rawId) {
  // "C-13" -> "c13": lower-case and drop the hyphen.
  return rawId.toLowerCase().replace("-", "");
}

/** Parses the `### C-N ...` headings of the doc. Returns { all: Set, nonDevOnly: Set } (nonDevOnly excludes headings marked [dev-only]). */
function parseClaimsMdIds(text) {
  const all = new Set();
  const nonDevOnly = new Set();
  const headingRe = /^### (C-\d+)\b(.*)$/gm;
  let m;
  while ((m = headingRe.exec(text))) {
    const id = normalizeClaimId(m[1]);
    all.add(id);
    if (!/\[dev-only\]/.test(m[2])) nonDevOnly.add(id);
  }
  return { all, nonDevOnly };
}

/** Parses the primary-sources pipe table: rows of the form `| ID | Document | URL | Status |`. */
function parseClaimsMdSources(text) {
  const map = new Map();
  const rowRe = /^\|\s*([A-Za-z0-9-]+)\s*\|[^|\n]*\|\s*(https?:\/\/\S+?)\s*\|/gm;
  let m;
  while ((m = rowRe.exec(text))) {
    const [, id, url] = m;
    if (id === "ID" || /^-+$/.test(id)) continue; // header/separator row
    map.set(id, url);
  }
  return map;
}

/** Statically extracts `export const RENDERED_CLAIMS = [...]` from a screen source. */
function parseRenderedClaims(src) {
  const m = src.match(/export const RENDERED_CLAIMS\s*=\s*\[([\s\S]*?)\]/);
  if (!m) return null;
  const ids = [];
  const strRe = /"([^"]+)"|'([^']+)'/g;
  let sm;
  while ((sm = strRe.exec(m[1]))) ids.push(sm[1] || sm[2]);
  return ids;
}

function setEq(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

// ---------------------------------------------------------------------------
// K10.8 - uniqueness of the canonical anchor `#claim-<id>`.
// Why: a live browser smoke test once found duplicate id="claim-c*" elements in the DOM
// after expanding "All sources" (c1/c5..c12 twice, the two-screen entries c2/c3/c4
// three times). A duplicate id is invalid HTML and breaks exactly what #claim-<id>
// must guarantee: one address -> one element. So the rule is enforced here, not by a
// string grep (brittle under refactoring) but by a REAL run of js/core/sources.mjs
// through a minimal DOM shim (no jsdom - not worth a dependency for one test): the
// real renderSources() is executed for each of the three screens and the actual
// id="claim-*" attributes in the resulting tree are counted.
// ---------------------------------------------------------------------------

class FakeNode {
  constructor(tag) {
    this.tagName = tag;
    this._attrs = {};
    this.id = "";
    this.className = "";
    this.children = [];
    this.dataset = {};
    this.classList = {
      add: (c) => {
        this.className = (this.className ? this.className + " " : "") + c;
      },
    };
  }
  set textContent(v) {
    this._text = v;
    this.children = [];
  }
  get textContent() {
    return this._text ?? "";
  }
  set innerHTML(v) {
    this._html = v;
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  setAttribute(key, value) {
    this._attrs[key] = value;
    if (key === "id") this.id = value;
  }
  addEventListener() {}
}

function fakeDocument() {
  return {
    createElement: (tag) => new FakeNode(tag),
    documentElement: { lang: "en" },
    body: new FakeNode("body"),
    createTextNode: (s) => ({ text: s }),
  };
}

/** Walks a FakeNode tree, returning every `id` attribute matching /^claim-/. */
function collectClaimIds(node, out) {
  if (!node || typeof node !== "object") return;
  if (node.id && /^claim-/.test(node.id)) out.push(node.id);
  for (const child of node.children || []) collectClaimIds(child, out);
}

async function checkAnchorUniqueness(root) {
  const prevDocument = globalThis.document;
  const prevWindow = globalThis.window;
  globalThis.document = fakeDocument();
  globalThis.window = { addEventListener() {} };
  // navigator is left untouched — Node >=21 defines a getter-only global.navigator and
  // this check never invokes copyText() (that only runs from a click handler, never
  // during rendering), so it doesn't need a navigator shim at all.
  try {
    const sourcesPath = path.join(root, "js", "core", "sources.mjs");
    const cacheBust = `?t=${Date.now()}-${Math.random()}`;
    const { renderSources } = await import(pathToFileURL(sourcesPath).href + cacheBust);
    const dataMod = await import(pathToFileURL(path.join(root, "js", "data", "claims.mjs")).href + cacheBust);
    const { CLAIMS } = dataMod;

    const screensDir = path.join(root, "js", "screens");
    const allIds = [];
    for (const [screen, file] of Object.entries(SCREEN_FILES)) {
      const src = fs.readFileSync(path.join(screensDir, file), "utf8");
      const claimIds = parseRenderedClaims(src) || [];
      const tree = renderSources({
        screenId: screen,
        screenFile: `${screen}.html`,
        screenTitle: screen,
        claimIds,
        allOpen: true, // force "All sources" open — that's exactly where the bug lived
        citeOpen: false,
        onToggleAll: () => {},
        onToggleCite: () => {},
        highlightId: null,
      });
      const idsOnThisScreen = [];
      collectClaimIds(tree, idsOnThisScreen);
      allIds.push({ screen, ids: idsOnThisScreen });
    }

    const messages = [];
    let failed = false;
    for (const { screen, ids } of allIds) {
      const counts = new Map();
      for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1);
      const dupes = [...counts.entries()].filter(([, n]) => n > 1);
      if (dupes.length) {
        failed = true;
        messages.push(
          `K10.8 (${screen}.html, All sources open): duplicate DOM ids — ${dupes.map(([id, n]) => `${id}×${n}`).join(", ")}.`,
        );
      }
      const expected = CLAIMS.length;
      const distinct = new Set(ids).size;
      if (distinct !== expected) {
        failed = true;
        messages.push(`K10.8 (${screen}.html): expected ${expected} distinct claim-<id> anchors in the full registry, found ${distinct}.`);
      }
    }
    return { failed, messages };
  } finally {
    globalThis.document = prevDocument;
    globalThis.window = prevWindow;
  }
}

const NAME_PATTERNS = [
  /SHA3-\d+/gi,
  /SHA-?\d+/gi, // covers both "SHA-256" and "sha256(...)"
  /Keccak-\d+/gi,
  /FIPS\s\d+/gi,
  /RFC\s\d+/gi,
  /CVE-\d{4}-\d+/gi,
  /EIP-\d+/gi,
  /SEC\s\d/gi,
  /secp256k1/gi,
  /ML-DSA-\d+/gi,
  /SLH-DSA-\d+s/gi,
  /27C3/gi,
  /\b(19|20)\d\d\b/g, // years
  /\{[a-zA-Z0-9]+\}/g, // {placeholder}
];

export async function runClaimsGate({ root, release = false }) {
  const messages = [];
  let failed = false;
  const fail = (msg) => {
    failed = true;
    messages.push(`✗ ${msg}`);
  };
  const ok = (msg) => messages.push(`✓ ${msg}`);

  const claimsMdPath = path.join(root, "docs", "PROVENANCE.md");
  const claimsDataPath = path.join(root, "js", "data", "claims.mjs");
  const sitePath = path.join(root, "js", "data", "site.mjs");
  const enPath = path.join(root, "js", "i18n", "en.js");
  const screensDir = path.join(root, "js", "screens");

  if (!fs.existsSync(claimsMdPath) || !fs.existsSync(claimsDataPath)) {
    fail("K10: docs/PROVENANCE.md or js/data/claims.mjs not found.");
    return { failed, messages };
  }

  const claimsMdText = fs.readFileSync(claimsMdPath, "utf8");
  const cacheBust = `?t=${Date.now()}`;
  const dataMod = await import(pathToFileURL(claimsDataPath).href + cacheBust);
  const siteMod = await import(pathToFileURL(sitePath).href + cacheBust);
  const enMod = await import(pathToFileURL(enPath).href + cacheBust);

  const { CLAIMS, SOURCES, SCREEN_COVERAGE, ALLOWED_LITERALS, FIGURES } = dataMod;
  const { SITE } = siteMod;
  const en = enMod.default;

  // ---- K10.1: ID and source parity ---------------------------------------------
  const docIds = parseClaimsMdIds(claimsMdText);
  const dataIds = new Set(CLAIMS.map((c) => c.id));
  if (!setEq(docIds.nonDevOnly, dataIds)) {
    const missingInData = [...docIds.nonDevOnly].filter((id) => !dataIds.has(id));
    const extraInData = [...dataIds].filter((id) => !docIds.nonDevOnly.has(id));
    fail(
      `K10.1: ID parity broken. In the doc (not [dev-only]) but not in data: [${missingInData.join(", ")}]. ` +
        `In data but not in the doc (or marked [dev-only]): [${extraInData.join(", ")}].`,
    );
  }
  for (const c of CLAIMS) {
    if (!/^c\d+$/.test(c.id)) fail(`K10.1: id "${c.id}" does not match ^c\\d+$.`);
    if (docIds.all.has(c.id) && !docIds.nonDevOnly.has(c.id)) {
      fail(`K10.1: data entry "${c.id}" refers to a [dev-only] ID from docs/PROVENANCE.md - not allowed.`);
    }
  }

  const docSources = parseClaimsMdSources(claimsMdText);
  const dataSourceIds = new Set(Object.keys(SOURCES));
  const docSourceIds = new Set(docSources.keys());
  if (!setEq(docSourceIds, dataSourceIds)) {
    const missing = [...docSourceIds].filter((id) => !dataSourceIds.has(id));
    const extra = [...dataSourceIds].filter((id) => !docSourceIds.has(id));
    fail(`K10.1: source parity broken. In the doc, not in data: [${missing.join(", ")}]. In data, not in the doc: [${extra.join(", ")}].`);
  } else {
    for (const [id, url] of docSources) {
      if (SOURCES[id].url !== url) fail(`K10.1: URL of source "${id}" differs. doc="${url}" data="${SOURCES[id].url}".`);
    }
  }
  if (!failed) ok("K10.1: ID and source parity with docs/PROVENANCE.md - OK.");

  // ---- K10.2: zero entries without a locator -----------------------------------
  let k102ok = true;
  for (const c of CLAIMS) {
    if (!Array.isArray(c.refs) || c.refs.length === 0) {
      fail(`K10.2: entry "${c.id}" has no ref at all.`);
      k102ok = false;
      continue;
    }
    for (const ref of c.refs) {
      if (!ref.at || !ref.at.trim()) {
        fail(`K10.2: a ref of entry "${c.id}" (src=${ref.src}) has an empty locator (at).`);
        k102ok = false;
      }
      if (!ref.src || !SOURCES[ref.src]) {
        fail(`K10.2: a ref of entry "${c.id}" has src="${ref.src}", which does not exist in SOURCES.`);
        k102ok = false;
      }
    }
  }
  if (k102ok) ok("K10.2: every entry has a locator.");

  // ---- K10.3: triple coverage cross-check --------------------------------------
  let k103ok = true;
  const claimTextKeys = new Set(CLAIMS.map((c) => c.textKey));
  for (const [screen, file] of Object.entries(SCREEN_FILES)) {
    const screenPath = path.join(screensDir, file);
    if (!fs.existsSync(screenPath)) {
      fail(`K10.3: screen ${file} not found.`);
      k103ok = false;
      continue;
    }
    const src = fs.readFileSync(screenPath, "utf8");
    const rendered = parseRenderedClaims(src);
    if (!rendered) {
      fail(`K10.3: RENDERED_CLAIMS not found or not a literal array in ${file}.`);
      k103ok = false;
      continue;
    }
    const renderedSet = new Set(rendered);
    const registrySet = new Set(CLAIMS.filter((c) => c.screens.includes(screen)).map((c) => c.id));
    const expectedCount = SCREEN_COVERAGE[screen];

    if (!setEq(renderedSet, registrySet)) {
      const onlyRendered = [...renderedSet].filter((id) => !registrySet.has(id));
      const onlyRegistry = [...registrySet].filter((id) => !renderedSet.has(id));
      fail(
        `K10.3 (${screen}): RENDERED_CLAIMS != registry. Only in RENDERED_CLAIMS: [${onlyRendered.join(", ")}]. ` +
          `Only in the registry: [${onlyRegistry.join(", ")}].`,
      );
      k103ok = false;
    }
    if (rendered.length !== expectedCount) {
      fail(`K10.3 (${screen}): SCREEN_COVERAGE=${expectedCount}, but RENDERED_CLAIMS.length=${rendered.length}.`);
      k103ok = false;
    }
    if (registrySet.size !== expectedCount) {
      fail(`K10.3 (${screen}): SCREEN_COVERAGE=${expectedCount}, but the registry yields ${registrySet.size} entries.`);
      k103ok = false;
    }
  }
  // Dangling textKeys (entry exists, key missing from en.js) and orphan claim.* keys (key exists, no entry uses it).
  for (const key of claimTextKeys) {
    if (!(key in en)) {
      fail(`K10.3: textKey "${key}" not found in js/i18n/en.js (dangling key).`);
      k103ok = false;
    }
  }
  const claimKeysInEn = Object.keys(en).filter((k) => k.startsWith("claim."));
  for (const key of claimKeysInEn) {
    if (!claimTextKeys.has(key)) {
      fail(`K10.3: key "${key}" in en.js is not used by any registry entry (orphan).`);
      k103ok = false;
    }
  }
  if (k103ok) ok("K10.3: RENDERED_CLAIMS == registry == SCREEN_COVERAGE on all three screens, zero orphan/dangling keys.");

  // ---- K10.4a/b: numbers -------------------------------------------------------
  const enValues = Object.values(en).filter((v) => typeof v === "string");
  let k104aOk = true;
  const figureValues = new Set(Object.values(FIGURES || {}).map(String));
  for (const [name, value] of Object.entries(FIGURES || {})) {
    const re = new RegExp(`(?<![\\w.])${value}(?![\\w.])`);
    for (const v of enValues) {
      if (re.test(v)) {
        fail(`K10.4a: figures.${name}=${value} appears as a literal in the dictionary ("${v.slice(0, 60)}…").`);
        k104aOk = false;
      }
    }
  }
  if (k104aOk) ok("K10.4a: no figures value is hard-coded as a literal in the dictionary.");

  let k104bOk = true;
  const allowedKeys = new Set(Object.keys(ALLOWED_LITERALS || {}));
  for (const v of enValues) {
    let stripped = v;
    for (const pat of NAME_PATTERNS) stripped = stripped.replace(pat, "");
    const numRe = /\d{2,}/g;
    let nm;
    while ((nm = numRe.exec(stripped))) {
      const num = nm[0];
      if (figureValues.has(num) || allowedKeys.has(num)) continue;
      fail(`K10.4b: unexplained number "${num}" in the dictionary ("${v.slice(0, 60)}…") - not in figures nor in ALLOWED_LITERALS.`);
      k104bOk = false;
    }
  }
  if (k104bOk) ok("K10.4b: no unexplained numbers in the product prose.");

  // ---- K10.5: js/data/** is data, not code -------------------------------------
  let k105ok = true;
  for (const p of [claimsDataPath, sitePath]) {
    const stripped = stripJsComments(fs.readFileSync(p, "utf8"));
    if (/\bfunction\b/.test(stripped) || /=>/.test(stripped) || /\bimport /.test(stripped)) {
      fail(`K10.5: logic/import outside comments in ${path.relative(root, p)}.`);
      k105ok = false;
    }
  }
  if (k105ok) ok("K10.5: js/data/** is data only (zero function/=>/import outside comments).");

  // ---- K10.6: registry version -------------------------------------------------
  const freshHash = sha256File(claimsDataPath);
  if (freshHash !== SITE.registrySha256) {
    fail(
      `K10.6: SITE.registrySha256 does not match js/data/claims.mjs.\n  recorded: ${SITE.registrySha256}\n  fresh:    ${freshHash}\n` +
        `  Update registrySha256 AND contentVersion together (js/data/site.mjs).`,
    );
  } else {
    ok("K10.6: SITE.registrySha256 is up to date.");
  }

  // ---- K10.8: uniqueness of the canonical anchor #claim-<id> -------------------
  const anchorResult = await checkAnchorUniqueness(root);
  for (const m of anchorResult.messages) fail(m);
  if (!anchorResult.failed) ok("K10.8: the canonical id=\"claim-<id>\" occurs exactly once on each screen (real render).");

  // ---- K10.9: regression guard for two plausible-but-wrong locators -------------
  // Both look like reasonable guesses and both are wrong. FIPS 202 s5.1 exists and is
  // about padding, but that part is COMMON to SHA-3 and Keccak, not the difference
  // (the difference is s6.1 + Appendix B.2). Lamport's CSL-98 exists and is about
  // one-time signatures, but it describes a 40-key / 20-subset scheme, not the
  // per-bit construction the screen actually shows (that one is Diffie-Hellman 1976,
  // s IV). A rule that failed once belongs in a gate, not in someone's memory, because
  // "restoring the previous wording" looks like a harmless revert rather than like
  // corrupting a fact.
  const c11 = CLAIMS.find((c) => c.id === "c11");
  const c21 = CLAIMS.find((c) => c.id === "c21");
  let k109ok = true;

  if (c11) {
    const fips202Ref = c11.refs.find((r) => r.src === "FIPS202");
    if (fips202Ref && /§\s*5\.1/.test(fips202Ref.at)) {
      fail(
        "K10.9: c11's FIPS202 ref points to s5.1 again - that section (pad10*1) is COMMON to SHA-3 and original Keccak, " +
          "it is not the difference. The correct locator for domain separation is s6.1 + Appendix B.2 Table 6 (docs/PROVENANCE.md C-11).",
      );
      k109ok = false;
    }
  }

  if (c21) {
    const lamportRef = c21.refs.find((r) => r.src === "LAMPORT79");
    if (!lamportRef || !/NOT in this report/i.test(lamportRef.at)) {
      fail(
        "K10.9: c21's LAMPORT79 ref lost its caveat that the per-bit construction is absent from Lamport's CSL-98 report - " +
          "the report was read in full: s2 describes a 40-key / 20-subset scheme, not secret-pairs-per-bit. " +
          "The ref is kept ON PURPOSE (do not delete it) to record this negative fact, " +
          'and its `at` must say explicitly that the construction is NOT in the report (docs/PROVENANCE.md C-21).',
      );
      k109ok = false;
    }
    const hasDH76 = c21.refs.some((r) => r.src === "DH76");
    if (!hasDH76) {
      fail(
        "K10.9: c21 lost its ref to DH76 - the only verified primary source of the per-bit construction " +
          "(Diffie-Hellman 1976 s IV \"One-Way Authentication\", p. 650, which attributes it to Lamport in its own text, " +
          "so the name on screen stays correct). Without it the anchor screen for C-21 is backed only by a " +
          "document that describes a different scheme (docs/PROVENANCE.md C-21).",
      );
      k109ok = false;
    }
  }
  if (k109ok) ok("K10.9: c11/FIPS202 has not regressed to s5.1; c21 keeps the Lamport caveat and the DH76 ref.");

  // ---- K10.10: numbers in the HTML <head> metatags (title/description/OG/Twitter) -
  // Metatags are product claims visible to users in search results and link previews,
  // but historically sat OUTSIDE every gate: K8(2) scans *.html only for Cyrillic, and
  // K10.4a/4b scan only js/i18n/*.js. Same principle as K10.4b: any number with 2+
  // digits in title/description/og:*/twitter:* must be a value from FIGURES or be in
  // ALLOWED_LITERALS with a reason - otherwise nobody verifies it and it can silently
  // drift from what the screen actually shows.
  const htmlFilesForMeta = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => path.join(root, e.name));

  function extractHtmlMetaTexts(htmlText) {
    const texts = [];
    const titleMatch = htmlText.match(/<title>([\s\S]*?)<\/title>/i);
    if (titleMatch) texts.push({ label: "title", text: titleMatch[1] });
    const metaRe = /<meta\s+[^>]*content="([^"]*)"[^>]*>/gi;
    let m;
    while ((m = metaRe.exec(htmlText))) {
      const tag = m[0];
      // Only the meta tags that carry user-facing prose — name=description/twitter:*
      // or property=og:* — not charset/viewport, which never carry a cited number.
      if (/(name|property)="(description|twitter:[a-z]+|og:[a-z]+)"/i.test(tag)) {
        const kindMatch = tag.match(/(?:name|property)="([^"]+)"/i);
        texts.push({ label: kindMatch ? kindMatch[1] : "meta", text: m[1] });
      }
    }
    return texts;
  }

  let k1010ok = true;
  for (const file of htmlFilesForMeta) {
    const relFile = path.relative(root, file).replace(/\\/g, "/");
    const html = fs.readFileSync(file, "utf8");
    for (const { label, text } of extractHtmlMetaTexts(html)) {
      let stripped = text;
      for (const pat of NAME_PATTERNS) stripped = stripped.replace(pat, "");
      const numRe = /\d{2,}/g;
      let nm;
      while ((nm = numRe.exec(stripped))) {
        const num = nm[0];
        if (figureValues.has(num) || allowedKeys.has(num)) continue;
        fail(
          `K10.10: unexplained number "${num}" in ${relFile} <${label}> ("${text.slice(0, 70)}…") - ` +
            "not in figures nor in ALLOWED_LITERALS.",
        );
        k1010ok = false;
      }
    }
  }
  if (k1010ok) ok("K10.10: no unexplained numbers in the HTML metatags (title/description/og/twitter).");

  // ---- K10.7: release-only (--release) ------------------------------------------
  if (release) {
    let k107ok = true;
    const unverified = CLAIMS.flatMap((c) => c.refs.filter((r) => !r.verified).map((r) => `${c.id}:${r.src}`));
    if (unverified.length) {
      fail(`K10.7: ${unverified.length} unverified locators (verified:false): ${unverified.join(", ")}.`);
      k107ok = false;
    }
    if (!SITE.canonicalBase || !SITE.canonicalBase.startsWith("https://")) {
      fail(`K10.7: SITE.canonicalBase is empty or not https:// ("${SITE.canonicalBase}").`);
      k107ok = false;
    }
    if (SITE.author !== "The Signature Explorer (anaexplores)") {
      fail(`K10.7: SITE.author differs from the reference value ("${SITE.author}").`);
      k107ok = false;
    }
    if (!SITE.licenseContent || !SITE.licenseCode) {
      fail("K10.7: licenseContent/licenseCode are empty.");
      k107ok = false;
    }
    if (!fs.existsSync(path.join(root, "LICENSE")) || !fs.existsSync(path.join(root, "LICENSE-CONTENT"))) {
      fail("K10.7: LICENSE and/or LICENSE-CONTENT are missing from the repository root.");
      k107ok = false;
    }
    // Seam guard: the address lives in SITE.canonicalBase AND as static text in each HTML.
    if (SITE.canonicalBase && SITE.canonicalBase.startsWith("https://")) {
      const base = SITE.canonicalBase.replace(/\/$/, "");
      const getTag = (html, re) => (html.match(re) || [])[1];
      for (const page of ["index.html", "ecdsa.html", "hash.html"]) {
        const file = path.join(root, page);
        if (!fs.existsSync(file)) continue;
        const html = fs.readFileSync(file, "utf8");
        const want = `${base}/${page}`;
        const checks = [
          ["canonical href", getTag(html, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i), want],
          ["og:url content", getTag(html, /<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["']/i), want],
        ];
        for (const [label, got, exp] of checks) {
          if (got !== exp) {
            fail(`K10.7: ${page} static ${label} is "${got}", expected "${exp}" (SITE.canonicalBase seam).`);
            k107ok = false;
          }
        }
        const imgs = [
          ["og:image", getTag(html, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i)],
          ["twitter:image", getTag(html, /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i)],
        ];
        for (const [label, got] of imgs) {
          if (!got || !got.startsWith(SITE.canonicalBase)) {
            fail(`K10.7: ${page} ${label} ("${got}") must start with SITE.canonicalBase.`);
            k107ok = false;
          } else {
            const rel = got.slice(SITE.canonicalBase.length);
            if (!rel || !fs.existsSync(path.join(root, rel))) {
              fail(`K10.7: ${page} ${label} points to "${rel}", which does not exist in the repository.`);
              k107ok = false;
            }
          }
        }
      }
    }
    if (k107ok) ok("K10.7 (release): zero verified:false, canonicalBase/author/licenses in place.");
  }

  return { failed, messages };
}
