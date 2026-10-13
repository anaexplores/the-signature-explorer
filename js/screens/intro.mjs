// js/screens/intro.mjs — S0 entry point. UI only — crypto
// exclusively via js/schemes/ecdsa.mjs (K7): same real ECDSA module S1 uses, on a FIXED
// demo key (real ECDSA on a fixed demo key, the same module as
// S1). Bundled by tools/build.mjs into build/intro.js (classic IIFE).
//
// Build-integrity note: an early smoke page rendered a
// large sha256('abc') MATCH/MISMATCH banner as the entire page, to prove file:// +
// classic-script + ESM-source bundling works before any real screen existed. That page
// is gone now that S0 is the real intro — but the live proof it gave is NOT dropped: a
// tiny monospace line in this screen's footer ("build integrity: sha256('abc') ✓")
// recomputes the same digest through the same real crypto path (js/schemes/ecdsa.mjs's
// hashMessage/toHex, which call the bundled js/vendor/noble.mjs) every time index.html
// loads from disk. K9 (`tools/build.mjs --check`) is the automated half of this gate;
// this line is the "anyone can eyeball it without DevTools" half, just no longer a full
// page — S0 has real content to show now.
// (This preserves the original live-proof requirement.)

import { keygen, sign, verify, hashMessage, toHex } from "../schemes/ecdsa.mjs";
import { el, mount } from "../core/dom.mjs";
import { t } from "../i18n/index.mjs";
import { renderLens } from "../core/lens.mjs";
import { renderSources, initSourcesHash } from "../core/sources.mjs";
import { FIGURES } from "../data/claims.mjs";
import { markSeen, markDone } from "../core/progress.mjs";
import { renderProgressHeader } from "../core/progress-header.mjs";
import { injectCanonicalMeta } from "../core/site-meta.mjs";

const SCREEN_ID = "s0";

// Provenance registry input: the claims THIS screen shows, in the order
// they're shown — also the actual K10.3 render-input, not a decorative duplicate.
export const RENDERED_CLAIMS = ["c2", "c3", "c4", "c14", "c15", "c16", "c17", "c18", "c19", "c20"];
const DEFAULT_MESSAGE = "I authorize this payment";
const EXPECTED_SHA256_ABC = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

// Fixed demo key — same js/schemes/ecdsa.mjs keygen(), just with an rng
// that always returns the same 32 bytes, so the "Sign it" demo is reproducible instead
// of a fresh random key on every load.
const DEMO_PRIV_BYTES = Uint8Array.from({ length: 32 }, (_, i) => i + 1);
const demoKeys = keygen({ rng: () => DEMO_PRIV_BYTES });

let msg = DEFAULT_MESSAGE;
let signedChars = null; // frozen char array of the message AT THE TIME of signing
let sig = null;
let showKey = false;
let expandedTile = null; // index of the currently expanded lens tile, or null
let sourcesAllOpen = false;
let citeOpen = false;
let highlightClaimId = null;

function toggleSourcesAll() {
  sourcesAllOpen = !sourcesAllOpen;
  render();
}

function toggleCite() {
  citeOpen = !citeOpen;
  render();
}

