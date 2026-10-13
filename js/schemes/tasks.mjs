// js/schemes/tasks.mjs — exercise-track definitions: exercise 1 ("s2-forge") and exercise 2 ("s1-nonce").
// SSOT for the whole track: setup/check/enumerateSolutions/completionCode/verifyCode.
// No DOM, no document, no UI strings (K7/K8) — every verdict is a CODE CONSTANT
// ("budget-exceeded", "target-was-signed", "same-message-pair", …), never a sentence;
// js/core/task-ui.mjs translates codes through t("task.verdict.<code>"). Consumed by:
//   - js/screens/hash.mjs (exercise 1 "s2-forge") and js/screens/ecdsa.mjs (exercise 2 "s1-nonce")
//   - test/schemes.smoke.mjs (Node, layer C — K11(a)-(d))
//
// Zero new crypto (hard rule): every cryptographic operation below is a
// call into js/schemes/lamport.mjs or js/schemes/ecdsa.mjs — the exact modules the
// rest of the product already uses. This file only adds: deriving an instance from a
// seed (via js/schemes/seed.mjs), the pass/fail rules for each task, and the
// completion-code hash (itself a single sha256 call from js/vendor/noble.mjs, same
// import path js/schemes/lamport.mjs already uses).
//
// FORMAT IS ETERNAL (same kind of rule as the claim IDs): the hash input
// "sigexp.task.v1|<taskId>|<seed>|<canonicalSolution>" must never change shape — codes
// already issued to real students must keep verifying. A new format is a new prefix
// ("SE2-…"), never a silent edit to how "SE1-…" is computed.

import { sha256 } from "../vendor/noble.mjs";
import { rngFromSeed, intFromSeed } from "./seed.mjs";
import { LAMPORT } from "./params.mjs";
import { keygen as lamportKeygen, sign as lamportSign, verify as lamportVerify, canForge } from "./lamport.mjs";
import { keygen as ecdsaKeygen, hashMessage, sign as ecdsaSign, signWithFixedK, recoverFromNonceReuse } from "./ecdsa.mjs";

export const TASK_S2_FORGE = "s2-forge";
export const TASK_S1_NONCE = "s1-nonce";
export const TASK_IDS = Object.freeze([TASK_S2_FORGE, TASK_S1_NONCE]);

// ---------------------------------------------------------------------------
// Small local helpers — bit arrays <-> integers, Crockford base32 (the exact
// completion-code format). None of this is "new crypto" (K7 doesn't apply outside
// js/screens/js/core anyway, but the discipline still holds): it's array bookkeeping
// and a text encoding, no primitive that isn't already sha256/lamport/ecdsa.
// ---------------------------------------------------------------------------

function bitsFromInt(v, n) {
  return Array.from({ length: n }, (_, i) => (v >> i) & 1);
}

function bitsToInt(bits) {
  return bits.reduce((acc, bit, i) => acc | (bit << i), 0);
}

function bitsEqual(a, b) {
  return a.length === b.length && a.every((bit, i) => bit === b[i]);
}

function bitsToString(bits) {
  return bits.join("");
}

// Crockford base32 (excludes I/L/O/U — the code is two groups of 4 characters,
// meant to be typed by hand). 5 input bytes = 40 bits = exactly 8 output characters, no padding.
const CROCKFORD32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function crockfordBase32(bytes) {
  let bitBuffer = 0;
  let bitCount = 0;
  let out = "";
  for (const byte of bytes) {
    bitBuffer = (bitBuffer << 8) | byte;
    bitCount += 8;
    while (bitCount >= 5) {
      out += CROCKFORD32[(bitBuffer >>> (bitCount - 5)) & 31];
      bitCount -= 5;
    }
  }
  if (bitCount > 0) out += CROCKFORD32[(bitBuffer << (5 - bitCount)) & 31];
  return out;
}

function normalizeCode(code) {
  return String(code ?? "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");
}

// ---------------------------------------------------------------------------
// Exercise 1 · s2-forge (S2, hash.html).
// ---------------------------------------------------------------------------

function setupS2Forge(seed) {
  const n = LAMPORT.N_BITS;
  const rng = rngFromSeed(`sigexp.task.v1|s2-forge|keygen|${seed}`);
  const { sk, pk } = lamportKeygen({ rng, n, secretBytes: LAMPORT.SECRET_BYTES });
  const targetIndex = intFromSeed(seed, "s2-forge.target", 2 ** n);
  const target = bitsFromInt(targetIndex, n);
  return { taskId: TASK_S2_FORGE, seed, n, sk, pk, target };
}

/**
 * @param {object} instance - from setup(TASK_S2_FORGE, seed).
 * @param {{ history: number[][] }} attempt - every message (bit array) signed so far
 *   with this instance's key, in order — exactly js/screens/hash.mjs's own `history`.
 * @returns {{ ok: true, canonicalSolution: string } | { ok: false, reason: string }}
 */
