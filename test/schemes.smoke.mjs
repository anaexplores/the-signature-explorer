#!/usr/bin/env node
// Node smoke test for the Lamport OTS logic. Run as the project's "all green" command
// (`node test/schemes.smoke.mjs`) and by the pre-push check (K1, K7).
//
// Structured in layers:
//   Layer A (production code) — imports js/schemes/lamport.mjs directly and checks on
//     it: valid signature = true, forgery = false, reuse (0000+1110) → 3/4 leak →
//     8 forgeable messages, and a forgery after reuse verifies with the production verify().
//   Layer B (independent cross-check) — a separate implementation on node:crypto serves
//     as the reference + cross-check: with the SAME deterministic rng, the production
//     keygen() and the reference keygen() give byte-identical sk/pk.
//   Layer C — the exercise track (js/schemes/tasks.mjs), see below.
//
// There is no independent reference for ECDSA, and there will not be one — it is covered
// by property-style checks on top of js/schemes/ecdsa.mjs instead.

import { createHash } from "node:crypto";
import assert from "node:assert/strict";

// Preamble: Node >= 19 is required for globalThis.crypto (WebCrypto as a global), which
// defaultRng in js/schemes/* relies on. A clear message instead of an obscure TypeError
// somewhere in the middle of the smoke test.
const NODE_MIN_MAJOR = 19;
const nodeMajor = Number(process.versions.node.split(".")[0]);
if (!(nodeMajor >= NODE_MIN_MAJOR)) {
  console.error(
    `✗ schemes.smoke: Node ${process.versions.node} is too old — Node >= ${NODE_MIN_MAJOR} is required ` +
      `(globalThis.crypto). Update Node and re-run.`,
  );
  process.exit(1);
}

// ─── Layer A: production code ───────────────────────────────────────────────────────
import { keygen, sign, verify, leakAnalysis, findForgeableMessage } from "../js/schemes/lamport.mjs";

console.log("▶ schemes.smoke: layer A — imported production js/schemes/lamport.mjs (not a copy, not a reference).");

// 1) valid signature (production keygen — real randomness, globalThis.crypto)
{
  const { sk, pk } = keygen();
  const m1 = [0, 0, 0, 0];
  const sig1 = sign(sk, m1);
  assert.equal(verify(pk, m1, sig1), true, "[layer A] a valid signature must verify");

  // 2) forgery: the same signature under a different message
  const wrongMsg = [1, 0, 0, 0];
  assert.equal(verify(pk, wrongMsg, sig1), false, "[layer A] a signature must not fit a different message");

  // 3) reuse footgun: a second signature with the same key (0000 + 1110)
  const m2 = [1, 1, 1, 0];
  const history = [m1, m2];
  const analysis = leakAnalysis(history);
  assert.equal(analysis.leakedPositions, 3, "[layer A] 0000 + 1110 → both halves leaked at exactly 3 positions");
  assert.equal(analysis.forgeable, 8, "[layer A] 3 leaked positions → 2^3 = 8 forgeable messages");

  // the forgery really verifies with the production verify() — a message the key never signed
  const evil = findForgeableMessage(history);
  assert.notEqual(evil, null, "[layer A] after reuse at least one forgeable message must be found");
  assert.equal(
    history.some((m) => m.every((bit, i) => bit === evil[i])),
    false,
    "[layer A] the forgeable message found must not match an already signed one",
  );
  const evilSig = sign(sk, evil);
  assert.equal(verify(pk, evil, evilSig), true, "[layer A] after reuse the forgery passes the production verify()");

  console.log(
    "✓ layer A (production module): valid=true, forgery=false, reuse → 3/4 leak → 8 forgeries, forge-after-reuse verify()=true.",
  );
}

// ─── Layer B: independent reference + byte-for-byte cross-check ─────────────────────
// The reference is the same scheme implemented INDEPENDENTLY on node:crypto (it does not
// import js/schemes/lamport.mjs). Cross-check: with the SAME deterministic rng, the
// production and reference keygen() must give byte-identical sk/pk.
const H = (hex) => createHash("sha256").update(Buffer.from(hex, "hex")).digest("hex");
const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

function referenceKeygen(rng, n = 4, secretBytes = 4) {
  const sk = [],
    pk = [];
  for (let i = 0; i < n; i++) {
    const s0 = bytesToHex(rng(secretBytes));
    const s1 = bytesToHex(rng(secretBytes));
    sk.push([s0, s1]);
    pk.push([H(s0), H(s1)]);
  }
  return { sk, pk };
}

const referenceSign = (sk, msg) => msg.map((bit, i) => sk[i][bit]);
const referenceVerify = (pk, msg, sig) => msg.every((bit, i) => H(sig[i]) === pk[i][bit]);

