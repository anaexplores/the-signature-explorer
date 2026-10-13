// js/screens/hash.mjs — S2 entry point (blocks A/B/C). UI only —
// crypto exclusively via js/schemes/lamport.mjs (K7); this module holds no hashing, no
// randomness, no sha256 — only rendering and the "which message is currently selected /
// how many times has this key signed / which question step is open" UI state. Bundled
// by tools/build.mjs into build/hash.js (classic IIFE).
//
// Block A UX ported one-to-one from the original prototype: grid of
// revealed secrets, compromise meter, verdict copy — translated into js/i18n/en.js, not
// rewritten. Plus a "Forge a message nobody ever signed" secondary button.
//
// Block B/C: the reader's own path of questions after
// getting burned in block A — three toggling steps (XMSS/Merkle -> FORS -> SLH-DSA)
// plus a closing comparison card. Every factual sentence is a
// docs/PROVENANCE.md Product statement transcribed verbatim (C-23/C-24/C-25/C-6/C-26/C-13) —
// see RENDERED_CLAIMS below for the exact set K10.3 checks against the registry.

import { keygen, sign, verify, leakAnalysis, findForgeableMessage } from "../schemes/lamport.mjs";
import { LAMPORT } from "../schemes/params.mjs";
import * as tasks from "../schemes/tasks.mjs";
import { el, mount } from "../core/dom.mjs";
import { t } from "../i18n/index.mjs";
import { renderLens as renderSharedLens } from "../core/lens.mjs";
import { renderSources, initSourcesHash } from "../core/sources.mjs";
import { renderExerciseTeaser, renderExerciseCard } from "../core/task-ui.mjs";
import { FIGURES } from "../data/claims.mjs";
import { markSeen, markDone, getTaskState, setTaskState } from "../core/progress.mjs";
import { renderProgressHeader } from "../core/progress-header.mjs";
import { injectCanonicalMeta } from "../core/site-meta.mjs";

const SCREEN_ID = "s2";

// Provenance registry input — also the K10.3 render-input, not a decorative
// duplicate. Pedagogical order (top-to-bottom reading order of the screen),
// NOT id order: block A signs (c21) -> reuse forges (c22) -> block B's
// three questions (c23 state -> c24 few-time -> c25 stateless) -> block C's closing
// comparison (c6 ECDSA breaks -> c26 hash survives -> c13 size line).
export const RENDERED_CLAIMS = ["c21", "c22", "c23", "c24", "c25", "c6", "c26", "c13"];
const N = LAMPORT.N_BITS;
const shortHex = (hex) => hex.slice(0, 8);
// Illustrative-only demo fill for block B step 2's meter (the same
// meter as block A, but a gentler slope) — a fixed schematic percentage, not a cited figure (same
// treatment as Lamport's demo N=4 in js/schemes/params.mjs): FORS's real k/t/a
// parameters are deliberately never shown (docs/PROVENANCE.md C-24).
const FORS_DEMO_FILL_PCT = 30;

// Screen-local state: key pair, the message currently staged for signing,
// and the history of every message signed so far with this one key — that history is
// exactly what js/schemes/lamport.mjs#leakAnalysis needs to compute the footgun.
let sk = null;
let pk = null;
let message = Array(N).fill(0);
let history = [];
let forged = null; // { message, sig, ok } — set by the forge button
let sourcesAllOpen = false;
let citeOpen = false;
let highlightClaimId = null;
// Block B: three independently-togglable question steps, same
// re-render pattern as s1.nonceCardOpen — not gated on
// history, block B is a fixed part of the page, not conditional on having signed.
let blockBOpen = { step1: false, step2: false, step3: false };

// Exercise track — exercise 1 "s2-forge". Query params, not hash (the
// hash is already #sources/#claim-<id>'s). A ?task= for a DIFFERENT screen's task id is
// simply not for this screen — treated exactly like no ?task= at all (teaser only).
const TASK_ID = tasks.TASK_S2_FORGE;
const taskParams = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
const taskParam = taskParams.get("task");
const seedParam = taskParams.get("seed");
const taskRequested = taskParam === TASK_ID;
// Known id (this screen's), but no usable seed (missing, or all-whitespace) —
// the screen must explain itself, never sit there silently broken.
const taskLinkBroken = taskRequested && !(seedParam && seedParam.trim());

