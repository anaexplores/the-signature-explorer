// js/schemes/lamport.mjs — Lamport OTS crypto logic, SSOT.
// No DOM, no document, no UI strings — pure data in, data out (K7). Consumed by:
//   - js/screens/hash.mjs (build/hash.js, the browser)
//   - test/schemes.smoke.mjs (Node, imports this file directly)
//
// Model (ported one-to-one from the original prototype):
//   sk[i][b] = hex secret for message-bit position i, half b (0 or 1)
//   pk[i][b] = sha256(sk[i][b]) — the published half
//   signing message m reveals sk[i][m[i]] for every position i
//   sign the SAME key twice with different bits at position i -> BOTH halves of that
//   position leak -> attacker can pick either bit there -> forgeable = 2 ^ (leaked positions)

import { sha256 } from "../vendor/noble.mjs";
import { LAMPORT } from "./params.mjs";

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function hashHex(hex) {
  return bytesToHex(sha256(hexToBytes(hex)));
}

/**
 * Default randomness source (randomness is injected, not imported).
 * globalThis.crypto is a global in browsers and in Node >= 19.
 */
export function defaultRng(n) {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

/**
 * Generates a Lamport OTS key pair.
 * @param {object} [opts]
 * @param {(n: number) => Uint8Array} [opts.rng] - injected randomness. Tests
 *   pass a deterministic rng for reproducible vectors and cross-checking against the
 *   independent reference implementation.
 * @param {number} [opts.n] - number of message bits (demo default: params.mjs LAMPORT.N_BITS).
 * @param {number} [opts.secretBytes] - bytes per secret (demo default: LAMPORT.SECRET_BYTES).
 * @returns {{ sk: string[][], pk: string[][] }} sk/pk[i] = [half0, half1], hex strings.
 */
export function keygen({ rng = defaultRng, n = LAMPORT.N_BITS, secretBytes = LAMPORT.SECRET_BYTES } = {}) {
  const sk = [];
  const pk = [];
  for (let i = 0; i < n; i++) {
    const s0 = bytesToHex(rng(secretBytes));
    const s1 = bytesToHex(rng(secretBytes));
    sk.push([s0, s1]);
    pk.push([hashHex(s0), hashHex(s1)]);
  }
  return { sk, pk };
}

/**
 * Signs a message (array of 0/1 bits, length === sk.length) by revealing the secret
 * half selected by each bit. This is the ENTIRE Lamport signing algorithm — one-time by
 * construction, because every sign() call reveals more of sk.
 * @returns {string[]} signature — one hex secret per position.
 */
export function sign(sk, message) {
  return message.map((bit, i) => sk[i][bit]);
}

/** Verifies a signature against a public key and message. */
export function verify(pk, message, sig) {
  return message.every((bit, i) => hashHex(sig[i]) === pk[i][bit]);
}

/**
 * Given the history of messages signed so far with ONE key, computes which halves have
 * leaked and how many messages an attacker could now forge
 * ("forgeable = 2^leaked").
 * @param {number[][]} history - every message array signed so far, in order.
 * @param {number} [n] - number of bit positions (demo default: LAMPORT.N_BITS).
 * @returns {{ revealed: boolean[][], leakedPositions: number, forgeable: number, fullyBroken: boolean }}
 */
export function leakAnalysis(history, n = LAMPORT.N_BITS) {
  const revealed = Array.from({ length: n }, (_, i) => [
    history.some((m) => m[i] === 0),
    history.some((m) => m[i] === 1),
  ]);
  let leakedPositions = 0;
  for (const [half0, half1] of revealed) if (half0 && half1) leakedPositions++;
  return {
    revealed,
    leakedPositions,
    forgeable: 2 ** leakedPositions,
    fullyBroken: leakedPositions === n,
  };
}

/** True if every bit of `message` only needs halves already revealed by `history`. */
export function canForge(history, message, n = LAMPORT.N_BITS) {
  const { revealed } = leakAnalysis(history, n);
  return message.every((bit, i) => revealed[i][bit]);
}

/**
 * Finds a message that (a) was never actually signed and (b) is forgeable purely from
 * leaked halves — the "Forge a message nobody ever signed" demo.
 * @returns {number[]|null} a forgeable, never-signed message, or null if none exists yet.
 */
export function findForgeableMessage(history, n = LAMPORT.N_BITS) {
  const total = 2 ** n;
  for (let v = 0; v < total; v++) {
    const candidate = Array.from({ length: n }, (_, i) => (v >> i) & 1);
    const alreadySigned = history.some((m) => m.every((bit, i) => bit === candidate[i]));
    if (!alreadySigned && canForge(history, candidate, n)) return candidate;
  }
  return null;
}