// Deterministic PRNG (mulberry32-like) — NOT cryptographic, only for reproducible test
// vectors. Two independent instances with the same seed produce an identical byte
// sequence given the same call order.
function makeDeterministicRng(seed) {
  let state = seed >>> 0;
  function nextByte() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0 & 0xff;
  }
  return (n) => {
    const out = new Uint8Array(n);
    for (let i = 0; i < n; i++) out[i] = nextByte();
    return out;
  };
}

const SEED = 0xc0ffee;
{
  const boevoyKp = keygen({ rng: makeDeterministicRng(SEED) });
  const referenceKp = referenceKeygen(makeDeterministicRng(SEED));

  assert.deepEqual(boevoyKp.sk, referenceKp.sk, "[layer B] sk of the production module and the reference must match byte for byte");
  assert.deepEqual(boevoyKp.pk, referenceKp.pk, "[layer B] pk of the production module and the reference must match byte for byte");

  // cross-check at the signature/verification level too: a signature made by the production
  // sign() passes the reference verify() and vice versa — both implementations compute the
  // same scheme.
  const msg = [0, 1, 0, 1];
  const boevoySig = sign(boevoyKp.sk, msg);
  const referenceSig = referenceSign(referenceKp.sk, msg);
  assert.deepEqual(boevoySig, referenceSig, "[layer B] the production and reference signatures must match byte for byte");
  assert.equal(referenceVerify(referenceKp.pk, msg, boevoySig), true, "[layer B] the reference verify() accepts the production signature");
  assert.equal(verify(boevoyKp.pk, msg, referenceSig), true, "[layer B] the production verify() accepts the reference signature");

  console.log("✓ layer B (independent reference): production sk/pk/signature matched the node:crypto reference byte for byte on a deterministic rng.");
}

// ─── ECDSA (K1) — by properties, WITHOUT an independent reference ────────────────────
// Writing a second ECDSA implementation would mean hand-rolling cryptography, which
// defeats the point of using an audited library. Instead of a reference, we check
// properties that cannot pass with wrong arithmetic: the library verify() accepts our
// signatures (including the hand-made signWithFixedK), rejects a signature over a
// modified message, and the d recovered from nonce reuse equals the real one.
import {
  keygen as ecdsaKeygen,
  sign as ecdsaSign,
  verify as ecdsaVerify,
  hashMessage,
  signWithFixedK,
  recoverFromNonceReuse,
  ORDER_N,
} from "../js/schemes/ecdsa.mjs";

console.log("▶ schemes.smoke: imported production js/schemes/ecdsa.mjs (not a copy, not a reference).");

{
  const { priv, pub, d } = ecdsaKeygen();
  const msg = "Hello, Ethereum";
  const h = hashMessage(msg);
  const sig = ecdsaSign(priv, h);
  assert.equal(ecdsaVerify(pub, h, sig), true, "[ECDSA] sign -> verify must be true (library verify)");

  // message edited -> verify must fail (C-4)
  const tamperedHash = hashMessage(msg + "!");
  assert.equal(ecdsaVerify(pub, tamperedHash, sig), false, "[ECDSA] verify of a modified message must be false");

  console.log("✓ ECDSA: sign -> verify=true, verify(modified message)=false (production verify()).");

  // signWithFixedK on two different messages with a SHARED k -> both signatures pass the
  // library verify(), and recoverFromNonceReuse yields the real d (C-7, SEC1 §4.1.3).
  const k = 0xdeadbeef_cafebaben;
  const msgA = "Transfer 1 ETH to Alice";
  const msgB = "Transfer 100 ETH to Mallory";
  const hA = hashMessage(msgA);
  const hB = hashMessage(msgB);
  const sigA = signWithFixedK(hA, d, k);
  const sigB = signWithFixedK(hB, d, k);

  assert.equal(ecdsaVerify(pub, hA, sigA), true, "[ECDSA] the signWithFixedK signature A must pass the library verify()");
  assert.equal(ecdsaVerify(pub, hB, sigB), true, "[ECDSA] the signWithFixedK signature B must pass the library verify()");

  // low-s holds on both hand-made signatures (otherwise the library verify() would have rejected them above)
  assert.equal(sigA.s <= ORDER_N / 2n, true, "[ECDSA] signWithFixedK must normalize s to low-s (signature A)");
  assert.equal(sigB.s <= ORDER_N / 2n, true, "[ECDSA] signWithFixedK must normalize s to low-s (signature B)");

  const recovered = recoverFromNonceReuse(hA, sigA, hB, sigB);
  assert.notEqual(recovered, null, "[ECDSA] recoverFromNonceReuse must find a solution on real nonce reuse");
  assert.equal(recovered.d, d, "[ECDSA] the recovered d must EQUAL the real private key");

  console.log(
    "✓ ECDSA: signWithFixedK(A)/signWithFixedK(B) with a shared k both verify()=true (low-s holds), recoverFromNonceReuse -> d matched the real one.",
  );
}

