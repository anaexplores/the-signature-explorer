// js/core/sources.mjs — "Where this comes from" + "Cite this page" component, shared by
// S0/S1/S2. Same contract as js/core/lens.mjs: pure render functions,
// ZERO state of its own (K7 — no crypto, no DOM state) — the calling screen owns the
// open/closed flags and re-renders, exactly like s1.nonceCardOpen already does.
//
// Data flow: js/data/claims.mjs (id, source, locator, verified, screens,
// figures) is the SSOT; js/i18n/en.js's `claim.<id>.text` carries the English sentence;
// this module only wires the two together for rendering. It never invents a claim.
//
// "All sources" is built lazily — the caller only passes `allOpen: true` once the
// panel is expanded (or the #sources/#claim-<id> deep-link asks for it), so the full
// registry's DOM does not exist in the initial page unless it's needed. It is still
// bundled either way (esbuild inlines the whole array), this is purely
// about not injecting duplicate text into the DOM of all three canonical pages.

import { el } from "./dom.mjs";
import { t } from "../i18n/index.mjs";
import { CLAIMS, SOURCES, FIGURES } from "../data/claims.mjs";
import { SITE } from "../data/site.mjs";

const SCREEN_ORDER = ["s0", "s1", "s2"];

function claimById(id) {
  return CLAIMS.find((c) => c.id === id) || null;
}

function claimsForScreen(screenId) {
  return CLAIMS.filter((c) => c.screens.includes(screenId));
}

/**
 * Renders one claim entry: statement, then its refs as "Document · locator [↗]".
 *
 * `canonical` controls the id ("#claim-<id>" is a PERMANENT, single anchor —
 * a claim printed into someone's syllabus points at exactly one element). Exactly one
 * caller in this file passes `canonical: true` (renderAllSourcesBlock, the full
 * registry) — the per-screen "Where this comes from" block renders the SAME content
 * with no id at all, so the id "claim-<id>" exists at most once in the DOM regardless
 * of how many screens a claim is declared on or how many blocks render it.
 */
function renderClaimEntry(claim, { canonical = false, highlighted = false } = {}) {
  if (!claim) return null;
  const text = t(claim.textKey, claim.figures ? pickFigures(claim.figures) : undefined);
  const kindLabel = t(`sources.kind.${claim.kind}`);
  const refNodes = claim.refs.map((ref) => {
    const source = SOURCES[ref.src];
    const docLabel = source ? source.title : ref.src;
    const children = [
      el("span", { text: `${kindLabel}: ` }),
      source
        ? el("a", {
            href: source.url,
            target: "_blank",
            rel: "noopener noreferrer",
            text: `${docLabel}, ${ref.at}`,
          })
        : el("span", { text: `${docLabel}, ${ref.at}` }),
    ];
    if (!ref.verified) {
      children.push(el("span.pill.pending-pill", { text: t("sources.pendingVerification") }));
    }
    return el("li", {}, children);
  });
  return el(
    `div.card.claim-card${highlighted ? ".claim-card--highlight" : ""}`,
    { id: canonical ? `claim-${claim.id}` : undefined },
    [
      el("p.claim-text", { text }),
      el("ul.claim-refs", {}, refNodes),
    ],
  );
}

/** figures object -> vars object usable by t(key, vars), reading current values from FIGURES. */
function pickFigures(figuresSpec) {
  const vars = {};
  for (const name of Object.keys(figuresSpec)) vars[name] = FIGURES[name];
  return vars;
}

/**
 * Always-expanded block: the claims THIS screen declares, in the order the screen
 * wants them shown. `claimIds` is the screen's own `RENDERED_CLAIMS` — also the actual
 * render input, not a decorative duplicate.
 *
 * These entries are NOT canonical: the same claim can
 * appear here on two screens (e.g. c2/c3/c4 on both S0 and S1), so this copy carries no
 * `id="claim-<id>"` — only the copy in "All sources" (renderAllSourcesBlock) does. A
 * deep-link always resolves through "All sources", never through this block.
 */
export function renderWhereFromBlock({ claimIds }) {
  const entries = claimIds.map((id) => renderClaimEntry(claimById(id), { canonical: false }));
  return el("div.card", { id: "sources" }, [
    el("div.gh.mb-3", { text: t("sources.title") }),
    el("div", {}, entries),
  ]);
}

