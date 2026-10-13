// js/screens/ecdsa.mjs — S1 entry point. UI only — crypto exclusively
// via js/schemes/ecdsa.mjs (K7): this module holds no hashing, no curve math, no
// randomness. Bundled by tools/build.mjs into build/ecdsa.js (classic IIFE).
//
// Every factual claim rendered here is anchored to docs/PROVENANCE.md (provenance registry).
// Anchors noted inline as (C-n):
//   C-1  signature = (r, s)                    C-8  PS3 constant-k incident
//   C-3  d/Q key pair, "easy this way..."      C-9  Android SecureRandom 2013 (CVE-2013-7372)
//   C-4  tamper -> verify fails                C-10 MetaMask differences (Keccak/EIP-191/v)
//   C-5  RFC 6979 deterministic k              C-11 Keccak-256 != SHA-3/FIPS 202 (do not conflate)
//   C-6  Shor -> discrete log -> d (not "Shor solves ECDLP" directly)
//   C-7  nonce reuse -> recover d (SEC1 §4.1.3 derivation)
// The quantum toggle is a SCHEME, not an execution: no quantum computer runs
// here — we reveal the `d` the demo already generated, labeled explicitly as illustrated.

import { keygen, sign, verify, hashMessage, signWithFixedK, recoverFromNonceReuse, toHex } from "../schemes/ecdsa.mjs";
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

const SCREEN_ID = "s1";

// Provenance registry input — also the K10.3 render-input, not a decorative
// duplicate. Order matches docs/PROVENANCE.md's own S1 listing (C-1..C-12).
export const RENDERED_CLAIMS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "c11", "c12"];
const DEFAULT_MESSAGE = "Hello, Ethereum";
// Fixed nonce for the reuse demo (CLAIMS C-8: "Sony's PS3 code returned the same
// constant every time") — chosen by hand on purpose, exactly the bug being illustrated.
const DEMO_FIXED_K = 0xc0ffee_c0ffeen;
const DEMO_MESSAGE_A = "Transfer 1 ETH to Alice";
const DEMO_MESSAGE_B = "Transfer 100 ETH to Mallory";

let keys = null; // { priv, pub, d, Q }
let msg = DEFAULT_MESSAGE;
let sig = null; // { r, s } — set by "Sign"
let quantumOn = false;
let nonceCardOpen = false;
let nonceDemo = null; // { sig1, sig2, recoveredD } — computed once per key, cached
let sourcesAllOpen = false;
let citeOpen = false;
let highlightClaimId = null;

// Exercise track — exercise 2 "s1-nonce". Self-contained: its five signatures
// come from tasks.mjs#setup, entirely independent of `keys`/`sig` above (the playground
// keypair) — solving the exercise never touches the demo state and vice versa.
const TASK_ID = tasks.TASK_S1_NONCE;
const taskParams = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams();
const taskParam = taskParams.get("task");
const seedParam = taskParams.get("seed");
const taskRequested = taskParam === TASK_ID;
const taskLinkBroken = taskRequested && !(seedParam && seedParam.trim());
const taskInstance = taskRequested && !taskLinkBroken ? tasks.setup(TASK_ID, seedParam) : null;

let taskSelected = []; // up to two indices into taskInstance.sigs
let taskAttempt = null;
let taskFailedChecks = 0;
let taskCode = null;
let teaserOpen = false;
let instructorOpen = false;
let instructorSeedDraft = seedParam || "";
let instructorCodeDraft = "";
let instructorVerifyResult = null;