// ─── Layer C: exercise track (K11(a)-(d)) ──────────────────────────────────────────────
// Imports the production js/schemes/tasks.mjs (not a copy). Four sub-checks:
//   (a) determinism — one seed gives a byte-identical instance, different seeds differ.
//   (b) solvability — over a sample of seeds T1 has exactly 25 solutions (a structural
//       invariant), T2 has at least one pair, and the solutions from enumerateSolutions()
//       pass check().
//   (c) non-triviality — check() rejects: another seed's solution, an exceeded budget,
//       "signed the target", and the T2 trap "same nonce, but the same message" (z1=z2).
//   (d) code binding — changing the seed/solution changes the code; verifyCode accepts only
//       codes of its own seed among valid solutions and rejects foreign/corrupted ones.
import {
  setup as taskSetup,
  check as taskCheck,
  enumerateSolutions,
  completionCode,
  verifyCode,
  TASK_S2_FORGE,
  TASK_S1_NONCE,
} from "../js/schemes/tasks.mjs";

console.log("▶ schemes.smoke: layer C — imported production js/schemes/tasks.mjs (not a copy).");

// (a) determinism ---------------------------------------------------------------------
{
  const seed = "CS401-w3-alice";
  const i1 = taskSetup(TASK_S2_FORGE, seed);
  const i2 = taskSetup(TASK_S2_FORGE, seed);
  assert.deepEqual(i1.sk, i2.sk, "[K11a] T1: same seed -> byte-identical sk");
  assert.deepEqual(i1.pk, i2.pk, "[K11a] T1: same seed -> byte-identical pk");
  assert.deepEqual(i1.target, i2.target, "[K11a] T1: same seed -> same target");

  const iOther = taskSetup(TASK_S2_FORGE, "CS401-w3-bob");
  assert.notDeepEqual(i1.sk, iOther.sk, "[K11a] T1: different seeds -> different instances");

  const n1 = taskSetup(TASK_S1_NONCE, seed);
  const n2 = taskSetup(TASK_S1_NONCE, seed);
  assert.equal(n1.d, n2.d, "[K11a] T2: same seed -> same private key");
  assert.deepEqual(
    n1.sigs.map((s) => s.message),
    n2.sigs.map((s) => s.message),
    "[K11a] T2: same seed -> same message order (deterministic permutation)",
  );
  const nOther = taskSetup(TASK_S1_NONCE, "CS401-w3-bob");
  assert.notEqual(n1.d, nOther.d, "[K11a] T2: different seeds -> different keys");

  console.log("✓ layer C (a): one seed -> byte-identical instance (T1 and T2); different seeds -> different.");
}

// (b) solvability (sample of >= 100 seeds) ----------------------------------------------
{
  const SAMPLE = 100;
  for (let i = 0; i < SAMPLE; i++) {
    const seed = `sample-seed-${i}`;
    const inst = taskSetup(TASK_S2_FORGE, seed);
    const sols = enumerateSolutions(inst);
    assert.equal(sols.length, 25, `[K11b] T1 seed="${seed}": expected exactly 25 solutions, got ${sols.length}`);
    const check1 = taskCheck(inst, { history: sols[0].history });
    assert.equal(check1.ok, true, `[K11b] T1 seed="${seed}": the first enumerated solution must be accepted by check()`);
  }
  console.log(`✓ layer C (b): T1 — over ${SAMPLE} seeds exactly 25 valid solutions each time, check() accepts the enumerated one.`);

  let t2WithSolution = 0;
  for (let i = 0; i < SAMPLE; i++) {
    const seed = `sample-seed-${i}`;
    const inst = taskSetup(TASK_S1_NONCE, seed);
    const sols = enumerateSolutions(inst);
    assert.ok(sols.length >= 1, `[K11b] T2 seed="${seed}": at least one solving pair must be found`);
    assert.ok(sols.length <= 10, `[K11b] T2 seed="${seed}": at most C(5,2)=10 pairs are possible`);
    const res = taskCheck(inst, { indices: sols[0].indices });
    assert.equal(res.ok, true, `[K11b] T2 seed="${seed}": the enumerated pair must be accepted by check()`);
    t2WithSolution++;
  }
  console.log(`✓ layer C (b): T2 — over ${SAMPLE} seeds each had a solving pair, check() accepts it (${t2WithSolution}/${SAMPLE}).`);
}