function highlightClaim(id) {
  highlightClaimId = id;
  sourcesAllOpen = true;
  render();
  requestAnimationFrame(() => {
    document.getElementById(`claim-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  setTimeout(() => {
    highlightClaimId = null;
    render();
  }, 2000);
}

initSourcesHash({
  onOpenAll: () => {
    sourcesAllOpen = true;
    render();
  },
  onHighlight: highlightClaim,
});

function onMsgInput(value) {
  msg = value;
  render();
}

function signIt() {
  signedChars = Array.from(msg);
  sig = sign(demoKeys.priv, hashMessage(signedChars.join("")));
  render();
}

// "Done" rule for S0: signed AND tampered with at least one character.
let tampered = false;

function tamperChar(i) {
  if (!signedChars) return;
  const code = signedChars[i].codePointAt(0);
  signedChars[i] = String.fromCodePoint(code ^ 1); // flip one bit — guaranteed different char
  tampered = true;
  if (sig && tampered) markDone(SCREEN_ID);
  render();
}

function toggleShowKey() {
  showKey = !showKey;
  render();
}

function toggleTile(i) {
  expandedTile = expandedTile === i ? null : i;
  render();
}

function renderMetamaskAnchor() {
  return el("div.card", {}, [
    el("div.pill.good", { text: t("s0.metamask.card") }),
    el("p.mt-4", { text: t("s0.metamask.anchor") }),
  ]);
}

function renderSignCard() {
  const hashHex = toHex(hashMessage(msg)).slice(0, 16);
  const signedText = signedChars ? signedChars.join("") : null;
  const ok = signedText !== null ? verify(demoKeys.pub, hashMessage(signedText), sig) : null;

  const children = [
    el("div.gh.mb-2", { text: t("s0.msg.label") }),
    el("input.field", {
      id: "s0-msg-input",
      value: msg,
      oninput: (e) => onMsgInput(e.target.value),
    }),
    el("p.note.mt-2", { text: `${t("s0.hash.label")} ` }),
    el("code.mono", { text: hashHex }),
    el("div.row.mt-4", {}, [el("button", { onclick: signIt, text: t("s0.sign.button") })]),
  ];

  if (signedChars) {
    children.push(
      el("p.note.mt-4", { text: t("s0.tamper.hint") }),
      el(
        "div.msg",
        {},
        signedChars.map((ch, i) =>
          el("button.bit.bit-wide", {
            text: ch === " " ? " " : ch,
            onclick: () => tamperChar(i),
          }),
        ),
      ),
      el(`p.pill.mt-4${ok ? ".good" : ".bad"}`, { text: ok ? t("s0.verify.ok") : t("s0.verify.fail") }),
    );
  }

  return el("div.card", {}, children);
}

function renderShowKeyCard() {
  return el("div.card", {}, [
    // Disclosure widget (accessibility: was missing aria-expanded,
    // same finding/fix as js/screens/ecdsa.mjs's nonce-reuse toggle).
    el("div.row", {}, [el("button.ghost", { "aria-expanded": String(showKey), onclick: toggleShowKey, text: t("s0.showKey.button") })]),
    showKey
      ? el("div.mt-4", {}, [
          el("div.gh", { text: t("s0.showKey.label", { ecdsaPrivBytes: FIGURES.ecdsaPrivBytes }) }),
          el("code.mono", { text: toHex(demoKeys.d) }),
          el("p.note.mt-2", { text: t("s0.showKey.note") }),
        ])
      : null,
  ]);
}

function renderLensCard() {
  const tiles = [
    { questionKey: "lens.q1", hintKey: "s0.lens.hint" },
    { questionKey: "lens.q2", hintKey: "s0.lens.hint" },
    { questionKey: "lens.q3", hintKey: "s0.lens.hint" },
  ].map((tile, i) => ({ ...tile, expanded: expandedTile === i, onToggle: () => toggleTile(i) }));
  return renderLens({ tiles });
}

function renderLanding() {
  return el("div.card", {}, [
    el("p.note", { text: t("s0.landing.nft") }),
    el("p.note.mt-2", { text: t("s0.landing.everyday") }),
    el("p.note.mt-2", {
      text: t("s0.landing.pqLive", { mldsa44SigBytes: FIGURES.mldsa44SigBytes, ecdsaSigBytes: FIGURES.ecdsaSigBytes }),
    }),
    // One-line pointer to the exercise track on S1/S2 — S0 mounts no
    // task instance of its own (no mechanic of its own to attach one to), just a signpost.
    el("p.note.mt-2", { text: t("s0.task.pointer") }),
  ]);
}

function renderSourcesSection() {
  return renderSources({
    screenId: SCREEN_ID,
    screenFile: "index.html",
    screenTitle: t("s0.title"),
    claimIds: RENDERED_CLAIMS,
    allOpen: sourcesAllOpen,
    citeOpen,
    onToggleAll: toggleSourcesAll,
    onToggleCite: toggleCite,
    highlightId: highlightClaimId,
  });
}

function renderNext() {
  return el("div.row.next-row", {}, [
    el("a.next-link", { href: "ecdsa.html", text: t("s0.next.label") }),
  ]);
}

function renderBuildIntegrity() {
  const computed = toHex(hashMessage("abc"));
  const ok = computed === EXPECTED_SHA256_ABC;
  return el("p.note.build-integrity", {
    text: `${t("build.integrityLabel")} ${ok ? t("build.integrityMatch") : t("build.integrityMismatch")}`,
  });
}

function render() {
  const root = document.getElementById("app") || document.body;
  const active = document.activeElement;
  const focused = active && active.id === "s0-msg-input";
  const selStart = focused ? active.selectionStart : null;
  const selEnd = focused ? active.selectionEnd : null;

  const header = el("div", {}, [el("h1", { text: t("s0.title") }), el("p.sub", { text: t("s0.subtitle") })]);
  const tree = el("div", {}, [
    renderProgressHeader({ screenId: SCREEN_ID, render }),
    header,
    renderMetamaskAnchor(),
    renderSignCard(),
    renderShowKeyCard(),
    renderLanding(),
    renderLensCard(),
    renderSourcesSection(),
    renderNext(),
    renderBuildIntegrity(),
  ]);
  mount(root, tree);

  if (focused) {
    const input = document.getElementById("s0-msg-input");
    if (input) {
      input.focus();
      try {
        input.setSelectionRange(selStart, selEnd);
      } catch {
        /* ignore */
      }
    }
  }
}

injectCanonicalMeta("index.html");
markSeen(SCREEN_ID);
render();