/**
 * Collapsed-by-default panel: the FULL registry (S0+S1+S2), grouped by screen.
 *
 * A claim declared on more than one screen (c2/c3/c4 live on both s0 and s1) is grouped
 * under the FIRST screen it appears on (SCREEN_ORDER: s0 before s1 before s2) and
 * skipped in every later group — the registry shows every claim exactly once, and this
 * is the ONLY place in the whole page that ever emits `id="claim-<id>"` (the
 * anchor is permanent and must resolve to a single element).
 */
export function renderAllSourcesBlock({ open, onToggle, highlightId }) {
  const children = [
    el("button.ghost", {
      // String(open), not the raw boolean: js/core/dom.mjs#el() renders a `true`
      // boolean attribute as `aria-expanded=""` (empty value) and a `false` one by
      // omitting the attribute entirely — neither is a valid ARIA state (spec wants
      // the literal string "true"/"false"). Fixed here and in renderCiteBlock below
      // (accessibility fix) after the same fix was needed for the new
      // js/screens/hash.mjs block B toggles — corrected in both places for
      // consistency rather than leaving old and new code disagreeing.
      "aria-expanded": String(open),
      onclick: onToggle,
      text: t("sources.allTitle"),
    }),
  ];
  if (open) {
    const seen = new Set();
    const groups = SCREEN_ORDER.map((screenId) => {
      const claims = claimsForScreen(screenId).filter((c) => !seen.has(c.id));
      for (const c of claims) seen.add(c.id);
      if (claims.length === 0) return null;
      const entries = claims.map((c) => renderClaimEntry(c, { canonical: true, highlighted: c.id === highlightId }));
      return el("div.mt-4", {}, [
        el("div.gh.mb-2", { text: t(`sources.screenLabel.${screenId}`) }),
        el("div", {}, entries),
      ]);
    });
    children.push(el("div.mt-4", {}, groups));
  }
  return el("div.card.mt-4", {}, children);
}

/**
 * Resolves the citable URL — SITE.canonicalBase ONLY, never a fallback.
 * A `location.origin + pathname` fallback for the http(s) case would put a
 * live-but-temporary address — e.g.
 * `http://localhost:8321/hash.html#sources` — straight into a citation string. That is
 * exactly the failure this rule exists to prevent: a teacher copies the citation into a
 * syllabus, and it should not be able to name a preview/mirror/localhost address that
 * this deployment doesn't own permanently. The permanent address lives in one place,
 * `SITE.canonicalBase` in js/data/site.mjs; if it is ever unset, the citation is
 * honestly rendered WITHOUT a URL (cite.noUrlNote) rather than a plausible-looking wrong
 * one.
 */
/**
 * Generic version of the above: resolves ANY path+query+hash suffix against
 * SITE.canonicalBase, or null if the base isn't set yet. Exported so other callers that
 * need a "same honesty rule" address — e.g. js/core/task-ui.mjs's instructor assignment
 * link (canonicalBase must never be guessed, and the task
 * link builder must not invent a domain any more than a citation may) — reuse this exact
 * function instead of writing a second one (reuse-first).
 */
export function resolveCanonicalUrl(pathWithQueryAndHash) {
  if (!SITE.canonicalBase) return null;
  return `${SITE.canonicalBase.replace(/\/$/, "")}/${pathWithQueryAndHash}`;
}