// (c) non-triviality ----------------------------------------------------------------------
{
  const seed = "CS401-w3-alice";
  const inst = taskSetup(TASK_S2_FORGE, seed);
  const sols = enumerateSolutions(inst);
  const [m1, m2] = sols[0].history;

  // third signature -> budget-exceeded
  const third = inst.target.map((b, i) => b ^ (i === 0 ? 1 : 0)); // anything different from target
  const overBudget = taskCheck(inst, { history: [m1, m2, third] });
  assert.equal(overBudget.reason, "budget-exceeded", "[K11c] T1: a third signature must give budget-exceeded");

  // signed the target itself -> target-was-signed
  const signedTarget = taskCheck(inst, { history: [inst.target, m2] });
  assert.equal(signedTarget.reason, "target-was-signed", "[K11c] T1: signing the target must give target-was-signed");

  // a solution from another seed does not pass check() on THIS instance unless it is
  // one of ITS OWN solutions (checked on a concrete counterexample — a foreign-seed
  // solution that differs from every local solution by the way the history is built).
  const otherInst = taskSetup(TASK_S2_FORGE, "CS401-w3-carol");
  const otherSols = enumerateSolutions(otherInst);
  const foreignHistory = otherSols[0].history;
  const isAlsoLocalSolution = sols.some(
    (s) => JSON.stringify(s.history.map((m) => m.join(""))) === JSON.stringify(foreignHistory.map((m) => m.join(""))),
  );
  if (!isAlsoLocalSolution) {
    const foreignCheck = taskCheck(inst, { history: foreignHistory });
    // On THIS instance a foreign history is either not forgeable (not-forgeable-yet), or
    // coincided with the target by luck — in any case NOT "ok" with a FOREIGN target.
    assert.notEqual(foreignCheck.ok, true, "[K11c] T1: another seed's history must not solve THIS instance");
  }

  // T2: the trap pair "same nonce, but the same message" -> same-message-pair, not solved.
  // Group indices by message and take any group of >=2 (the instance is built to have
  // exactly one such group — the "same message signed twice" trick).
  const n = taskSetup(TASK_S1_NONCE, seed);
  const byMessage = new Map();
  n.sigs.forEach((s, i) => {
    if (!byMessage.has(s.message)) byMessage.set(s.message, []);
    byMessage.get(s.message).push(i);
  });
  const trapGroup = [...byMessage.values()].find((idxs) => idxs.length >= 2);
  assert.ok(trapGroup, "[K11c] T2: the instance must contain a trap — two indices with the same message");
  const trapResult = taskCheck(n, { indices: [trapGroup[0], trapGroup[1]] });
  assert.equal(trapResult.reason, "same-message-pair", "[K11c] T2: the trap pair must give same-message-pair, not solved");
  assert.notEqual(trapResult.ok, true, "[K11c] T2: the trap pair is never 'ok'");

  console.log("✓ layer C (c): budget-exceeded, target-was-signed, a foreign history does not solve the instance, T2 same-message-pair — all explicitly rejected.");
}

// (d) code bound to the seed and to the solution ---------------------------------------------------
{
  const seedA = "CS401-w3-alice";
  const seedB = "CS401-w3-bob";
  const instA = taskSetup(TASK_S2_FORGE, seedA);
  const solsA = enumerateSolutions(instA);

  const codeA1 = completionCode(TASK_S2_FORGE, seedA, solsA[0].canonicalSolution);
  const codeA2 = completionCode(TASK_S2_FORGE, seedA, solsA[1].canonicalSolution);
  assert.notEqual(codeA1, codeA2, "[K11d] different solutions of ONE seed must give different codes");

  const instB = taskSetup(TASK_S2_FORGE, seedB);
  const solsB = enumerateSolutions(instB);
  const codeB1 = completionCode(TASK_S2_FORGE, seedB, solsB[0].canonicalSolution);
  assert.notEqual(codeA1, codeB1, "[K11d] same taskId, different seeds -> different codes (even if canonicalSolution matched in form)");

  assert.equal(verifyCode(TASK_S2_FORGE, seedA, codeA1), true, "[K11d] verifyCode accepts a code of its own seed");
  assert.equal(verifyCode(TASK_S2_FORGE, seedB, codeA1), false, "[K11d] verifyCode rejects a code of a FOREIGN seed");

  // Replacing one character of the code -> rejected (a negative check).
  const corrupted = codeA1.slice(0, -1) + (codeA1.slice(-1) === "0" ? "1" : "0");
  assert.equal(verifyCode(TASK_S2_FORGE, seedA, corrupted), false, "[K11d] a corrupted code is rejected");

  console.log("✓ layer C (d): the code differs by solution and by seed; verifyCode accepts only valid codes of its own seed, rejects foreign/corrupted ones.");
}

console.log("✓ schemes.smoke: PASS (production js/schemes/lamport.mjs, js/schemes/ecdsa.mjs and js/schemes/tasks.mjs imported and covered by tests).");
