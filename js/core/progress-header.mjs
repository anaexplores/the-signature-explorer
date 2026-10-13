// js/core/progress-header.mjs — shared "S0 · S1 · S2" progress header, extracted
// from three byte-identical copies that used to live in
// js/screens/{intro,ecdsa,hash}.mjs#renderProgressHeader() (a duplication
// anti-pattern). Same contract as
// js/core/lens.mjs and js/core/sources.mjs: pure render function, zero DOM state of its
// own (K7 — no crypto here either) — the screen owns re-rendering, this module owns
// nothing across calls except reading js/core/progress.mjs's LocalStorage-backed state.
//
// Dot state used to be picked by string-concatenating an inline `style` per dot
// ("background:var(--accent);color:#fff;" vs "background:var(--panel2);color:var(--dim);").
// It is now picked by CLASS at render time (.pill.is-current / .pill.is-upcoming /
// .pill.good for done) — see css/app.css "DESIGN TOKENS" section.

import { el } from "./dom.mjs";
import { t } from "../i18n/index.mjs";
import { getProgress, resetProgress, previousScreen, SCREEN_IDS } from "./progress.mjs";

/**
 * @param {object} opts
 * @param {string} opts.screenId - "s0" | "s1" | "s2", the screen mounting this header.
 * @param {() => void} opts.render - the screen's own render(), called after reset so the
 *   whole tree (including this header) reflects the cleared progress immediately.
 */
export function renderProgressHeader({ screenId, render }) {
  const progress = getProgress();
  const prev = previousScreen(screenId);
  const skippedPrev = prev && !progress.seen.includes(prev);

  const dots = SCREEN_IDS.map((id) => {
    const isDone = progress.done.includes(id);
    const isCurrent = id === screenId;
    const isSeen = progress.seen.includes(id) || isCurrent;
    const stateClass = isDone ? ".good" : isSeen ? ".is-current" : ".is-upcoming";
    return el(`span.pill.progress-dot${stateClass}`, { text: id.toUpperCase() });
  });

  const children = [
    el("div.row.row-between-center", {}, [
      el("div", {}, dots),
      el("button.ghost", {
        onclick: () => {
          resetProgress();
          render();
        },
        text: t("common.resetProgress"),
      }),
    ]),
  ];
  if (skippedPrev) children.push(el("p.note.mt-3", { text: t(`progress.skipped.${prev}`) }));
  return el("div.card.mb-5", {}, children);
}
