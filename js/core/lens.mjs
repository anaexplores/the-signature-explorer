// js/core/lens.mjs — "3 questions" lens component, shared by S0/S1/S2.
// No DOM state of its own — it's a pure render function; screens own the click/expand
// state and pass it in, same pattern as js/screens/* re-rendering their whole tree.
// No crypto here (K7) — only markup. Crypto-derived ANSWERS are resolved by the caller
// via t() from js/i18n/en.js, cross-checked against docs/PROVENANCE.md by the screen that
// owns the claim (S1 -> ECDSA claims, S2 -> Lamport/hash claims).

import { el } from "./dom.mjs";
import { t } from "../i18n/index.mjs";

/**
 * @param {object} opts
 * @param {string} [opts.titleKey] - i18n key for the lens heading (default: shared "lens.title")
 * @param {Array<{
 *   questionKey: string,
 *   answerKey?: string,   - resolved answer, shown when the family is already known (S1/S2)
 *   hintKey?: string,     - shown only while `expanded` is true (S0: "you'll answer this next")
 *   expanded?: boolean,
 *   onToggle?: () => void - if present, the tile is clickable and calls this (S0 usage)
 * }>} opts.tiles - exactly 3 tiles: reveals / breaks it / quantum-safe.
 * @returns {HTMLElement}
 */
export function renderLens({ titleKey = "lens.title", tiles }) {
  return el("div.card", {}, [
    el("div.gh.mb-3", { text: t(titleKey) }),
    el("div.row", {}, tiles.map(renderTile)),
  ]);
}

function renderTile({ questionKey, answerKey, hintKey, expanded, onToggle }) {
  const clickable = typeof onToggle === "function";
  // Accessibility fix (2026-09-29): this used to be a <div onclick>, reachable by
  // mouse only — no tabindex, no keyboard handler, no exposed state. A real <button>
  // gets keyboard operability (Enter/Space, Tab order, focus-visible) and
  // aria-expanded for free, instead of hand-rolling role/tabindex/keydown. Inner
  // text nodes are <div>, not <p> — app.css/.lens-tile styling is class-selector-only
  // (never `p.foo`, checked), and <p> is not valid content inside <button>.
  const children = [el("div.lens-question", { text: t(questionKey) })];
  if (answerKey) children.push(el("div.note.m-0", { text: t(answerKey) }));
  if (hintKey && expanded) children.push(el("div.note.mt-2", { text: t(hintKey) }));
  if (clickable) {
    return el(
      "button.lens-tile.is-clickable",
      { type: "button", "aria-expanded": String(!!expanded), onclick: onToggle },
      children,
    );
  }
  return el("div.lens-tile", {}, children);
}

/** Convenience for a screen that wants the lens as its own standalone mounted subtree. */
export function mountLens(root, opts) {
  const node = renderLens(opts);
  root.appendChild(node);
  return node;
}