function resolveUrl(screenFile) {
  return resolveCanonicalUrl(`${screenFile}#sources`);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function citationLine(screenId, screenFile, screenTitle) {
  const url = resolveUrl(screenFile);
  const accessed = todayIso();
  const base = `${SITE.author}. ${screenTitle}. Source registry version ${SITE.contentVersion}.`;
  const tail = `${t("cite.licenseNote")}`;
  if (url) return `${base} ${url} (${t("cite.accessedLabel")} ${accessed}). ${tail}`;
  return `${base} ${t("cite.noUrlNote")} (${t("cite.accessedLabel")} ${accessed}). ${tail}`;
}

function bibtexEntry(screenId, screenFile, screenTitle) {
  const url = resolveUrl(screenFile);
  const year = SITE.contentVersion.slice(0, 4);
  const key = `signatureexplorer_${screenId}_${year}`;
  const noteUrl = url ? url : t("cite.noUrlNote"); // never a hardcoded literal (K8) — same key as citationLine
  return [
    `@misc{${key},`,
    `  author  = {{${SITE.author}}},`,
    `  title   = {The Signature Explorer --- ${screenTitle}},`,
    `  year    = {${year}}, version = {${SITE.contentVersion}},`,
    `  url     = {${noteUrl}}, note = {Accessed ${todayIso()}. ${t("cite.licenseNote")}}`,
    `}`,
  ].join("\n");
}

/** Best-effort clipboard copy with soft degradation: Clipboard API is
 * unavailable by spec outside a secure context (file://, same class of restriction as
 * SubtleCrypto), so this always falls back to a hidden textarea + execCommand,
 * and the visible <pre> block underneath stays selectable regardless of either working. */
async function copyText(text, buttonEl, fallbackLabel) {
  let ok = false;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      ok = false;
    }
  }
  if (!ok && buttonEl) buttonEl.textContent = fallbackLabel;
}

/** Collapsed-by-default citation panel: one-line citation + BibTeX, both
 * always rendered as a visible, selectable block regardless of clipboard support. */
export function renderCiteBlock({ open, onToggle, screenId, screenFile, screenTitle }) {
  const children = [
    el("button.ghost", { "aria-expanded": String(open), onclick: onToggle, text: t("cite.title") }),
  ];
  if (open) {
    const line = citationLine(screenId, screenFile, screenTitle);
    const bibtex = bibtexEntry(screenId, screenFile, screenTitle);
    children.push(
      el("div.mt-4", {}, [
        el("code.cite-block", { id: "cite", text: line }),
        el("button.ghost.mt-2", {
          onclick: (e) => copyText(line, e.target, t("cite.selectAndCopy")),
          text: t("cite.copyCitation"),
        }),
      ]),
      el("div.mt-4", {}, [
        el("code.cite-block", { text: bibtex }),
        el("button.ghost.mt-2", {
          onclick: (e) => copyText(bibtex, e.target, t("cite.selectAndCopy")),
          text: t("cite.copyBibtex"),
        }),
      ]),
    );
  }
  return el("div.card.mt-4", {}, children);
}

/**
 * Top-level assembly: "Where this comes from" (always expanded, this screen's claims) +
 * "All sources" (collapsed) + "Cite this page" (collapsed). Mount this once per screen,
 * after the lens and before "Next →".
 */
export function renderSources({
  screenId,
  screenFile,
  screenTitle,
  claimIds,
  allOpen,
  citeOpen,
  onToggleAll,
  onToggleCite,
  highlightId,
}) {
  return el("div", {}, [
    renderWhereFromBlock({ claimIds }),
    renderAllSourcesBlock({ open: allOpen, onToggle: onToggleAll, highlightId }),
    renderCiteBlock({ open: citeOpen, onToggle: onToggleCite, screenId, screenFile, screenTitle }),
  ]);
}

/**
 * Hash-routing for #sources / #claim-<id>. Call once at
 * screen module load. `onOpenAll(true)` and `onHighlight(id)` are expected to set the
 * screen's own state and call its render() — this module holds none of it itself.
 * Registers both an immediate check (deep-link on load) and a `hashchange` listener
 * (in-page anchor navigation).
 */
export function initSourcesHash({ onOpenAll, onHighlight }) {
  function apply() {
    const hash = typeof location !== "undefined" ? location.hash : "";
    if (!hash) return;
    if (hash === "#sources") {
      onOpenAll(true);
    } else if (hash.startsWith("#claim-")) {
      const id = hash.slice("#claim-".length);
      onOpenAll(true);
      onHighlight(id);
    } else if (hash === "#cite") {
      // handled by the screen's own citeOpen state via a dedicated check if needed.
    }
  }
  if (typeof window !== "undefined") {
    window.addEventListener("hashchange", apply);
    // Deferred so it runs after the screen's first render has mounted the DOM (scrollIntoView needs it).
    setTimeout(apply, 0);
  }
}