if (taskInstance) {
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

// Math.random() on purpose (K7 forbids getRandomValues outside js/schemes/js/vendor
// anyway) — this only suggests a convenience label, no security property needed.
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

function toggleSigSelection(i) {
  if (taskAttempt && taskAttempt.ok) return; // solved — selection freezes
  if (taskSelected.includes(i)) {
    taskSelected = taskSelected.filter((x) => x !== i);
  } else if (taskSelected.length < 2) {
    taskSelected = [...taskSelected, i];
  } else {
    taskSelected = [taskSelected[1], i]; // third click replaces the OLDER selection
  }
  taskAttempt = null;
  render();
}

function resetTaskAttempt() {
  taskSelected = [];
  taskAttempt = null;
  render();
}

function runTaskCheck() {
  if (!taskInstance || taskSelected.length !== 2) return;
  const result = tasks.check(taskInstance, { indices: taskSelected });
  taskAttempt = result;
  if (result.ok) {
    taskCode = tasks.completionCode(taskInstance.taskId, taskInstance.seed, result.canonicalSolution);
    setTaskState(TASK_ID, { seed: taskInstance.seed, solved: true, code: taskCode });
  } else {
    taskFailedChecks += 1;
  }
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
  keys = keygen();
  msg = DEFAULT_MESSAGE;
  sig = null;
  quantumOn = false;
  nonceCardOpen = false;
  nonceDemo = null;
  render();
}

// "Done" rule for S1: signed AND the quantum toggle has been switched on.
function checkDone() {
  if (sig && quantumOn) markDone(SCREEN_ID);
}

function signCurrent() {
  if (!keys) return;
  const h = hashMessage(msg);
  sig = sign(keys.priv, h);
  checkDone();
  render();
}

function onMsgInput(value) {
  msg = value;
  render();
}

function toggleQuantum() {
  quantumOn = !quantumOn;
  checkDone();
  render();
}

function toggleNonceCard() {
  if (!keys) return;
  nonceCardOpen = !nonceCardOpen;
  if (nonceCardOpen && !nonceDemo) {
    const hA = hashMessage(DEMO_MESSAGE_A);
    const hB = hashMessage(DEMO_MESSAGE_B);
    const sig1 = signWithFixedK(hA, keys.d, DEMO_FIXED_K);
    const sig2 = signWithFixedK(hB, keys.d, DEMO_FIXED_K);
    const recovered = recoverFromNonceReuse(hA, sig1, hB, sig2);
    nonceDemo = {
      hA,
      hB,
      sig1,
      sig2,
      sig1Ok: verify(keys.pub, hA, sig1),
      sig2Ok: verify(keys.pub, hB, sig2),
      recoveredD: recovered ? recovered.d : null,
      matches: recovered ? recovered.d === keys.d : false,
    };
  }
  render();
}

function renderMetamaskAnchor() {
  return el("div.card", {}, [
    el("p", { text: t("s1.metamask.anchor") }),
    el("p.note", { text: t("s1.metamask.curve") }),
    el("p.note", { text: t("s1.metamask.diff", { ethSigBytes: FIGURES.ethSigBytes }) }),
    el("p.note", { text: t("s1.metamask.keccakNote") }),
  ]);
}

function renderGenCard() {
  const children = [
    el("div.row", {}, [
      el("button", { onclick: generate, text: t("s1.gen.button") }),
      !keys ? el("span.note", { text: t("s1.gen.state.before") }) : null,
    ]),
  ];
  if (keys) {
    children.push(
      el("div.mt-4", {}, [
        el("div.gh", { text: t("s1.gen.privLabel", { ecdsaPrivBytes: FIGURES.ecdsaPrivBytes }) }),
        el("code.mono", { text: toHex(keys.d) }),
      ]),
      el("div.mt-4", {}, [
        el("div.gh", { text: t("s1.gen.pubLabel") }),
        el("code.mono", { text: toHex(keys.pub) }),
      ]),
      el("p.note", { text: t("s1.gen.note") }),
    );
  }
  return el("div.card", {}, children);
}

function renderSignCard() {
  if (!keys) return null;
  const h = hashMessage(msg);
  const ok = sig ? verify(keys.pub, h, sig) : null;
  const verdictClass = ok === null ? "" : ok ? ".good" : ".bad";
  const verdictText = ok === null ? t("s1.verify.pending") : ok ? t("s1.verify.ok") : t("s1.verify.fail");

  const children = [
    el("div.row.row-between", {}, [
      el("div.flex-1", {}, [
        el("div.gh.mb-2", { text: t("s1.msg.label") }),
        el("input.field", {
          id: "s1-msg-input",
          value: msg,
          oninput: (e) => onMsgInput(e.target.value),
        }),
      ]),
      el("div.self-end", {}, [el("button", { onclick: signCurrent, text: t("s1.sign.button") })]),
    ]),
  ];

  if (sig) {
    children.push(
      el("div.mt-4", {}, [
        el("div.gh", { text: t("s1.sig.rLabel") }),
        el("code.mono", { text: toHex(sig.r) }),
        el("div.gh.mt-2", { text: t("s1.sig.sLabel") }),
        el("code.mono", { text: toHex(sig.s) }),
      ]),
      el(`p.pill.mt-4${verdictClass}`, { text: verdictText }),
    );
  }

  return el("div.card", {}, children);
}

function renderQuantumCard() {
  if (!keys) return null;
  const children = [
    el("div.row", {}, [
      // aria-pressed, not aria-expanded: this reads as a mode switch ("Switch on a
      // quantum computer"), not a question to expand — the WAI-ARIA "toggle button"
      // pattern, not the "disclosure" one js/core/sources.mjs uses. It also happens
      // to reveal a panel when on, but the switch framing is the primary semantic
      // (accessibility).
      el("button.ghost", { "aria-pressed": String(quantumOn), onclick: toggleQuantum, text: t("s1.quantum.toggle") }),
    ]),
    el("p.note", { text: t("s1.quantum.note") }),
  ];
  if (quantumOn) {
    children.push(
      el("div.card.card--danger.mt-4", {}, [
        el("div.gh", { text: t("s1.quantum.recoveredLabel") }),
        el("code.mono", { text: toHex(keys.d) }),
        el("p.verdict.verdict--danger", { text: t("s1.quantum.verdict") }),
        el("p.note", { text: t("s1.quantum.stillVerified") }),
      ]),
    );
  }
  return el("div.card", {}, children);
}

function renderNonceCard() {
  if (!keys) return null;
  const children = [
    // Disclosure widget (phrased as a question, reveals an explanation + computed
    // demo data below) — same js/core/sources.mjs pattern, aria-expanded
    // (accessibility: this one was missing it).
    el("div.row", {}, [
      el("button.ghost", { "aria-expanded": String(nonceCardOpen), onclick: toggleNonceCard, text: t("s1.nonce.toggle") }),
    ]),
  ];
  if (nonceCardOpen && nonceDemo) {
    children.push(
      el("p.note", { text: t("s1.nonce.intro") }),
      el("p.pill.bad", { text: t("s1.nonce.manualK") }),
      el("div.mt-4", {}, [
        el("div.gh", { text: t("s1.nonce.sig1Label") }),
        el("code.mono", { text: `r=${toHex(nonceDemo.sig1.r)} s=${toHex(nonceDemo.sig1.s)}` }),
      ]),
      el("div.mt-2", {}, [
        el("div.gh", { text: t("s1.nonce.sig2Label") }),
        el("code.mono", { text: `r=${toHex(nonceDemo.sig2.r)} s=${toHex(nonceDemo.sig2.s)}` }),
      ]),
      el(`p.pill.mt-3${nonceDemo.sig1Ok && nonceDemo.sig2Ok ? ".good" : ".bad"}`, {
        text: t("s1.nonce.bothVerified"),
      }),
      el("div.mt-4", {}, [
        el("div.gh", { text: t("s1.nonce.recoveredLabel") }),
        el("code.mono", { text: nonceDemo.recoveredD !== null ? toHex(nonceDemo.recoveredD) : "—" }),
      ]),
      nonceDemo.matches
        ? el("p.verdict.verdict--danger", { text: t("s1.nonce.matchVerdict") })
        : null,
    );
  }
  return el("div.card", {}, children);
}

function renderLens() {
  return renderSharedLens({
    tiles: [
      { questionKey: "lens.q1", answerKey: "s1.lens.a1" },
      { questionKey: "lens.q2", answerKey: "s1.lens.a2" },
      { questionKey: "lens.q3", answerKey: "s1.lens.a3" },
    ],
  });
}

// Migration note: the old plain-bibliography footer (s1.footer.* + renderFooter())
// is REMOVED — it was a flat, un-synced duplicate of the provenance registry.
// Replaced by js/core/sources.mjs's "Where this comes from" block below, which leads
// with the CLAIM, not the citation, and stays in sync with docs/PROVENANCE.md via K10. This
// is a visible change to S1, not just a refactor.
function renderSourcesSection() {
  return renderSources({
    screenId: SCREEN_ID,
    screenFile: "ecdsa.html",
    screenTitle: t("s1.title"),
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
    el("a.next-link", { href: "hash.html", text: t("s1.next.label") }),
  ]);
}

// Exercise track: five pre-computed signatures, none of them recomputed here — every
// r/s/message comes straight from tasks.mjs#setup, this only renders them as clickable
// rows. `.on`, not a new class, mirrors the existing selected-bit convention (js/screens/
// hash.mjs's `.bit.on`) so a selected row reads the same way a selected bit already does.
function renderTaskSigList() {
  return el(
    "div.mt-3",
    {},
    taskInstance.sigs.map((entry, i) => {
      const selected = taskSelected.includes(i);
      return el(
        `button.row.row-between${selected ? "" : ".ghost"}`,
        {
          "aria-pressed": String(selected),
          onclick: () => toggleSigSelection(i),
          style: "width:100%;text-align:left;",
        },
        [
          el("span", { text: entry.message }),
          el("code.mono", { text: `r=${toHex(entry.sig.r).slice(0, 10)}… s=${toHex(entry.sig.s).slice(0, 10)}…` }),
        ],
      );
    }),
  );
}

function renderTaskSection() {
  const instructorProps = {
    open: instructorOpen,
    onToggle: toggleInstructor,
    taskId: TASK_ID,
    screenFile: "ecdsa.html",
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
      briefKey: "task.s1nonce.brief",
      instructor: instructorProps,
    });
  }

  if (taskLinkBroken) {
    return renderExerciseCard({ titleKey: "task.s1nonce.title", badLinkKey: "task.s1nonce.badLink", instructor: instructorProps });
  }

  const verdictKey = !taskAttempt ? null : taskAttempt.ok ? "task.verdict.solved" : `task.verdict.${taskAttempt.reason}`;
  const showHint = taskFailedChecks >= 3 && !(taskAttempt && taskAttempt.ok);
  const showReset = !!(taskAttempt && !taskAttempt.ok);
  const solved = !!(taskAttempt && taskAttempt.ok);

  return renderExerciseCard({
    titleKey: "task.s1nonce.title",
    briefKey: "task.s1nonce.brief",
    pickKey: "task.s1nonce.pickLabel",
    pickVars: { count: taskSelected.length },
    extraContent: [renderTaskSigList()],
    verdictKey,
    showHint,
    hintKey: "task.hint.s1nonce",
    mainAction: solved ? null : { labelKey: "task.s1nonce.recoverButton", onClick: runTaskCheck, disabled: taskSelected.length !== 2 },
    showReset,
    onResetAttempt: resetTaskAttempt,
    code: taskCode,
    instructor: instructorProps,
  });
}

function render() {
  const root = document.getElementById("app") || document.body;
  const active = document.activeElement;
  const focusedMsgInput = active && active.id === "s1-msg-input";
  const selStart = focusedMsgInput ? active.selectionStart : null;
  const selEnd = focusedMsgInput ? active.selectionEnd : null;

  const header = el("div", {}, [el("h1", { text: t("s1.title") }), el("p.sub", { text: t("s1.subtitle") })]);
  const cards = [
    renderProgressHeader({ screenId: SCREEN_ID, render }),
    renderTaskSection(),
    renderMetamaskAnchor(),
    renderGenCard(),
    renderSignCard(),
    renderQuantumCard(),
    renderNonceCard(),
    renderLens(),
    renderSourcesSection(),
    renderNext(),
  ].filter(Boolean);
  mount(root, el("div", {}, [header, ...cards]));

  if (focusedMsgInput) {
    const input = document.getElementById("s1-msg-input");
    if (input) {
      input.focus();
      try {
        input.setSelectionRange(selStart, selEnd);
      } catch {
        /* ignore — some input types don't support selection ranges */
      }
    }
  }
}

injectCanonicalMeta("ecdsa.html");
markSeen(SCREEN_ID);
render();