let taskInstance = taskRequested && !taskLinkBroken ? tasks.setup(TASK_ID, seedParam) : null;
let taskAttempt = null; // last check() result ({ ok, reason|canonicalSolution }), or null
let taskFailedChecks = 0; // one hint after 3 failed checks
let taskCode = null;
let teaserOpen = false;
let instructorOpen = false;
let instructorSeedDraft = seedParam || "";
let instructorCodeDraft = "";
let instructorVerifyResult = null; // null | true | false

function initTaskKey() {
  // The task's key is FIXED by the seed (tasks.mjs#setup already derived it) — "Generate
  // a key pair" cannot hand out a fresh random key without breaking the assignment, so in
  // task mode that button becomes this reset instead (the "[Reset attempt]" control reuses
  // it rather than inventing a second button for the same effect).
  sk = taskInstance.sk;
  pk = taskInstance.pk;
  message = Array(N).fill(0);
  history = [];
  forged = null;
  taskAttempt = null;
  taskFailedChecks = 0;
}

if (taskInstance) {
  initTaskKey();
  const stored = getTaskState(TASK_ID);
  if (stored && stored.solved && stored.seed === taskInstance.seed) taskCode = stored.code;
}

function toggleTeaser() {
  teaserOpen = !teaserOpen;
  render();
}

function toggleInstructor() {
  instructorOpen = !instructorOpen;
  render();
}

function onInstructorSeedInput(value) {
  instructorSeedDraft = value;
  render();
}

// Math.random() on purpose, not crypto randomness (K7 forbids `getRandomValues` outside
// js/schemes/js/vendor anyway): this only suggests a convenience label for an instructor
// building a link, it carries no security property.
function onInstructorRandomSeed() {
  instructorSeedDraft = `class-${Math.random().toString(36).slice(2, 8)}`;
  render();
}

function onInstructorCodeInput(value) {
  instructorCodeDraft = value;
  instructorVerifyResult = null;
  render();
}

function onInstructorVerify() {
  instructorVerifyResult = tasks.verifyCode(TASK_ID, instructorSeedDraft, instructorCodeDraft);
  render();
}

function runTaskCheck() {
  if (!taskInstance) return;
  const result = tasks.check(taskInstance, { history });
  taskAttempt = result;
  if (result.ok) {
    taskCode = tasks.completionCode(taskInstance.taskId, taskInstance.seed, result.canonicalSolution);
    setTaskState(TASK_ID, { seed: taskInstance.seed, solved: true, code: taskCode });
  } else {
    taskFailedChecks += 1;
  }
  render();
}

function toggleBlockBStep(step) {
  blockBOpen = { ...blockBOpen, [step]: !blockBOpen[step] };
  render();
}

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

function generate() {
  if (taskInstance) {
    initTaskKey(); // also serves as the exercise card's "Reset attempt"
    render();
    return;
  }
  const kp = keygen();
  sk = kp.sk;
  pk = kp.pk;
  message = Array(N).fill(0);
  history = [];
  forged = null;
  render();
}

function toggleBit(i) {
  message = message.map((bit, idx) => (idx === i ? bit ^ 1 : bit));
  render();
}

// "Done" rule for S2: signed with the same key at least twice (the footgun seen).
// This rule is UNCHANGED by task mode (solving an exercise neither requires
// nor grants screen `done` — the two axes never touch).
function signCurrent() {
  if (!sk) return;
  history = [...history, [...message]];
  forged = null;
  if (history.length >= 2) markDone(SCREEN_ID);
  // Budget overflow is detected immediately on the 3rd signature, not only
  // when the student later clicks the forge button — the attempt is already spent.
  if (taskInstance && history.length > 2) {
    runTaskCheck();
    return; // runTaskCheck() already calls render()
  }
  render();
}

