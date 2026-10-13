#!/usr/bin/env node
// K5 audit: automates the mobile-layout criterion (390px, no horizontal scroll, tap targets >= 44px).
//
// WHY THIS EXISTS: K5 ("390px, no horizontal scroll, tap targets >=44px") was the only
// acceptance criterion with no machine gate — everything else (crypto correctness,
// Cyrillic, registry parity, deep-link anchors, numbers in metatags) fails on its own;
// mobile layout was checked by hand, and hands check what they remember to check. A
// real regression (S0's post-"Sign it" character row had no `flex-wrap`, 995px scroll
// width on a 375px viewport) shipped and was only caught by an outside reviewer, after
// the author's own manual passes missed it - because the bug only appears after a
// click, and the manual check was done before clicking "Sign it".
// This script closes that hole by driving a real click scenario in a real headless
// browser and re-measuring after EVERY step, not just at the end or on page load.
//
// BROWSER CHOICE: Playwright over Puppeteer. Both wrap Chromium adequately; Playwright
// was chosen for (a) built-in auto-waiting on actionability (less flaky click/measure
// timing than hand-rolled waits), (b) one API across the `channel` fallback chain used
// below (bundled Chromium -> system Chrome -> system Edge), which Puppeteer does not
// offer as cleanly, (c) it is the more actively maintained of the two as of this
// writing. Pinned exactly in package.json (no ^/~), same discipline as esbuild.
//
// WHY NOT IN THE DEFAULT `check.mjs` RUN: a full 3-page, multi-step, real-browser pass
// takes real wall-clock time - noticeably more than the rest of `check.mjs` combined.
// Forcing that cost onto every `node tools/checks/check.mjs` invocation (the command
// run constantly during development) would tempt people to skip or disable the gate,
// and a gate that gets disabled is worse than no gate. Instead: `check.mjs` only
// invokes this script under `--release`, where the cost is paid once, deliberately,
// at a natural checkpoint.
//
// BROWSER-PRESENCE POLICY: no usable Chromium found ->
//   - default / non-strict invocation: print a loud warning, treat as SKIPPED (not
//     failed) — a missing devDependency should never silently look like "K5 passed".
//   - `--strict` (what `check.mjs --release` passes): no browser = FAIL. A release
//     cannot claim "K5 verified" without having actually run it.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..", ".."); // <project>/tools/checks/lib -> <project>

// K5's own number. See runK5Audit()'s doc comment below for why 320px is
// deliberately NOT also run as a second gated width.
const VIEWPORT = { width: 390, height: 844 };
const MIN_TAP_TARGET = 44;

const PAGES = [
  {
    file: "index.html",
    label: "S0 (index.html)",
    steps: [
      { label: "page loaded", action: async () => {} },
      { label: 'click "Sign it"', action: async (page) => clickButton(page, "Sign it") },
      {
        label: "click a tampered-message character tile",
        action: async (page) => page.locator(".msg button").first().click(),
      },
      { label: 'click "Show the private key"', action: async (page) => clickButton(page, "Show the private key") },
      { label: "expand the first lens tile", action: async (page) => page.locator(".lens-tile").first().click() },
    ],
  },
  {
    file: "ecdsa.html",
    label: "S1 (ecdsa.html)",
    steps: [
      { label: "page loaded", action: async () => {} },
      { label: 'click "Generate a key pair"', action: async (page) => clickButton(page, "Generate a key pair") },
      { label: 'click "Sign"', action: async (page) => clickButton(page, "Sign") },
      {
        label: 'click "Switch on a quantum computer"',
        action: async (page) => clickButton(page, "Switch on a quantum computer"),
      },
      {
        label: 'click "What if the same nonce is used twice?"',
        action: async (page) => clickButton(page, "What if the same nonce is used twice?"),
      },
    ],
  },
  {
    file: "hash.html",
    label: "S2 (hash.html)",
    steps: [
      { label: "page loaded", action: async () => {} },
      { label: 'click "Generate a key pair"', action: async (page) => clickButton(page, "Generate a key pair") },
      { label: 'click "Sign this message" (1st time)', action: async (page) => clickButton(page, "Sign this message") },
      { label: "flip two message bits", action: async (page) => flipBits(page, 2) },
      { label: 'click "Sign this message" (2nd time)', action: async (page) => clickButton(page, "Sign this message") },
      {
        label: 'click "Forge a message nobody ever signed"',
        action: async (page) => clickButton(page, "Forge a message nobody ever signed"),
      },
      {
        label: "expand block B step 1 (XMSS)",
        action: async (page) => clickButton(page, "Fine — can't I just remember which key I already burned?"),
      },
      {
        label: "expand block B step 2 (FORS)",
        action: async (page) =>
          clickButton(page, "And if I do lose the counter — can I tolerate a few repeats?"),
      },
      { label: "expand block B step 3 (SLH-DSA)", action: async (page) => clickButton(page, "Can I remember nothing at all?") },
      { label: 'expand "All sources"', action: async (page) => clickButton(page, "All sources — every claim in this tool") },
      { label: 'expand "Cite this page"', action: async (page) => clickButton(page, "Cite this page") },
    ],
  },
];

