// js/core/task-ui.mjs — exercise card + instructor panel shell.
// Same contract as js/core/lens.mjs and js/core/sources.mjs: PURE RENDER, zero state of
// its own (K7 — no crypto here either, and no DOM state) — the calling screen owns every
// flag (open/closed, drafts, the task instance) and re-renders, exactly like
// s1.nonceCardOpen already does. This module never touches r/s/d as BigInt or calls
// js/schemes/tasks.mjs itself — it only renders strings and hex the SCREEN already
// computed there (K7 would fail on a stray `BigInt`/`sha256` reference in here).
//
// Reuses existing primitives: .card/.note/.pill.good/.pill.bad/.ghost/.row/.field — all from
// css/app.css, same disclosure pattern (button.ghost + aria-expanded + re-render) as
// js/core/sources.mjs. No new UI primitives.

import { el } from "./dom.mjs";
import { t } from "../i18n/index.mjs";
import { resolveCanonicalUrl } from "./sources.mjs";

/**
 * Collapsed-by-default entry point: visible on every load of the host
 * screen, whether or not a task is active, so a teacher who arrived from search — not
 * from an assignment link — still discovers that this screen has an exercise. Clicking
 * it just reveals the brief + the instructor's link builder; it does not start an
 * attempt (there's no seed yet to build an instance from).
 */
export function renderExerciseTeaser({ open, onToggle, briefKey, instructor }) {
  const rows = [
    el("button.ghost", { "aria-expanded": String(open), onclick: onToggle, text: t("task.teaser.label") }),
  ];
  if (open) {
    rows.push(el("p.note.mt-3", { text: t(briefKey) }));
    rows.push(renderInstructorPanel(instructor));
  }
  return el("div.card", {}, rows);
}

/**
 * The full exercise card — mounted instead of the teaser once
 * `?task=<known-id>&seed=<non-empty>` resolved to a real instance. `badLinkKey`, when
 * set, short-circuits to an honest one-line explanation instead of a broken/empty card
 * (a bad link must explain itself, never leave the screen silent).
 *
 * @param {object} opts
 * @param {string} opts.titleKey
 * @param {string} [opts.badLinkKey] - if set, renders ONLY the title + this message.
 * @param {string} opts.briefKey
 * @param {object} [opts.briefVars]
 * @param {string} [opts.budgetKey] - e.g. "task.s2forge.budgetLabel" (T1 only; T2 has no
 *   signature budget, it has a "how many selected" count instead — pass via pickKey).
 * @param {object} [opts.budgetVars]
 * @param {string} [opts.pickKey] - T2's "selected: {count} / 2" line.
 * @param {object} [opts.pickVars]
 * @param {Array<Node>} [opts.extraContent] - scheme-specific interactive body (T2's
 *   selectable signature list) that doesn't belong in this shared shell.
 * @param {string|null} opts.verdictKey - "task.verdict.<code>" (from tasks.mjs's reason
 *   constant) or null for "not attempted yet".
 * @param {boolean} [opts.showHint] - true after 3 failed checks.
 * @param {string} [opts.hintKey]
 * @param {{ labelKey: string, onClick: () => void, disabled?: boolean }} [opts.mainAction]
 * @param {boolean} [opts.showReset]
 * @param {() => void} [opts.onResetAttempt]
 * @param {string|null} [opts.code] - the completion code, once solved.
 * @param {object} opts.instructor - see renderInstructorPanel.
 */
export function renderExerciseCard({
  titleKey,
  badLinkKey,
  briefKey,
  briefVars,
  budgetKey,
  budgetVars,
  pickKey,
  pickVars,
  extraContent,
  verdictKey,
  showHint,
  hintKey,
  mainAction,
  showReset,
  onResetAttempt,
  code,
  instructor,
}) {
  if (badLinkKey) {
    // A known task id without a usable seed still gets the instructor
    // builder, not just an apology — "this assignment link has no seed" + a way to fix it
    // right there, not a dead end.
    return el("div.card", { id: "exercise" }, [
      el("div.gh.mb-2", { text: t(titleKey) }),
      el("p.note", { text: t(badLinkKey) }),
      renderInstructorPanel(instructor),
    ]);
  }

  const rows = [el("div.gh.mb-2", { text: t(titleKey) }), el("p.note", { text: t(briefKey, briefVars) })];
  if (budgetKey) rows.push(el("p.note.mt-2", { text: t(budgetKey, budgetVars) }));
  if (pickKey) rows.push(el("p.note.mt-2", { text: t(pickKey, pickVars) }));
  if (extraContent && extraContent.length) rows.push(el("div.mt-3", {}, extraContent));

  const verdictClass = verdictKey === "task.verdict.solved" ? ".good" : verdictKey ? ".bad" : "";
  rows.push(el(`p.pill.mt-3${verdictClass}`, { text: t(verdictKey || "task.verdict.pending") }));
  if (showHint && hintKey) rows.push(el("p.note.mt-2", { text: t(hintKey) }));

  if (mainAction) {
    rows.push(
      el("div.row.mt-3", {}, [
        el("button", { onclick: mainAction.onClick, disabled: !!mainAction.disabled, text: t(mainAction.labelKey) }),
      ]),
    );
  }
  if (showReset) {
    rows.push(el("button.ghost.mt-3", { onclick: onResetAttempt, text: t("task.resetAttempt") }));
  }
  if (code) {
    rows.push(
      el("div.mt-4", {}, [
        el("div.gh", { text: t("task.completionCode.label") }),
        el("code.mono", { text: code }),
      ]),
    );
  }
  rows.push(renderInstructorPanel(instructor));
  return el("div.card", { id: "exercise" }, rows);
}

