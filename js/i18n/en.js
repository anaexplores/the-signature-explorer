// js/i18n/en.js — PRIMARY and (in v1) ONLY dictionary (K8).
// Every user-facing string in the product lives here. Screens and core modules only
// ever reference keys via t('s2.reuse.verdict') / data-i18n="s2.title" — never literals.
// Flat keys, pattern s{N}.block.item. Comments are exempt from the K8 check —
// VALUES must be zero-Cyrillic English (K8 grep enforces this).

export default {
  // Shared across screens.
  "common.underConstruction": "This screen isn't built yet.",
  "common.resetProgress": "Reset progress",
  "common.next": "Next →",

  // Shared "3 questions" lens (js/core/lens.mjs) — same neutral wording everywhere
  // (neutral framing). Family-specific answers live under s1.lens.* / s2.lens.*.
  "lens.title": "The lens",
  "lens.q1": "What does the signature reveal?",
  "lens.q2": "What breaks it?",
  "lens.q3": "Is it quantum-safe?",

  // Progression hints — soft, never blocking. Shown only on deep-link entry
  // when the previous screen hasn't been seen yet.
  "progress.skipped.s0": "You skipped the intro — that's where MetaMask meets the math.",
  "progress.skipped.s1": "You skipped the ECDSA screen — that's where quantum breaks things.",

  // build integrity indicator (live-smoke requirement, kept alive in
  // S0's footer in tiny text — see js/screens/intro.mjs for why it moved here).
  "build.integrityLabel": "build integrity: sha256('abc')",
  "build.integrityMatch": "✓",
  "build.integrityMismatch": "✗ MISMATCH",

  // S2 · hash.html — Lamport one-time signature (block A). Texts translate
  // the original prototype's formulations (didactically vetted) — not rewritten.
  "s2.title": "Hash-based signatures — Lamport one-time signature",
  "s2.subtitle":
    "Real SHA-256. The message is shrunk to 4 bits and secrets to 4 bytes so the whole scheme stays visible. Watch what happens when you sign twice with the same key.",
  "s2.gen.button": "Generate a key pair",
  "s2.gen.state.before": "Private key = 8 random secrets (one pair per message bit). Public key = their hashes.",
  "s2.gen.state.after": "Done. The public key is published (the hashes). Now sign a message.",
  "s2.msg.label": "Message (4 bits) — click a bit to flip it",
  "s2.sign.button": "Sign this message",
  "s2.legend.hidden": "hidden secret (not used in any signature yet)",
  "s2.legend.revealed": "revealed by a signature",
  "s2.legend.leaked": "BOTH halves revealed — leaked",
  "s2.grid.headPos": "position",
  "s2.grid.head0": "bit = 0",
  "s2.grid.head1": "bit = 1",
  "s2.cell.tagHidden": "secret hidden",
  "s2.cell.tagRevealed": "revealed",
  "s2.cell.tagLeaked": "BOTH revealed",
  "s2.cell.neededSuffix": " · needed for this message",
  "s2.attack.title": "How compromised is the key",
  "s2.verdict.oneSigned": "1 message signed · the key is still intact",
  "s2.note.oneSigned":
    "Exactly one half of each pair got revealed — precisely the halves this message needed. Neither position exposes both halves, so nobody can forge a different message. So it's designed to be ONE-time. Now flip a few bits and sign again with the same key.",
  "s2.verdict.multiSigned": "{count} messages signed with the same key · leaked on {leaked}/{total} positions",
  "s2.note.multiSigned":
    "Wherever the second message's bit differed from the first, the OTHER half of that pair got revealed too. An attacker who saw both signatures now holds both halves on {leaked} position(s) and can pick either bit there. They can forge {forgeable} of the possible messages. This is why one-time means one-time. XMSS/Merkle (next screens) solve exactly this.",
  "s2.forge.button": "Forge a message nobody ever signed",
  "s2.forge.resultTitle": "Forged message — this key never signed this",
  "s2.forge.resultNote":
    "Assembled purely from the leaked halves shown above, using the real Lamport verify() — this is not a simulation.",
  "s2.forge.verified": "verified ✓",
  "s2.forge.unavailable": "No forgeable message left to demonstrate — sign a couple more times.",

  // S2 lens answers (block C, family = hash-based / Lamport).
  "s2.lens.a1": "Half of the secrets — exactly the bits your message needed.",
  "s2.lens.a2": "Reuse, and little else.",
  "s2.lens.a3": "Yes — security reduces to the strength of the hash.",

  // S2 block B — the reader's own path of questions after getting burned
  // in block A: "can't I just remember state?" -> "tolerate a few repeats?" ->
  // "remember nothing at all?". Each step's answer is transcribed VERBATIM from its
  // docs/PROVENANCE.md "Product statement (EN)" (C-23/C-24/C-25) — not rewritten.
  "s2.blockB.step1.q": "Fine — can't I just remember which key I already burned?",
  // = claim.c23.text, word for word (same duplication pattern as s0.landing.everyday
  // / claim.c19.text) — this is the screen-display copy, sources.mjs renders the
  // citation copy from the claim key directly.
  "s2.blockB.step1.a":
    "XMSS solves this by putting many one-time keys under a single Merkle root, so one public key covers thousands of signatures. The price is state: the signer must remember which one-time key it already burned, and reusing a key state destroys the guarantee outright.",
  "s2.blockB.step1.svg.aria": "A Merkle tree of one-time keys under a single root, with one leaf marked as already used.",
  "s2.blockB.step1.svg.root": "root",
  "s2.blockB.step1.svg.used": "used",

  "s2.blockB.step2.q": "And if I do lose the counter — can I tolerate a few repeats?",
  // = claim.c24.text, word for word. Deliberately zero numbers (docs/PROVENANCE.md C-24:
  // FORS's k/t/a parameters are NOT shown — a second number invites a table, which the
  // closing comparison forbids). The illustrative meter fill below is a fixed demo constant, not a cited
  // figure, same treatment as Lamport's demo N=4 (js/schemes/params.mjs).
  "s2.blockB.step2.a":
    "FORS signs a random subset of secrets instead of a fixed one, so a repeat does not hand over the key at once — it only shaves off security, gradually.",
  "s2.blockB.step2.caption": "Same meter as block A, gentler slope: FORS trades an instant cliff for gradual wear.",

  "s2.blockB.step3.q": "Can I remember nothing at all?",
  // = claim.c25.text, word for word. Uses the STRONG wording ("derived from the
  // message itself") — docs/PROVENANCE.md C-25 confirmed the exact mechanism locator
  // (FIPS 205 §3 + §9.2 Algorithm 19) on 2026-09-28, closing the [TO VERIFY] item that
  // would otherwise have required the softer "keeps no counter" fallback.
  "s2.blockB.step3.a":
    "SLH-DSA drops the counter entirely: which one-time keys get used is derived from the message itself, so the signer remembers nothing between signatures. The whole scheme rests on hash functions and nothing else.",
  "s2.blockB.step3.svg.aria": "No counter is kept between signatures; the key index comes from a hash of the message instead.",
  "s2.blockB.step3.svg.noCounter": "no counter kept",
  "s2.blockB.step3.svg.hashOnly": "hash only",

  // S2 block C (closing section) — closes both threads: "reuse = death"
  // (nonce on S1 <-> one-time key here) and "quantum breaks clever math, not hashes".
  "s2.blockC.compareTitle": "ECDSA vs. hash-based — closing the loop",
  // = claim.c6.text, word for word (same duplication pattern as s2.blockB.step1.a).
  "s2.blockC.ecdsaBreaks":
    "A quantum computer running Shor's algorithm solves the discrete-logarithm problem in polynomial time — the exact problem ECDSA's security rests on — so it recovers d from Q. The signature itself still verifies; what breaks is the secret behind it.",
  // = claim.c26.text, word for word.
  "s2.blockC.hashSurvives":
    "Hash-based signatures stay quantum-safe because their security reduces to the strength of the hash function — there is no clever algebraic structure for Shor's algorithm to attack.",
  // = claim.c13.text, word for word. Exactly one comparison line, never a table.
  "s2.blockC.sizes":
    "An SLH-DSA-128s signature is {slhdsaSigBytes} bytes against {ecdsaSigBytes} for ECDSA on secp256k1 — that is the price of needing nothing but a hash function. The public key stays small: {slhdsaPkBytes} bytes.",
  // Verbatim, no link (a dead link would cost trust) — not a citable claim, a
  // roadmap disclaimer, so it carries no claim.* entry.
  "s2.blockC.notYet": "BLS and lattices come in the next version.",

  // S1 · ecdsa.html — real ECDSA on secp256k1. Every factual claim here is
  // anchored to a docs/PROVENANCE.md entry (C-1..C-13) — see comments in js/screens/ecdsa.mjs.
  "s1.title": "Classic EC — ECDSA",
  "s1.subtitle":
    "Real ECDSA on secp256k1 — the same curve as MetaMask. Sign, tamper, then watch what a quantum computer and a repeated nonce each do to it.",
  "s1.metamask.anchor": "That thing you click in MetaMask — this is what it actually does.",
  "s1.metamask.curve": "the same curve — secp256k1",
  "s1.metamask.diff":
    "MetaMask (personal_sign, EIP-191) hashes with Keccak-256 over a prefixed message and returns {ethSigBytes} bytes including a recovery id v. Here we use SHA-256 and plain (r, s) — simpler to look at, same curve, same failure modes.",
  "s1.metamask.keccakNote":
    "Ethereum uses Keccak-256 (the original Keccak submission), which differs from NIST's finalized SHA-3 (FIPS 202) by one padding byte — the outputs are not the same.",

  "s1.gen.button": "Generate a key pair",
  "s1.gen.state.before": "No key yet. Generate one to sign something.",
  "s1.gen.privLabel": "Private key d ({ecdsaPrivBytes} bytes):",
  "s1.gen.pubLabel": "Public key Q = d·G (compressed):",
  "s1.gen.note": "Easy this way, impossible back: multiplying is fast, undoing it means solving the discrete-log problem — a key pair is a number and its one-way trace.",

  "s1.msg.label": "Message",
  "s1.sign.button": "Sign",
  "s1.sig.rLabel": "r =",
  "s1.sig.sLabel": "s =",
  "s1.verify.ok": "verified ✓",
  "s1.verify.fail": "verification failed ✗",
  "s1.verify.pending": "not signed yet",

  "s1.quantum.toggle": "Switch on a quantum computer",
  "s1.quantum.note":
    "A quantum computer running Shor's algorithm solves the discrete-log problem in polynomial time — the exact problem ECDSA's security rests on — so it recovers d from Q. (Shown here, not actually executed — no quantum computer runs in your browser.)",
  "s1.quantum.recoveredLabel": "d recovered from Q via Shor (illustrated, not executed):",
  "s1.quantum.verdict": "Quantum doesn't break the signature. It breaks the secret behind it.",
  "s1.quantum.stillVerified": "The signature above still reads verified ✓ — but anyone holding this recovered d can now sign anything as you.",

  "s1.nonce.toggle": "What if the same nonce is used twice?",
  "s1.nonce.intro":
    "A real library derives k deterministically per message (RFC 6979) — a repeat like this can't happen by accident. Here we set k by hand to reproduce an actual disaster: Sony's PS3 code returned the same constant every time.",
  "s1.nonce.manualK": "k is set by hand here, exactly like the PS3 bug — a real signer never does this.",
  "s1.nonce.sig1Label": "Signature 1 (same k):",
  "s1.nonce.sig2Label": "Signature 2 (same k):",
  "s1.nonce.bothVerified": "Both signatures still read verified ✓ individually — library verify(), real numbers.",
  "s1.nonce.recoveredLabel": "Private key d, recovered live from these two signatures:",
  "s1.nonce.matchVerdict": "This matches the real private key exactly. Reuse a nonce and the key is gone.",

  "s1.lens.a1": "Nothing about d… until a nonce repeats.",
  "s1.lens.a2": "Shor's algorithm, nonce reuse, weak randomness.",
  "s1.lens.a3": "No.",

  "s1.next.label": "Next: hash-based signatures →",

  "s2.next.label": "Start over →",

  // S0 · index.html — intro + lens. MetaMask anchor in the first 15 seconds
  // then the neutral lens as a frame for what's coming on S1/S2.
  "s0.title": "What is a signature?",
  "s0.subtitle": "Prove you hold the secret — without showing it.",
  "s0.metamask.card": "Signature demo",
  "s0.metamask.anchor": "That thing you click in a crypto wallet — this is what it actually does.",

  "s0.msg.label": "Message",
  "s0.hash.label": "SHA-256 (first 16 hex):",
  "s0.sign.button": "Sign it",
  "s0.verify.ok": "verified ✓",
  "s0.verify.fail": "verification failed ✗",
  "s0.verify.pending": "not signed yet",
  "s0.tamper.hint": "Click a character of the signed message to tamper with it.",

  "s0.showKey.button": "Show the private key",
  "s0.showKey.label": "Private key d ({ecdsaPrivBytes} bytes):",
  // Honest framing for the revealed key: it is a fixed demo key (DEMO_PRIV_BYTES in
  // js/screens/intro.mjs), not generated per visitor, and the page makes no network
  // requests. No digits here on purpose (K10.4b).
  "s0.showKey.demo": "A fixed demo key, the same for every visitor — not a real wallet. Nothing leaves your browser.",
  "s0.showKey.note": "…which is exactly what never happens for real.",

  "s0.lens.hint": "you'll answer this for ECDSA and for hash-based signatures next",

  "s0.landing.nft": "Quantum doesn't just threaten coins — an NFT is a record guarded by the same signature.",
  // Replaces the old "the same machinery..." wording (a tracked fix,
  // docs/PROVENANCE.md C-19): "machinery" was literally false — passports, PDFs and OS
  // updates use different algorithms (RSA/ECDSA/EdDSA/OpenPGP). What they share is the
  // CONSTRUCTION (sign with a private key, verify against a published public key), not
  // the machinery. Verbatim from docs/PROVENANCE.md's Product statement (EN) for C-19.
  "s0.landing.everyday":
    "The same construction — sign with a private key, verify against a published public key — is what authenticates the chip in your passport, a signed PDF, and the operating-system updates your machine installs.",
  // One line, no development, docs/PROVENANCE.md C-20. Cloudflare
  // blog is cited as the vendor announcement of the EVENT, not as the source for the
  // ML-DSA-44 scheme/size (that's FIPS 204 — see js/data/claims.mjs c20 refs).
  "s0.landing.pqLive":
    "This is not a future problem: since September 2026 Cloudflare's 1.1.1.1 resolver validates post-quantum DNSSEC signatures made with ML-DSA-44 — {mldsa44SigBytes} bytes each, against {ecdsaSigBytes} for the ECDSA signatures DNSSEC uses today.",

  "s0.next.label": "Next: real ECDSA on secp256k1 →",

  // ---------------------------------------------------------------------------------
  // Provenance-in-product — js/core/sources.mjs, shared by S0/S1/S2.
  // ---------------------------------------------------------------------------------
  "sources.title": "Where this comes from",
  "sources.allTitle": "All sources — every claim in this tool",
  "sources.pendingVerification": "section number pending verification",
  "sources.kind.standard": "defined in",
  "sources.kind.derivation": "derived from",
  "sources.kind.incident": "reported in",
  "sources.kind.measurement": "announced by",
  "sources.screenLabel.s0": "Intro",
  "sources.screenLabel.s1": "ECDSA",
  "sources.screenLabel.s2": "Hash-based signatures",

  "cite.title": "Cite this page",
  "cite.copyCitation": "Copy citation",
  "cite.copyBibtex": "Copy BibTeX",
  "cite.selectAndCopy": "select and copy",
  "cite.noUrlNote": "permanent URL not assigned yet",
  "cite.accessedLabel": "accessed",
  "cite.licenseNote": "Content licensed CC BY 4.0.",

  // Claim texts (docs/PROVENANCE.md "Product statement (EN)", transcribed verbatim —
  // markdown backticks stripped, wording unchanged, numbers replaced by the same
  // {placeholder} tokens docs/PROVENANCE.md itself specifies). js/data/claims.mjs points at
  // these via `textKey`; js/core/sources.mjs renders them with figures substituted from
  // js/data/claims.mjs's FIGURES (K10.4a — no cited number is ever a literal here).
  "claim.c1.text":
    "An ECDSA signature is a pair of numbers (r, s), computed from the message hash, the private key, and a per-signature nonce k.",
  "claim.c2.text": "MetaMask signs with ECDSA on secp256k1 — the very same curve this page uses.",
  "claim.c3.text":
    "An ECDSA private key is a {ecdsaPrivBytes}-byte number d; the public key is the curve point Q = d·G. Computing Q from d takes microseconds; recovering d from Q is the discrete-logarithm problem, and no classical algorithm is known that does it.",
  "claim.c4.text":
    "Verification recomputes the hash of the message it is given, so flipping a single character makes the same signature fail.",
  "claim.c5.text":
    "Production libraries do not draw the nonce k at random: RFC 6979 derives it deterministically from the private key and the message hash, so the same k cannot reappear by accident.",
  "claim.c6.text":
    "A quantum computer running Shor's algorithm solves the discrete-logarithm problem in polynomial time — the exact problem ECDSA's security rests on — so it recovers d from Q. The signature itself still verifies; what breaks is the secret behind it.",
  "claim.c7.text":
    "Two signatures made with the same nonce k share the same r. From that pair alone — no private key needed — anyone can solve for k, and then for d.",
  "claim.c8.text":
    "Sony's PS3 signing code used the same constant nonce for every signature. In 2010 that let researchers recover the console's ECDSA private key from published signatures.",
  "claim.c9.text":
    "Android's SecureRandom bug (2013, CVE-2013-7372) made ECDSA nonces predictable, and Bitcoin keys were drained from wallets that relied on it.",
  "claim.c10.text":
    "MetaMask's personal_sign (EIP-191) hashes a prefixed message with Keccak-256 and returns {ethSigBytes} bytes — (r, s) plus a recovery id v. This page hashes with SHA-256 and shows plain (r, s): same curve, same failure modes, fewer moving parts.",
  "claim.c11.text":
    "Ethereum uses Keccak-256 — the original Keccak submission — which differs from NIST's finalized SHA-3 (FIPS 202) by one padding byte. For the same input the two produce different digests.",
  "claim.c12.text":
    "A correctly made ECDSA signature reveals nothing about the private key — the one exception is a repeated nonce, which gives it away completely.",
  "claim.c14.text":
    "A digital signature proves that whoever produced it holds a particular private key — and it proves this without ever transmitting that key.",
  "claim.c15.text":
    "The fingerprint under the message box is a real SHA-256 digest, computed in your browser: the signature is made over this digest, not over the text itself.",
  "claim.c16.text":
    "The line below recomputes SHA-256 of the string abc every time this page loads and compares it with NIST's published example value — if the build were broken, it would say so.",
  "claim.c17.text":
    "Signing never puts the private key on the wire: the key stays where it was made, and only (r, s) travels. Revealing it here is a demo convenience, not something a real signer ever does.",
  "claim.c18.text":
    "An NFT is not a file you hold — it is a ledger entry, and the only thing that authorizes moving it is an ECDSA signature on the very same curve. Whatever breaks the signature breaks the ownership.",
  "claim.c19.text":
    "The same construction — sign with a private key, verify against a published public key — is what authenticates the chip in your passport, a signed PDF, and the operating-system updates your machine installs.",
  "claim.c20.text":
    "This is not a future problem: since September 2026 Cloudflare's 1.1.1.1 resolver validates post-quantum DNSSEC signatures made with ML-DSA-44 — {mldsa44SigBytes} bytes each, against {ecdsaSigBytes} for the ECDSA signatures DNSSEC uses today.",
  "claim.c21.text":
    "A Lamport key pair holds two random secrets for every bit of the message; the public key is just their hashes. Signing reveals exactly one secret per bit — the one the message's bit selects — and verifying means hashing what was revealed and matching it against the public key.",
  "claim.c22.text":
    "Sign a second, different message with the same key and every bit position where the two messages disagree gives up both of its secrets. An attacker can then choose either bit freely at those positions: with L leaked positions, 2^L messages become forgeable — including messages this key never signed.",
  "claim.c23.text":
    "XMSS solves this by putting many one-time keys under a single Merkle root, so one public key covers thousands of signatures. The price is state: the signer must remember which one-time key it already burned, and reusing a key state destroys the guarantee outright.",
  "claim.c26.text":
    "Hash-based signatures stay quantum-safe because their security reduces to the strength of the hash function — there is no clever algebraic structure for Shor's algorithm to attack.",
  "claim.c24.text":
    "FORS signs a random subset of secrets instead of a fixed one, so a repeat does not hand over the key at once — it only shaves off security, gradually.",
  "claim.c25.text":
    "SLH-DSA drops the counter entirely: which one-time keys get used is derived from the message itself, so the signer remembers nothing between signatures. The whole scheme rests on hash functions and nothing else.",
  "claim.c13.text":
    "An SLH-DSA-128s signature is {slhdsaSigBytes} bytes against {ecdsaSigBytes} for ECDSA on secp256k1 — that is the price of needing nothing but a hash function. The public key stays small: {slhdsaPkBytes} bytes.",

  // Exercise track (js/schemes/tasks.mjs, js/core/task-ui.mjs). Every number
  // here is single-digit on purpose (K10.4b bans any 2+-digit number in this file that
  // isn't a `figures` value or an ALLOWED_LITERALS entry — the seed, the completion code
  // and attempt counters are RUNTIME values, passed through t(key, vars), never literals).
  "s0.task.pointer":
    "Both screens with a mechanic — ECDSA and hash-based signatures — carry an optional exercise for instructors: look for \"Try this as an exercise\" near the top of each.",

  "task.teaser.label": "Try this as an exercise",
  "task.resetAttempt": "Reset attempt",
  "task.completionCode.label": "Completion code",

  "task.instructor.toggle": "I'm an instructor",
  "task.instructor.seedLabel": "Assignment seed (any text — students on the same seed get the same task)",
  "task.instructor.randomButton": "Random",
  "task.instructor.linkLabel": "Assignment link",
  "task.instructor.linkNoSeed": "Enter a seed above to build the link.",
  "task.instructor.linkTailNote":
    "This tool isn't published at a fixed address yet — append this to your published address once it is.",
  "task.instructor.codeLabel": "Paste a completion code to check it",
  "task.instructor.verifyButton": "Check code",
  "task.instructor.verifyValid": "valid for this assignment ✓",
  "task.instructor.verifyInvalid": "not a valid code for this seed ✗",

  // Mandatory: the exact honesty boundary of the completion code. Never
  // soften, shorten, or move into fine print — it says outright what the code does NOT
  // prove.
  "task.honesty.note":
    "This code proves a valid solution exists for this exact assignment. It does not prove who produced it — everything here runs in the student's browser, and the source is open.",

  // Exercise 1 · s2-forge (hash.html) brief and verdicts.
  "task.s2forge.title": "Exercise · Forge the target",
  "task.s2forge.brief":
    "Goal: make the target message below forgeable using at most two signatures from this one key — without ever signing the target itself. Sign, watch what leaks, then use \"Forge a message nobody ever signed\" once you think the target is covered.",
  "task.s2forge.targetLabel": "Target message (never sign this one)",
  "task.s2forge.budgetLabel": "Signatures used: {used} / {budget}",
  "task.s2forge.badLink": "This exercise link is missing or broken — open it fresh from your instructor, or use \"I'm an instructor\" below to build a new one.",
  "task.hint.s2forge": "A position where both messages agree keeps its other half hidden.",

  // Exercise 2 · s1-nonce (ecdsa.html) brief, list labels and verdicts.
  "task.s1nonce.title": "Exercise · Find the pair that leaks the key",
  "task.s1nonce.brief":
    "Goal: pick exactly two of the five signatures below whose nonce reuse lets you recover the private key, then press \"Recover\".",
  "task.s1nonce.pickLabel": "Selected: {count} / 2",
  "task.s1nonce.recoverButton": "Recover",
  "task.s1nonce.badLink": "This exercise link is missing or broken — open it fresh from your instructor, or use \"I'm an instructor\" below to build a new one.",
  "task.hint.s1nonce": "Look at what the two signatures were made over, not only at r.",

  // Verdict codes (js/schemes/tasks.mjs's `reason` constants) — translated 1:1, never
  // invented ad hoc in a screen (K8: no literal outside this dictionary).
  "task.verdict.pending": "Not yet — keep trying.",
  "task.verdict.solved": "Solved ✓",
  "task.verdict.no-signatures": "Sign at least one message first.",
  "task.verdict.budget-exceeded": "Budget exceeded — this attempt no longer counts. Reset to try again.",
  "task.verdict.target-was-signed": "That signed the target itself — nothing left to forge. Reset to try again.",
  "task.verdict.not-forgeable-yet": "Not forgeable yet with what you've signed.",
  "task.verdict.forge-verify-failed": "Forgery did not verify — this shouldn't happen; reset and try again.",
  "task.verdict.pick-exactly-two": "Pick exactly two signatures.",
  "task.verdict.invalid-selection": "That selection isn't valid — pick two different rows.",
  "task.verdict.same-message-pair":
    "Same nonce — but also the same message, so z1 = z2 and there is nothing to solve.",
  "task.verdict.not-a-reuse-pair": "These two don't share a nonce — no key to recover here.",
  "task.verdict.recovery-mismatch": "Recovery didn't match this key — this shouldn't happen; reset and try again.",
  "task.verdict.unknown-task": "Unknown exercise.",
};