async function clickButton(page, exactText) {
  await page.getByRole("button", { name: exactText, exact: true }).first().click();
}

async function flipBits(page, count) {
  const bits = page.locator(".msg button");
  const n = Math.min(count, await bits.count());
  for (let i = 0; i < n; i++) await bits.nth(i).click();
}

/** Runs inside the page — measures overflow + tap targets against the live DOM. */
function measureInPage(minTap) {
  const scrollWidth = document.documentElement.scrollWidth;
  const clientWidth = document.documentElement.clientWidth;
  const smallTargets = [];
  document.querySelectorAll("button").forEach((btn) => {
    const style = getComputedStyle(btn);
    if (style.display === "none" || style.visibility === "hidden") return;
    const rect = btn.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return; // not actually rendered
    if (rect.width < minTap || rect.height < minTap) {
      smallTargets.push({
        text: (btn.textContent || "").trim().slice(0, 50),
        width: Math.round(rect.width * 10) / 10,
        height: Math.round(rect.height * 10) / 10,
      });
    }
  });
  return { scrollWidth, clientWidth, smallTargets };
}

async function launchBrowser(playwright) {
  const attempts = [
    { label: "bundled Chromium (playwright's own, pinned version)", options: {} },
    { label: "system Chrome (channel: chrome)", options: { channel: "chrome" } },
    { label: "system Edge (channel: msedge)", options: { channel: "msedge" } },
  ];
  let lastError;
  for (const attempt of attempts) {
    try {
      const browser = await playwright.chromium.launch(attempt.options);
      return { browser, launchedVia: attempt.label };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `no usable Chromium found (tried bundled Playwright Chromium, system Chrome, system Edge). Last error: ${lastError?.message}`,
  );
}

/**
 * @param {object} opts
 * @param {string} opts.root - repo root
 * @param {boolean} [opts.strict] - true => no browser is a FAILURE, not a skip
 *   (`check.mjs --release` passes this)
 * @returns {Promise<{failed:boolean, skipped:boolean, messages:string[], durationMs:number}>}
 *
 * Only 390px is gated (the K5 criterion's own number). 320px was tried during development as a
 * "worse than the spec requires" stress check and DROPPED from the gate: at 320px the
 * S2 grid's monospace hex values (`sk=1a2b3c4d`, `pk=5e6f7a8b`) sit right at the edge of
 * wrapping inside `.cell` and intermittently add 1-4px of scrollWidth depending on the
 * exact hex digits generated that run (word-break:break-all lets them wrap, but the
 * browser's own font-metrics rounding means it isn't perfectly stable frame to frame).
 * That is real information (390px is comfortably safe, 320px is right at the edge) but
 * it is NOT what K5 promises, and a flaky gate that fails ~1 run in 20 on
 * cosmetic sub-pixel rounding is worse than no 320px check at all (a gate that gets
 * disabled because of false alarms is worse than an absent one). Kept as a manual-only
 * note, not wired into the pass/fail gate.
 */
export async function runK5Audit({ root = ROOT, strict = false } = {}) {
  const messages = [];
  const start = Date.now();
  const fail = (msg) => messages.push(`✗ ${msg}`);
  const ok = (msg) => messages.push(`✓ ${msg}`);

  let playwright;
  try {
    playwright = await import("playwright");
  } catch {
    const msg =
      "K5 audit: playwright is not installed (devDependency missing from node_modules) - " +
      "tap targets / horizontal scroll at 390px were NOT checked.";
    if (strict) {
      fail(`${msg} Under --release this is a failure: a release cannot claim "K5 verified" without having run it.`);
      return { failed: true, skipped: false, messages, durationMs: Date.now() - start };
    }
    messages.push(`⚠️  ${msg} Run npm install (see package.json) + npx playwright install chromium to enable it.`);
    return { failed: false, skipped: true, messages, durationMs: Date.now() - start };
  }

  let browser, launchedVia;
  try {
    ({ browser, launchedVia } = await launchBrowser(playwright));
  } catch (err) {
    const msg = `K5 audit: ${err.message}`;
    if (strict) {
      fail(`${msg} Under --release this is a failure.`);
      return { failed: true, skipped: false, messages, durationMs: Date.now() - start };
    }
    messages.push(`⚠️  ${msg} Skipping (not --release).`);
    return { failed: false, skipped: true, messages, durationMs: Date.now() - start };
  }
  messages.push(`▶ K5 audit: browser - ${launchedVia}, viewport ${VIEWPORT.width}x${VIEWPORT.height}.`);

  let failed = false;
  try {
    // reducedMotion:'reduce' matters for correctness, not just speed: css/theme.css's
    // pop-in entrance animation (`--dur-base`, up to .5s, scales an element from .85 to
    // 1.05 before settling at 1 — e.g. the S2 forge-result card) can get measured
    // mid-bounce by a fixed short wait, producing a bounding box a few px smaller than
    // the button's real, settled size — a false positive, not a real tap-target bug
    // (confirmed by hand: a "getBoundingClientRect finds ~43px" run reproduced only
    // intermittently, and vanished once motion was suppressed). theme.css already
    // fully respects `prefers-reduced-motion` (built for real users, as an
    // accessibility requirement) - this reuses that existing support rather than
    // inventing a longer/fuzzier wait heuristic.
    const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: "reduce" });
    for (const pageDef of PAGES) {
      const filePath = path.join(root, pageDef.file);
      if (!fs.existsSync(filePath)) {
        fail(`K5 audit: ${pageDef.file} not found.`);
        failed = true;
        continue;
      }
      const page = await context.newPage();
      await page.goto(pathToFileURL(filePath).href);
      for (const step of pageDef.steps) {
        try {
          await step.action(page);
        } catch (err) {
          fail(`K5 audit ${pageDef.label} - step "${step.label}": action failed - ${err.message.split("\n")[0]}`);
          failed = true;
          continue;
        }
        // Let layout settle (fonts/transitions from css/theme.css) before measuring —
        // short and fixed, not a race: no animation added by this project exceeds this.
        await page.waitForTimeout(50);
        const { scrollWidth, clientWidth, smallTargets } = await page.evaluate(measureInPage, MIN_TAP_TARGET);
        if (scrollWidth > clientWidth) {
          fail(
            `K5 audit ${pageDef.label} - after step "${step.label}": horizontal scroll - ` +
              `scrollWidth=${scrollWidth} > clientWidth=${clientWidth}.`,
          );
          failed = true;
        }
        if (smallTargets.length) {
          fail(
            `K5 audit ${pageDef.label} - after step "${step.label}": ${smallTargets.length} tap target(s) ` +
              `< ${MIN_TAP_TARGET}px — ` +
              smallTargets.map((t) => `"${t.text}" ${t.width}x${t.height}`).join(", "),
          );
          failed = true;
        }
      }
      await page.close();
    }
    await context.close();
  } finally {
    await browser.close();
  }

  if (!failed) ok(`K5 audit: all three pages, ${VIEWPORT.width}px, zero horizontal scroll and zero tap targets < ${MIN_TAP_TARGET}px after every scenario step.`);
  return { failed, skipped: false, messages, durationMs: Date.now() - start };
}

// Runnable standalone: `node tools/checks/lib/k5-audit.mjs [--release]`.
// `--release` maps to `strict: true` (no browser = fail) - the same flag name check.mjs
// itself uses, so `node tools/checks/check.mjs --release` and a direct standalone run
// behave identically with respect to this script.
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const strict = process.argv.includes("--release") || process.argv.includes("--strict");
  const result = await runK5Audit({ root: ROOT, strict });
  for (const m of result.messages) console.log(m);
  console.log(`\n(K5 audit took ${(result.durationMs / 1000).toFixed(1)}s)`);
  process.exit(result.failed ? 1 : 0);
}