function checkS2Forge(instance, attempt) {
  const { sk, pk, target, n } = instance;
  const history = attempt && attempt.history;
  if (!Array.isArray(history) || history.length === 0) return { ok: false, reason: "no-signatures" };
  if (history.length > 2) return { ok: false, reason: "budget-exceeded" };
  if (history.some((m) => bitsEqual(m, target))) return { ok: false, reason: "target-was-signed" };
  if (!canForge(history, target, n)) return { ok: false, reason: "not-forgeable-yet" };
  // Reconstructs exactly what an attacker holding only the LEAKED halves could build:
  // canForge() already established every position target needs was revealed by history,
  // so sign(sk, target) yields values identical to those leaked halves (same
  // technique js/screens/hash.mjs#forgeMessage already uses for the forge demo).
  const sig = lamportSign(sk, target);
  if (!lamportVerify(pk, target, sig)) return { ok: false, reason: "forge-verify-failed" };
  return { ok: true, canonicalSolution: canonicalizeS2Forge(history) };
}

// Canonical form: the two signed messages as bit strings, sorted lexicographically
// — order-independent so signing m1-then-m2 and m2-then-m1 give the same code.
function canonicalizeS2Forge(history) {
  return history.map(bitsToString).sort().join(",");
}

/** All valid (m1, m2) pairs for this instance's target — exactly 25 at N=4. */
function enumerateS2ForgeSolutions(instance) {
  const { n, target } = instance;
  const targetIndex = bitsToInt(target);
  const total = 2 ** n;
  const solutions = [];
  for (let a = 0; a < total; a++) {
    if (a === targetIndex) continue;
    for (let b = a + 1; b < total; b++) {
      if (b === targetIndex) continue;
      const m1 = bitsFromInt(a, n);
      const m2 = bitsFromInt(b, n);
      if (canForge([m1, m2], target, n)) {
        solutions.push({ history: [m1, m2], canonicalSolution: canonicalizeS2Forge([m1, m2]) });
      }
    }
  }
  return solutions;
}

// ---------------------------------------------------------------------------
// Exercise 2 · s1-nonce (S1, ecdsa.html).
// ---------------------------------------------------------------------------

const S1_MESSAGES = Object.freeze({
  a: "Authorize payroll run #1",
  b: "Authorize payroll run #2",
  trap: "Authorize a refund to the student",
  filler: "Authorize a library fine waiver",
});

function setupS1Nonce(seed) {
  const keyRng = rngFromSeed(`sigexp.task.v1|s1-nonce|keygen|${seed}`);
  const keys = ecdsaKeygen({ rng: keyRng });
  // Reuses keygen()'s own rejection-sampled nonzero-scalar-mod-n derivation to get a
  // valid shared nonce k — no new modular-arithmetic code, same technique the product
  // already trusts for private keys (hard rule: zero new crypto).
  const kRng = rngFromSeed(`sigexp.task.v1|s1-nonce|k|${seed}`);
  const { d: k } = ecdsaKeygen({ rng: kRng });

  const hA = hashMessage(S1_MESSAGES.a);
  const hB = hashMessage(S1_MESSAGES.b);
  const hTrap = hashMessage(S1_MESSAGES.trap);
  const hFiller = hashMessage(S1_MESSAGES.filler);

  const entries = [
    { message: S1_MESSAGES.a, hash: hA, sig: signWithFixedK(hA, keys.d, k) },
    { message: S1_MESSAGES.b, hash: hB, sig: signWithFixedK(hB, keys.d, k) },
    // Trap: the SAME message signed twice with the ordinary, deterministic
    // sign() — RFC 6979 derives the same k for the same (d, message), so r matches, but
    // z1 === z2 and there is nothing to recover (js/schemes/ecdsa.mjs#recoverFromNonceReuse
    // returns null on this exact input — see that function's 2026-09-29 fix).
    { message: S1_MESSAGES.trap, hash: hTrap, sig: ecdsaSign(keys.priv, hTrap) },
    { message: S1_MESSAGES.trap, hash: hTrap, sig: ecdsaSign(keys.priv, hTrap) },
    { message: S1_MESSAGES.filler, hash: hFiller, sig: ecdsaSign(keys.priv, hFiller) },
  ];

  // Deterministic Fisher-Yates shuffle keyed by seed — the solution pair should not
  // always sit at fixed positions across every assignment (the five-signature
  // list is meant to be read, not pattern-matched by position).
  const sigs = entries.slice();
  for (let i = sigs.length - 1; i > 0; i--) {
    const j = intFromSeed(seed, `s1-nonce.shuffle.${i}`, i + 1);
    [sigs[i], sigs[j]] = [sigs[j], sigs[i]];
  }

  return { taskId: TASK_S1_NONCE, seed, d: keys.d, pub: keys.pub, sigs };
}

/**
 * @param {object} instance - from setup(TASK_S1_NONCE, seed).
 * @param {{ indices: [number, number] }} attempt - the two chosen positions into
 *   instance.sigs, in the order clicked.
 */
