// js/core/progress.mjs — screen progression + LocalStorage with soft degradation.
// Key: sigexp.progress.v1 → { seen:[...], done:[...], v:1 }
// No screen depends on this module functionally — it only highlights progress.
// No crypto logic here (K7).
//
// Exercises: a SEPARATE state axis, key sigexp.tasks.v1,
// { "<taskId>": { seed, solved, code } }. It uses the SAME safeGet/safeSet with soft
// degradation (reuse-first, single point of mutation per domain: a second
// storage module for a second key would be a second writer of the same domain).
// Solving an exercise does NOT affect SCREENS/done/the progress bar, and vice versa;
// "Reset progress" clears BOTH keys.

const STORAGE_KEY = "sigexp.progress.v1";
const TASKS_STORAGE_KEY = "sigexp.tasks.v1";
const SCREENS = ["s0", "s1", "s2"];

function emptyState() {
  return { seen: [], done: [], v: 1 };
}

function emptyTaskState() {
  return {};
}

// In-memory fallback for when localStorage is unavailable (file://, private mode, disabled).
// One flag for both keys: if localStorage is broken for one, it is broken for both —
// it is the same runtime environment, not two independent stores.
const memoryStates = new Map(); // key -> state
let usingMemory = false;

function safeGet(key) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    usingMemory = true;
    return null;
  }
}

function safeSet(key, state) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    usingMemory = true;
    return false;
  }
}

function load(key, makeEmpty) {
  if (usingMemory) return memoryStates.get(key) ?? makeEmpty();
  const stored = safeGet(key);
  if (stored) return { ...makeEmpty(), ...stored };
  // Either a clean start, or localStorage is unavailable — in both cases: empty state.
  return makeEmpty();
}

function save(key, state) {
  if (usingMemory) {
    memoryStates.set(key, state);
    return;
  }
  const ok = safeSet(key, state);
  if (!ok) memoryStates.set(key, state); // switched to in-memory mid-session
}

/** Returns a copy of the current progress state. */
export function getProgress() {
  const state = load(STORAGE_KEY, emptyState);
  return { seen: [...state.seen], done: [...state.done], v: state.v };
}

/** Marks a screen as opened (seen). Called when the screen initializes. */
export function markSeen(screenId) {
  if (!SCREENS.includes(screenId)) return getProgress();
  const state = load(STORAGE_KEY, emptyState);
  if (!state.seen.includes(screenId)) state.seen.push(screenId);
  save(STORAGE_KEY, state);
  return getProgress();
}

/** Marks a screen as completed (done) — only after the key action, not on opening. */
export function markDone(screenId) {
  if (!SCREENS.includes(screenId)) return getProgress();
  const state = load(STORAGE_KEY, emptyState);
  if (!state.done.includes(screenId)) state.done.push(screenId);
  save(STORAGE_KEY, state);
  return getProgress();
}

/** Progress reset ("Reset progress" in the footer) — clears BOTH keys (exercises too). */
export function resetProgress() {
  save(STORAGE_KEY, emptyState());
  save(TASKS_STORAGE_KEY, emptyTaskState());
  return getProgress();
}

/** true if storage is unavailable and progress lives only in memory for the current session. */
export function isMemoryFallback() {
  return usingMemory;
}

/** The screen preceding the given one, for the soft "You skipped ..." hint. */
export function previousScreen(screenId) {
  const idx = SCREENS.indexOf(screenId);
  return idx > 0 ? SCREENS[idx - 1] : null;
}

export const SCREEN_IDS = SCREENS;

// ---------------------------------------------------------------------------
// Exercises. Separate key sigexp.tasks.v1, separate shape
// { "<taskId>": { seed, solved, code } }, not mixed with SCREENS/done above.
// ---------------------------------------------------------------------------

/** State of one exercise — { seed, solved, code } | null if not yet attempted. */
export function getTaskState(taskId) {
  const state = load(TASKS_STORAGE_KEY, emptyTaskState);
  return state[taskId] ? { ...state[taskId] } : null;
}

/** Records an exercise's solved state (storage shape described above). */
export function setTaskState(taskId, { seed, solved, code }) {
  const state = load(TASKS_STORAGE_KEY, emptyTaskState);
  state[taskId] = { seed, solved: !!solved, code: code ?? null };
  save(TASKS_STORAGE_KEY, state);
  return getTaskState(taskId);
}
