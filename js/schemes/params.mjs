// js/schemes/params.mjs — demo parameters of the schemes, in one place.
// No crypto logic here — only the numbers that schemes/* and screens/* read,
// so that magic constants don't live in two places (K7 keeps the logic separate).

/** Lamport OTS demo params — reduced for clarity. */
export const LAMPORT = Object.freeze({
  // number of bits in the demo message (real SHA-256 would give 256 secret pairs — unwieldy for a UI)
  N_BITS: 4,
  // size of each secret in bytes (the real scheme would use 32)
  SECRET_BYTES: 4,
});

/** ECDSA demo params. The curve is the real secp256k1, nothing is reduced. */
export const ECDSA = Object.freeze({
  CURVE_NAME: "secp256k1",
});