function forgeMessage() {
  if (!sk || history.length < 2) return;
  if (taskInstance) {
    runTaskCheck();
    return;
  }
  const candidate = findForgeableMessage(history, N);
  if (!candidate) {
    forged = { message: null, sig: null, ok: false, unavailable: true };
    render();
    return;
  }
  const sig = sign(sk, candidate);
  const ok = verify(pk, candidate, sig); // real verify(), same module the key was signed with
  forged = { message: candidate, sig, ok, unavailable: false };
  render();
}

function renderGenCard() {
  return el("div.card", {}, [
    el("div.row", {}, [
      el("button", { onclick: generate, text: t("s2.gen.button") }),
      el("span.note", { text: sk ? t("s2.gen.state.after") : t("s2.gen.state.before") }),
    ]),
  ]);
}

function renderMsgRow(bits, interactive) {
  return el(
    "div.msg",
    {},
    bits.map((bit, i) =>
      el(`button.bit${bit ? ".on" : ""}`, {
        text: String(bit),
        disabled: !interactive,
        onclick: interactive ? () => toggleBit(i) : undefined,
      }),
    ),
  );
}

function renderGrid() {
  const analysis = leakAnalysis(history, N);
  const cells = [
    el("div.gh", { text: t("s2.grid.headPos") }),
    el("div.gh", { text: t("s2.grid.head0") }),
    el("div.gh", { text: t("s2.grid.head1") }),
  ];
  for (let i = 0; i < N; i++) {
    cells.push(el("div.pos", { html: `#${i}<br><b>= ${message[i]}</b>` }));
    for (let half = 0; half < 2; half++) {
      const isRevealed = analysis.revealed[i][half];
      const bothLeaked = analysis.revealed[i][0] && analysis.revealed[i][1];
      const neededNow = message[i] === half;
      const tag = bothLeaked ? t("s2.cell.tagLeaked") : isRevealed ? t("s2.cell.tagRevealed") : t("s2.cell.tagHidden");
      const val = isRevealed ? shortHex(sk[i][half]) : "••••••••";
      const cellClass = bothLeaked ? "leaked" : isRevealed ? "revealed" : "hidden";
      cells.push(
        el(`div.cell.${cellClass}`, {}, [
          el("span.tag", { text: tag + (neededNow ? t("s2.cell.neededSuffix") : "") }),
          el("span.val", { text: `sk=${val}` }),
          el("span.hash", { text: `pk=${shortHex(pk[i][half])}` }),
        ]),
      );
    }
  }
  return el("div.grid", {}, cells);
}

function renderLegend() {
  // Accessibility fix: these swatches
  // used to differ ONLY by background color. Each now also has a distinct border-style
  // + shape (.sw--hidden/.sw--revealed/.sw--leaked in css/app.css), so the state survives
  // grayscale/colorblind viewing before the adjacent text label is even read.
  return el("div.legend", {}, [
    el("span", {}, [el("i.sw.sw--hidden", {}), t("s2.legend.hidden")]),
    el("span", {}, [el("i.sw.sw--revealed", {}), t("s2.legend.revealed")]),
    el("span", {}, [el("i.sw.sw--leaked", {}), t("s2.legend.leaked")]),
  ]);
}

function renderSignCard() {
  if (!sk) return null;
  return el("div.card", {}, [
    el("div.row.row-between", {}, [
      el("div", {}, [el("div.gh.mb-2", { text: t("s2.msg.label") }), renderMsgRow(message, true)]),
      el("div.self-end", {}, [el("button", { onclick: signCurrent, text: t("s2.sign.button") })]),
    ]),
    renderGrid(),
    renderLegend(),
  ]);
}

function renderForgeResult() {
  if (forged.unavailable) {
    return el("p.note", { text: t("s2.forge.unavailable") });
  }
  return el("div.card.card--danger-border.mt-4", {}, [
    el("div.gh.mb-2", { text: t("s2.forge.resultTitle") }),
    renderMsgRow(forged.message, false),
    el("div.row.mt-3", {}, forged.sig.map((secret) => el("code", { text: shortHex(secret) }))),
    el("p.note", { text: t("s2.forge.resultNote") }),
    el(`p.pill${forged.ok ? ".good" : ".bad"}`, { text: forged.ok ? t("s2.forge.verified") : "verify failed" }),
  ]);
}