/**
 * Collapsed-by-default "I'm an instructor" panel: link builder (honest about
 * the unset-canonicalBase case — reuses
 * js/core/sources.mjs#resolveCanonicalUrl, the exact same "never invent a domain" rule
 * the citation already follows, instead of a second implementation) + completion
 * code checker (re-checking by ENUMERATION, no secret — the logic lives in js/schemes/tasks.mjs,
 * this module just wires strings to it). The mandatory honesty line (it must not be softened
 * or hidden in small print) always renders alongside it, never only on
 * success — it's a property of the SCHEME, not of any one verification result.
 *
 * @param {object} opts
 * @param {boolean} opts.open
 * @param {() => void} opts.onToggle
 * @param {string} opts.taskId
 * @param {string} opts.screenFile - e.g. "hash.html", for the assignment link.
 * @param {string} opts.seedDraft
 * @param {(value: string) => void} opts.onSeedInput
 * @param {() => void} opts.onRandomSeed
 * @param {string} opts.codeDraft
 * @param {(value: string) => void} opts.onCodeInput
 * @param {() => void} opts.onVerify
 * @param {boolean|null} opts.verifyResult - null = not checked yet this session.
 */
export function renderInstructorPanel({
  open,
  onToggle,
  taskId,
  screenFile,
  seedDraft,
  onSeedInput,
  onRandomSeed,
  codeDraft,
  onCodeInput,
  onVerify,
  verifyResult,
}) {
  const rows = [
    el("button.ghost", { "aria-expanded": String(open), onclick: onToggle, text: t("task.instructor.toggle") }),
  ];
  if (open) {
    const seed = (seedDraft || "").trim();
    const tail = `?task=${taskId}&seed=${encodeURIComponent(seed)}`;
    const fullUrl = seed ? resolveCanonicalUrl(`${screenFile}${tail}`) : null;

    rows.push(
      el("div.mt-4", {}, [
        el("div.gh.mb-2", { text: t("task.instructor.seedLabel") }),
        el("div.row", {}, [
          el("input.field", { value: seedDraft, oninput: (e) => onSeedInput(e.target.value) }),
          el("button.ghost", { onclick: onRandomSeed, text: t("task.instructor.randomButton") }),
        ]),
      ]),
      el("div.mt-3", {}, [
        el("div.gh.mb-2", { text: t("task.instructor.linkLabel") }),
        el("code.mono", { text: fullUrl || (seed ? tail : t("task.instructor.linkNoSeed")) }),
        !fullUrl && seed ? el("p.note.mt-2", { text: t("task.instructor.linkTailNote") }) : null,
      ]),
      el("div.mt-4", {}, [
        el("div.gh.mb-2", { text: t("task.instructor.codeLabel") }),
        el("div.row", {}, [
          el("input.field", { value: codeDraft, oninput: (e) => onCodeInput(e.target.value) }),
          el("button", { onclick: onVerify, text: t("task.instructor.verifyButton") }),
        ]),
        verifyResult === true ? el("p.pill.good.mt-2", { text: t("task.instructor.verifyValid") }) : null,
        verifyResult === false ? el("p.pill.bad.mt-2", { text: t("task.instructor.verifyInvalid") }) : null,
      ]),
      // Mandatory, shown verbatim, never in fine print: the honesty line about what
      // the code does and does NOT prove — renders every time the panel is open, not
      // conditionally on a result.
      el("p.note.mt-4", { text: t("task.honesty.note") }),
    );
  }
  return el("div.card.mt-4", {}, rows);
}
