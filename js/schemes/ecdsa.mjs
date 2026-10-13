// js/schemes/ecdsa.mjs — wrapper over @noble/curves/secp256k1 (real ECDSA).
// SSOT for all ECDSA logic in the product — K7: no DOM, no document, no UI
// strings, only data. Consumed by js/screens/ecdsa.mjs (browser) and
// test/schemes.smoke.mjs (Node, imports this file directly).
//
// NON-DEPRECATED noble API only (docs/PROVENANCE.md, section confirming the exports of
// @noble/curves@1.9.7): `secp256k1.ProjectivePoint`/`secp256k1.CURVE` are deprecated
// aliases in 1.9.7 — this module uses `secp256k1.Point` and `secp256k1.Point.CURVE()`.
//
// Hashing here is plain SHA-256 over UTF-8 message bytes — NOT Keccak-256/EIP-191 like
// MetaMask (docs/PROVENANCE.md C-10/C-11). That distinction is stated on-screen, not hidden.

import { sha256, secp256k1, mod, invert } from "../vendor/noble.mjs";

const CURVE_N = secp256k1.Point.CURVE().n; // group order n (SEC2 §2.4.1)

function bytesToBigInt(bytes) {
  let x = 0n;
  for (const b of bytes) x = (x << 8n) | BigInt(b);
  return x;
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Renders a bigint (r, s, d) or Uint8Array (priv, pub) as a fixed-width hex string. */
export function toHex(value) {
  if (value instanceof Uint8Array) return bytesToHex(value);
  if (typeof value === "bigint") return value.toString(16).padStart(64, "0");
  throw new TypeError("ecdsa.mjs#toHex: expected Uint8Array or bigint");
}

/**
 * Default randomness source (same pattern as js/schemes/lamport.mjs).
 * globalThis.crypto is a global in browsers and in Node >= 19.
 */
export function defaultRng(n) {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

/**
 * Generates an ECDSA key pair on secp256k1 (docs/PROVENANCE.md C-3: `d` 32 bytes private,
 * `Q = d·G` public — SEC1 §3.2.1). Rejection sampling (not modulo-reduction) keeps the
 * private scalar unbiased; rejecting is astronomically rare (~2^-128) since n is so
 * close to 2^256.
 * @param {object} [opts]
 * @param {(n: number) => Uint8Array} [opts.rng] - injected randomness.
 * @returns {{ priv: Uint8Array, pub: Uint8Array, d: bigint, Q: object }}
 *   priv/pub are 32/33-byte (compressed) encodings; d/Q are the same key as bigint/Point,
 *   handy for the low-level nonce-reuse demo without re-decoding bytes.
 */
export function keygen({ rng = defaultRng } = {}) {
  let d, privBytes;
  do {
    privBytes = rng(32);
    d = bytesToBigInt(privBytes);
  } while (d === 0n || d >= CURVE_N);
  const Q = secp256k1.Point.BASE.multiply(d);
  const pub = Q.toBytes(true);
  return { priv: privBytes, pub, d, Q };
}

/** SHA-256 over UTF-8 message bytes — our demo's message digest (not Keccak-256/EIP-191). */
export function hashMessage(message) {
  return sha256(new TextEncoder().encode(message));
}

/**
 * Real ECDSA signing (docs/PROVENANCE.md C-1, SEC1 §4.1.3), via the library's own RFC 6979
 * deterministic-k path (docs/PROVENANCE.md C-5) — this is what "Sign" does everywhere except
 * the nonce-reuse demo card, which uses signWithFixedK instead.
 * @returns {{ r: bigint, s: bigint }}
 */
export function sign(priv, msgHash) {
  const sig = secp256k1.sign(msgHash, priv);
  return { r: sig.r, s: sig.s };
}

/** Verifies an ECDSA signature (docs/PROVENANCE.md C-1/C-4, SEC1 §4.1.4). */
export function verify(pub, msgHash, sig) {
  try {
    return secp256k1.verify({ r: sig.r, s: sig.s }, msgHash, pub);
  } catch {
    return false;
  }
}

/**
 * Manually assembles a signature from low-level primitives with an EXPLICITLY CHOSEN
 * nonce `k` — real libraries never do this (they derive k deterministically, RFC 6979,
 * docs/PROVENANCE.md C-5). This reproduces an actual disaster: Sony's PS3 code reused a
 * constant k for every signature (docs/PROVENANCE.md C-8, fail0verflow/27C3 2010).
 *
 * Math (SEC1 §4.1.3): R = k·G, r = R.x mod n, s = k⁻¹(z + r·d) mod n.
 * Low-s normalization (s > n/2 → s = n − s) is applied because @noble/curves' own
 * verify() rejects high-s signatures as malleable (docs/PROVENANCE.md C-7 footnote) — without
 * it, the library's real verify() would reject our own hand-built signature.
 *
 * @param {Uint8Array} msgHash - 32-byte message digest (hashMessage()).
 * @param {bigint} d - the real private key (only the demo controls this; a real signer
 *   would never expose it).
 * @param {bigint} k - the nonce, chosen by hand (the actual vulnerability being shown).
 * @returns {{ r: bigint, s: bigint }}
 */
export function signWithFixedK(msgHash, d, k) {
  const R = secp256k1.Point.BASE.multiply(k);
  const r = mod(R.x, CURVE_N);
  const z = mod(bytesToBigInt(msgHash), CURVE_N);
  let s = mod(invert(k, CURVE_N) * mod(z + r * d, CURVE_N), CURVE_N);
  if (s > CURVE_N / 2n) s = mod(CURVE_N - s, CURVE_N); // low-s normalization
  return { r, s };
}

/**
 * Recovers the private key `d` (and nonce `k`) from two signatures that reused the same
 * nonce (docs/PROVENANCE.md C-7, derived from SEC1 §4.1.3):
 *   s1 = k⁻¹(z1 + r·d), s2 = k⁻¹(z2 + r·d)  (same k ⇒ same r)
 *   k = (z1 − z2) / (s1 − s2) mod n
 *   d = (s1·k − z1) / r mod n
 *
 * Both input signatures may have been independently low-s normalized (signWithFixedK
 * does this — see there), which flips the sign of `s` for whichever signature had
 * s > n/2. A sign flip on `s_i` is equivalent to having used nonce `n − k` for that one
 * equation (same `r`, since a point and its negation share the same x-coordinate), so
 * naively plugging in the normalized s1/s2 can point at the wrong k. This function tries
 * all four sign combinations and keeps the one whose recovered `k` actually reproduces
 * `r` via `k·G` — i.e. it does the recovery the way an attacker facing two independently
 * normalized signatures would have to.
 *
 * @returns {{ d: bigint, k: bigint } | null} null if sig1.r !== sig2.r (not a nonce-reuse
 *   pair), if the two messages are actually the SAME (msgHash1 === msgHash2, i.e. z1 ===
 *   z2 — "reused the nonce" only because RFC 6979 deterministically reused it for an
 *   identical input, not a real reuse: there is nothing to solve (docs/PROVENANCE.md C-5;
 *   exercise 2's trap pair), or the arithmetic otherwise degenerates under every sign combo.
 *
 *   Bug fixed 2026-09-29 (found while building the exercise track, exercise 2's "same nonce, same
 *   message" trap): when z1 === z2, the numerator (z1 − z2) is 0, so k = mod(0 *
 *   invert(denom)) = 0n for any combo where denom !== 0n — and multiplying the curve's
 *   base point by the scalar 0 is out of range for @noble/curves (it throws "invalid
 *   scalar", it does not return the point at infinity). Without the `k === 0n` guard
 *   below, this function would crash instead of returning null on exactly the input the
 *   task's own trap is designed to exercise — verified empirically (Node REPL, this
 *   commit) before the guard was added, not assumed from reading the code.
 */
export function recoverFromNonceReuse(msgHash1, sig1, msgHash2, sig2) {
  if (sig1.r !== sig2.r) return null; // different r ⇒ not the same nonce ⇒ nothing to recover
  const z1 = mod(bytesToBigInt(msgHash1), CURVE_N);
  const z2 = mod(bytesToBigInt(msgHash2), CURVE_N);
  const r = sig1.r;

  for (const e1 of [1n, -1n]) {
    for (const e2 of [1n, -1n]) {
      const s1 = mod(e1 * sig1.s, CURVE_N);
      const s2 = mod(e2 * sig2.s, CURVE_N);
      const denom = mod(s1 - s2, CURVE_N);
      if (denom === 0n) continue;
      const k = mod((z1 - z2) * invert(denom, CURVE_N), CURVE_N);
      if (k === 0n) continue; // z1 === z2 (same message) — degenerate, not a valid scalar
      const check = secp256k1.Point.BASE.multiply(k);
      if (mod(check.x, CURVE_N) === r) {
        const d = mod((s1 * k - z1) * invert(r, CURVE_N), CURVE_N);
        return { d, k };
      }
    }
  }
  return null;
}

export const ORDER_N = CURVE_N;