function renderAttackCard() {
  if (history.length === 0) return null;
  const analysis = leakAnalysis(history, N);
  const pct = Math.round((analysis.leakedPositions / N) * 100);
  const verdictText =
    history.length === 1
      ? t("s2.verdict.oneSigned")
      : t("s2.verdict.multiSigned", { count: history.length, leaked: analysis.leakedPositions, total: N });
  const noteText =
    history.length === 1
      ? t("s2.note.oneSigned")
      : t("s2.note.multiSigned", { leaked: analysis.leakedPositions, forgeable: analysis.forgeable });

  const children = [
    el("div.gh.mb-2", { text: t("s2.attack.title") }),
    el("div.meter", {}, [el("i", { style: `width:${pct}%` })]),
    el("div.verdict", { text: verdictText }),
    el("div.note", { text: noteText }),
  ];

  // Forge demo: secondary .ghost button, appears only after the SECOND
  // signature — it confirms the climax (red meter), it doesn't compete with it.
  if (history.length >= 2) {
    children.push(el("button.ghost.mt-4", { onclick: forgeMessage, text: t("s2.forge.button") }));
  }
  if (forged) children.push(renderForgeResult());

  return el("div.card", {}, children);
}

// Inline SVG, zero external resources (K4). Colors are CSS custom properties from
// css/app.css/theme.css, never hardcoded hex (schemes must live
// in both themes and re-skin with the rest of the product). Labels come through t()
// (K8 greps the rendered DOM too, not just source). No animation is added here, so
// there is nothing for prefers-reduced-motion to need to disable.
function renderMerkleTreeSvg() {
  const aria = t("s2.blockB.step1.svg.aria");
  const rootLabel = t("s2.blockB.step1.svg.root");
  const usedLabel = t("s2.blockB.step1.svg.used");
  return el("div.mt-3", {
    html: `<svg viewBox="0 0 220 100" width="100%" height="100" role="img" aria-label="${aria}">
      <line x1="110" y1="20" x2="60" y2="50" stroke="var(--line)" stroke-width="1.5"/>
      <line x1="110" y1="20" x2="160" y2="50" stroke="var(--line)" stroke-width="1.5"/>
      <line x1="60" y1="50" x2="30" y2="82" stroke="var(--line)" stroke-width="1.5"/>
      <line x1="60" y1="50" x2="90" y2="82" stroke="var(--line)" stroke-width="1.5"/>
      <line x1="160" y1="50" x2="130" y2="82" stroke="var(--line)" stroke-width="1.5"/>
      <line x1="160" y1="50" x2="190" y2="82" stroke="var(--line)" stroke-width="1.5"/>
      <circle cx="110" cy="20" r="9" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.5"/>
      <circle cx="60" cy="50" r="7" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.5"/>
      <circle cx="160" cy="50" r="7" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.5"/>
      <circle cx="30" cy="85" r="7" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.5"/>
      <circle cx="90" cy="85" r="7" fill="var(--secret)" stroke="var(--secret)" stroke-width="1.5"/>
      <circle cx="130" cy="85" r="7" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.5"/>
      <circle cx="190" cy="85" r="7" fill="var(--panel2)" stroke="var(--line)" stroke-width="1.5"/>
      <text x="110" y="10" text-anchor="middle" font-size="8" fill="var(--dim)">${rootLabel}</text>
      <text x="90" y="99" text-anchor="middle" font-size="8" fill="var(--secret)">${usedLabel}</text>
    </svg>`,
  });
}

