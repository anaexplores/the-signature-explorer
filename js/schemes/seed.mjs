// js/schemes/seed.mjs — deterministic DRBG from a seed string.
// No DOM, no document, no UI strings (K7) — pure data in, data out. Consumed by:
//   - js/schemes/tasks.mjs (setup() uses this to derive the whole task instance)
//   - test/schemes.smoke.mjs (Node, imports this file directly)
//
// Same pattern as js/schemes/lamport.mjs and js/schemes/ecdsa.mjs's `rng` injection
// point: `keygen({ rng })` already exists on BOTH scheme modules — this file
// only has to produce a `(n) => Uint8Array` function from a string, deterministically.
//
// sha256 lives ONLY in js/vendor/noble.mjs and modules under js/schemes/ (K7's own grep:
// `\b(sha256|secp\w*|getRandomValues|BigInt|invert)\b` outside those two directories is a
// hard failure) — this module imports it from the vendor bundle, exactly like
// lamport.mjs does, so the K11(a) determinism guarantee reduces to "sha256 is a pure
// function", which it is.

import { sha256 } from "../vendor/noble.mjs";

function utf8(s) {
  return new TextEncoder().encode(String(s));
}

function concatBytes(...parts) {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function u32be(n) {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0, false);
  return b;
}

/**
 * Deterministic byte stream from a seed string — counter-mode SHA-256 expansion
 * (`sha256(seed || counter)`, counter 0, 1, 2, … as 4-byte big-endian). Same seed always
 * produces the same byte sequence, in the same order, regardless of how many times the
 * product is opened or on what machine (the same seed gives a byte-for-byte
 * identical instance, however many times it is run).
 *
 * Returns a function with the EXACT SAME shape as js/schemes/{lamport,ecdsa}.mjs's own
 * `defaultRng` — `(n: number) => Uint8Array` — so it plugs directly into the existing
 * `keygen({ rng })` injection point on both scheme modules without either of them
 * knowing or caring that the randomness is seeded.
 *
 * @param {string} seed - arbitrary UTF-8 string (already trimmed by the caller).
 * @returns {(n: number) => Uint8Array}
 */
export function rngFromSeed(seed) {
  const seedBytes = utf8(seed);
  let counter = 0;
  let pool = new Uint8Array(0);
  return function drbg(n) {
    const out = new Uint8Array(n);
    let filled = 0;
    while (filled < n) {
      if (pool.length === 0) {
        pool = sha256(concatBytes(seedBytes, u32be(counter)));
        counter += 1;
      }
      const take = Math.min(pool.length, n - filled);
      out.set(pool.subarray(0, take), filled);
      pool = pool.subarray(take);
      filled += take;
    }
    return out;
  };
}

/**
 * Derives a deterministic, unbiased integer in [0, max) from a seed plus a label —
 * independent of any rngFromSeed() stream's position, so picking "which message is the
 * target" (exercise 1) or "which message pair is the trap" (exercise 2) never perturbs the keygen byte
 * stream those same schemes' keygen() already consumed. Rejection sampling
 * (same technique js/schemes/ecdsa.mjs#keygen already uses for the private scalar) keeps
 * the distribution unbiased instead of a naive `% max` that would skew toward small
 * remainders.
 *
 * @param {string} seed
 * @param {string} label - distinguishes independent draws from the same seed
 *   (e.g. "s2-forge.target", "s1-nonce.trapMessage") — different labels are
 *   cryptographically independent draws even from the same seed.
 * @param {number} max - exclusive upper bound, must be a positive integer.
 * @returns {number}
 */
export function intFromSeed(seed, label, max) {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError("intFromSeed: max must be a positive integer");
  if (max === 1) return 0;
  const bytesNeeded = Math.max(1, Math.ceil(Math.log2(max) / 8));
  const range = 256 ** bytesNeeded;
  const usableLimit = range - (range % max);
  for (let attempt = 0; ; attempt++) {
    const digest = sha256(concatBytes(utf8(seed), utf8("|"), utf8(label), utf8("|"), u32be(attempt)));
    let value = 0;
    for (let i = 0; i < bytesNeeded; i++) value = value * 256 + digest[i];
    if (value < usableLimit) return value % max;
  }
}