function checkS1Nonce(instance, attempt) {
  const indices = attempt && attempt.indices;
  if (!Array.isArray(indices) || indices.length !== 2) return { ok: false, reason: "pick-exactly-two" };
  const [i, j] = indices;
  if (i === j || !instance.sigs[i] || !instance.sigs[j]) return { ok: false, reason: "invalid-selection" };
  const a = instance.sigs[i];
  const b = instance.sigs[j];
  // Trap check FIRST and explicitly (picking the trap pair in exercise 2 must give
  // same-message-pair, not "solved") — recoverFromNonceReuse would also
  // correctly return null on this pair now, but the task owes the student the SPECIFIC
  // reason, not a generic "didn't work".
  if (a.message === b.message) return { ok: false, reason: "same-message-pair" };
  const recovered = recoverFromNonceReuse(a.hash, a.sig, b.hash, b.sig);
  if (!recovered) return { ok: false, reason: "not-a-reuse-pair" };
  if (recovered.d !== instance.d) return { ok: false, reason: "recovery-mismatch" };
  return { ok: true, canonicalSolution: canonicalizeS1Nonce([i, j]) };
}

// Canonical form: the two chosen indices in ascending order ("1,3").
function canonicalizeS1Nonce(indices) {
  return indices.slice().sort((x, y) => x - y).join(",");
}

/** All pairs among the five signatures that actually recover the real d. */
function enumerateS1NonceSolutions(instance) {
  const solutions = [];
  const n = instance.sigs.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const result = checkS1Nonce(instance, { indices: [i, j] });
      if (result.ok) solutions.push({ indices: [i, j], canonicalSolution: result.canonicalSolution });
    }
  }
  return solutions;
}

// ---------------------------------------------------------------------------
// Public API — dispatches on taskId. Unknown taskId returns null/[]/false rather than
// throwing (a broken/unknown ?task= must never crash the screen).
// ---------------------------------------------------------------------------

/**
 * Builds a deterministic task instance from a seed (K11(a)): the same
 * (taskId, seed) pair always yields a byte-identical instance, any number of runs, any
 * order, offline. `seed` is trimmed but otherwise used as-is (any UTF-8
 * string, after trim(), case-sensitive).
 * @returns {object | null} null for an unknown taskId.
 */
export function setup(taskId, seed) {
  const trimmedSeed = String(seed ?? "").trim();
  if (!trimmedSeed) return null;
  if (taskId === TASK_S2_FORGE) return setupS2Forge(trimmedSeed);
  if (taskId === TASK_S1_NONCE) return setupS1Nonce(trimmedSeed);
  return null;
}

/**
 * Checks an attempt against an instance using the SAME real verify()/recoverFromNonceReuse()
 * the rest of the product uses (there is no second implementation of the check).
 * Returns a CODE CONSTANT on failure, never a sentence (K8 — screens
 * translate through t("task.verdict.<reason>")).
 */
export function check(instance, attempt) {
  if (!instance) return { ok: false, reason: "unknown-task" };
  if (instance.taskId === TASK_S2_FORGE) return checkS2Forge(instance, attempt);
  if (instance.taskId === TASK_S1_NONCE) return checkS1Nonce(instance, attempt);
  return { ok: false, reason: "unknown-task" };
}

/**
 * Enumerates EVERY valid solution for this instance — small, fully-enumerable spaces by
 * construction (exercise 1: exactly 25 at N=4, exercise 2: at most C(5,2)=10 pairs). Used by
 * verifyCode() (the instructor panel) and by K11(b)/(d) tests; never exposed to the
 * student-facing UI as a list (that would be "show the solution", which is forbidden).
 */
export function enumerateSolutions(instance) {
  if (!instance) return [];
  if (instance.taskId === TASK_S2_FORGE) return enumerateS2ForgeSolutions(instance);
  if (instance.taskId === TASK_S1_NONCE) return enumerateS1NonceSolutions(instance);
  return [];
}

/**
 * Completion code: `"SE1-" + base32(sha256("sigexp.task.v1|taskId|seed|
 * canonicalSolution"))[0..7]`, rendered as two groups of four. The hash input's shape is
 * ETERNAL (see file header) — do not reorder or re-delimit the fields.
 */
export function completionCode(taskId, seed, canonicalSolution) {
  const input = `sigexp.task.v1|${taskId}|${seed}|${canonicalSolution}`;
  const digest = sha256(new TextEncoder().encode(input));
  const chars = crockfordBase32(digest.slice(0, 5)); // 5 bytes = 40 bits = 8 chars, no padding
  return `SE1-${chars.slice(0, 4)}-${chars.slice(4, 8)}`;
}

/**
 * Instructor-side verification: re-derives the instance from (taskId, seed),
 * enumerates every valid solution, computes each one's code, and checks whether the
 * pasted code matches any of them — no secret, no server, no state. Never reveals WHICH
 * solution matched (the panel is not a "show the answer" button).
 */
export function verifyCode(taskId, seed, code) {
  const trimmedSeed = String(seed ?? "").trim();
  const target = normalizeCode(code);
  if (!trimmedSeed || !target) return false;
  const instance = setup(taskId, trimmedSeed);
  if (!instance) return false;
  const solutions = enumerateSolutions(instance);
  return solutions.some((s) => normalizeCode(completionCode(taskId, trimmedSeed, s.canonicalSolution)) === target);
}