function renderNoCounterSvg() {
  const aria = t("s2.blockB.step3.svg.aria");
  const noCounterLabel = t("s2.blockB.step3.svg.noCounter");
  const hashOnlyLabel = t("s2.blockB.step3.svg.hashOnly");
  // The strike is neutral-colored (var(--dim)), not var(--bad) — "no counter" is the
  // feature being explained, not a failure state, and --bad is reserved for the
  // grid's actual leak climax (skin rule: glow/danger red appears nowhere else).
  return el("div.mt-3", {
    html: `<svg viewBox="0 0 160 80" width="100%" height="80" role="img" aria-label="${aria}">
      <circle cx="40" cy="36" r="24" fill="none" stroke="var(--line)" stroke-width="2"/>
      <line x1="40" y1="20" x2="40" y2="36" stroke="var(--dim)" stroke-width="2"/>
      <line x1="40" y1="36" x2="52" y2="44" stroke="var(--dim)" stroke-width="2"/>
      <line x1="18" y1="14" x2="62" y2="58" stroke="var(--dim)" stroke-width="2.5"/>
      <text x="40" y="70" text-anchor="middle" font-size="8" fill="var(--dim)">${noCounterLabel}</text>
      <text x="120" y="42" text-anchor="middle" font-size="20" fill="var(--accent)">#</text>
      <text x="120" y="70" text-anchor="middle" font-size="8" fill="var(--dim)">${hashOnlyLabel}</text>
    </svg>`,
  });
}

// Block B: the reader re-opens the design's own path of questions
// after already getting burned in block A — three independently-toggling steps, same
// reveal pattern as s1.nonceCardOpen. Each answer is claim text
// transcribed verbatim (docs/PROVENANCE.md C-23/C-24/C-25, Product statement (EN)).
function renderBlockBStep1() {
  const open = blockBOpen.step1;
  const children = [
    el("div.row", {}, [
      el("button.ghost", {
        "aria-expanded": String(open),
        onclick: () => toggleBlockBStep("step1"),
        text: t("s2.blockB.step1.q"),
      }),
    ]),
  ];
  if (open) {
    children.push(el("p.note.mt-3", { text: t("s2.blockB.step1.a") }), renderMerkleTreeSvg());
  }
  return el("div.card", {}, children);
}

function renderBlockBStep2() {
  const open = blockBOpen.step2;
  const children = [
    el("div.row", {}, [
      el("button.ghost", {
        "aria-expanded": String(open),
        onclick: () => toggleBlockBStep("step2"),
        text: t("s2.blockB.step2.q"),
      }),
    ]),
  ];
  if (open) {
    children.push(
      el("p.note.mt-3", { text: t("s2.blockB.step2.a") }),
      el("div.meter.mt-2", {}, [el("i", { style: `width:${FORS_DEMO_FILL_PCT}%` })]),
      el("p.note.mt-2", { text: t("s2.blockB.step2.caption") }),
    );
  }
  return el("div.card", {}, children);
}

function renderBlockBStep3() {
  const open = blockBOpen.step3;
  const children = [
    el("div.row", {}, [
      el("button.ghost", {
        "aria-expanded": String(open),
        onclick: () => toggleBlockBStep("step3"),
        text: t("s2.blockB.step3.q"),
      }),
    ]),
  ];
  if (open) {
    children.push(el("p.note.mt-3", { text: t("s2.blockB.step3.a") }), renderNoCounterSvg());
  }
  return el("div.card", {}, children);
}

// Block C: the lens (rendered separately below) plus
// this closing card — a two-column ECDSA/hash comparison that closes BOTH threads
// ("reuse = death": nonce on S1 <-> one-time key here; "quantum breaks clever math,
// not hashes"), the one-line size comparison (never a table), and the
// honest "not yet" line with no link (a dead link would cost trust more than an
// absent one).
function renderClosingCard() {
  return el("div.card", {}, [
    el("div.gh.mb-2", { text: t("s2.blockC.compareTitle") }),
    el("div.row", {}, [
      el("div.flex-1", {}, [el("p.note", { text: t("s2.blockC.ecdsaBreaks") })]),
      el("div.flex-1", {}, [el("p.note", { text: t("s2.blockC.hashSurvives") })]),
    ]),
    el("p.note.mt-3", {
      text: t("s2.blockC.sizes", {
        slhdsaSigBytes: FIGURES.slhdsaSigBytes,
        ecdsaSigBytes: FIGURES.ecdsaSigBytes,
        slhdsaPkBytes: FIGURES.slhdsaPkBytes,
      }),
    }),
    el("p.note.mt-2", { text: t("s2.blockC.notYet") }),
  ]);
}

function renderLens() {
  return renderSharedLens({
    tiles: [
      { questionKey: "lens.q1", answerKey: "s2.lens.a1" },
      { questionKey: "lens.q2", answerKey: "s2.lens.a2" },
      { questionKey: "lens.q3", answerKey: "s2.lens.a3" },
    ],
  });
}

function renderNext() {
  return el("div.row.next-row", {}, [
    el("a.next-link", { href: "index.html", text: t("s2.next.label") }),
  ]);
}

function renderSourcesSection() {
  return renderSources({
    screenId: SCREEN_ID,
    screenFile: "hash.html",
    screenTitle: t("s2.title"),
    claimIds: RENDERED_CLAIMS,
    allOpen: sourcesAllOpen,
    citeOpen,
    onToggleAll: toggleSourcesAll,
    onToggleCite: toggleCite,
    highlightId: highlightClaimId,
  });
}

// Exercise track: the teaser (always visible, collapsed) or the full
// exercise card (once ?task=s2-forge&seed=… resolved), mounted FIRST — right after the
// progress header and the title, before the mechanics it drives.
function renderTaskSection() {
  const instructorProps = {
    open: instructorOpen,
    onToggle: toggleInstructor,
    taskId: TASK_ID,
    screenFile: "hash.html",
    seedDraft: instructorSeedDraft,
    onSeedInput: onInstructorSeedInput,
    onRandomSeed: onInstructorRandomSeed,
    codeDraft: instructorCodeDraft,
    onCodeInput: onInstructorCodeInput,
    onVerify: onInstructorVerify,
    verifyResult: instructorVerifyResult,
  };

  if (!taskRequested) {
    return renderExerciseTeaser({
      open: teaserOpen,
      onToggle: toggleTeaser,
      briefKey: "task.s2forge.brief",
      instructor: instructorProps,
    });
  }

  if (taskLinkBroken) {
    return renderExerciseCard({ titleKey: "task.s2forge.title", badLinkKey: "task.s2forge.badLink", instructor: instructorProps });
  }

  const verdictKey = !taskAttempt ? null : taskAttempt.ok ? "task.verdict.solved" : `task.verdict.${taskAttempt.reason}`;
  const showHint = taskFailedChecks >= 3 && !(taskAttempt && taskAttempt.ok);
  const showReset = !!(taskAttempt && !taskAttempt.ok);

  return renderExerciseCard({
    titleKey: "task.s2forge.title",
    briefKey: "task.s2forge.brief",
    budgetKey: "task.s2forge.budgetLabel",
    budgetVars: { used: history.length, budget: 2 },
    extraContent: [el("div.gh.mb-2", { text: t("task.s2forge.targetLabel") }), renderMsgRow(taskInstance.target, false)],
    verdictKey,
    showHint,
    hintKey: "task.hint.s2forge",
    showReset,
    onResetAttempt: generate,
    code: taskCode,
    instructor: instructorProps,
  });
}

function render() {
  const root = document.getElementById("app") || document.body;
  const header = el("div", {}, [el("h1", { text: t("s2.title") }), el("p.sub", { text: t("s2.subtitle") })]);
  const cards = [
    renderProgressHeader({ screenId: SCREEN_ID, render }),
    renderTaskSection(),
    renderGenCard(),
    renderSignCard(),
    renderAttackCard(),
    renderBlockBStep1(),
    renderBlockBStep2(),
    renderBlockBStep3(),
    renderLens(),
    renderClosingCard(),
    renderSourcesSection(),
    renderNext(),
  ].filter(Boolean);
  mount(root, el("div", {}, [header, ...cards]));
}

injectCanonicalMeta("hash.html");
markSeen(SCREEN_ID);
render();
