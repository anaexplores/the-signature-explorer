// js/data/claims.mjs — provenance registry (SSOT for runtime, K10).
// DATA ONLY (K10.5): no `function`, no `=>`, no `import` — just frozen object/array
// literals. This file is bundled verbatim into every screen (js/core/sources.mjs
// renders it) and is checked against docs/PROVENANCE.md by `tools/checks/check.mjs` (K10.1).
//
// docs/PROVENANCE.md is the design-judgment document: reasoning,
// verdicts, historical nuance, [VERIFY] flags, instructions to the engineer. This
// file is its product-facing, language-independent counterpart: id, source, exact
// locator, verified flag, screens, cited figures. The English PROSE that goes with each
// id lives in js/i18n/en.js as `claim.<id>.text` — this file only points at it via
// `textKey`, it never contains a sentence itself (K10.5).
//
// Two eternal rules (docs/PROVENANCE.md header — never revisit):
//   1. IDs are never renumbered. "### C-13 · …" in docs/PROVENANCE.md -> id "c13" here ->
//      public anchor #claim-c13. A retired claim is marked [dev-only] in the doc, not
//      deleted or renumbered, and a new claim always gets the next free number.
//   2. The citation handle "anaexplores" (js/data/site.mjs SITE.author) never changes.
//
// Claims C-13, C-24, C-25: the [dev-only] label is removed from their
// docs/PROVENANCE.md headings in the same commit that adds their records here (the label lifts
// exactly when the screen text and the data record land together). The registry is
// now in FULL parity with docs/PROVENANCE.md: all 26 records (C-1..C-26), zero [dev-only].

// ---------------------------------------------------------------------------
// SOURCES — one entry per row of docs/PROVENANCE.md's primary-sources (canonical
// links) table. K10.1 checks that this object's (id -> url) set is IDENTICAL to that
// table's. Titles/org/year here are for UI rendering only; K10.1 does not check them.
// ---------------------------------------------------------------------------
export const SOURCES = Object.freeze({
  SEC1: {
    title: "SEC 1 v2.0 — Elliptic Curve Cryptography",
    org: "SECG",
    year: 2009,
    url: "https://www.secg.org/sec1-v2.pdf",
  },
  SEC2: {
    title: "SEC 2 v2.0 — Recommended Elliptic Curve Domain Parameters",
    org: "SECG",
    year: 2010,
    url: "https://www.secg.org/sec2-v2.pdf",
  },
  "FIPS186-5": {
    title: "FIPS 186-5 — Digital Signature Standard (DSS)",
    org: "NIST",
    year: 2023,
    url: "https://doi.org/10.6028/NIST.FIPS.186-5",
  },
  RFC6979: {
    title: "RFC 6979 — Deterministic Usage of DSA and ECDSA",
    org: "Pornin",
    year: 2013,
    url: "https://www.rfc-editor.org/rfc/rfc6979",
  },
  SHOR: {
    title:
      "Shor P.W. — Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer, SIAM J. Comput. 26(5):1484-1509",
    org: "SIAM",
    year: 1997,
    url: "https://doi.org/10.1137/S0097539795293172",
  },
  EIP191: {
    title: "EIP-191 — Signed Data Standard",
    org: "Ethereum",
    year: 2016,
    url: "https://eips.ethereum.org/EIPS/eip-191",
  },
  YP: {
    title: "Ethereum Yellow Paper (Wood) — defines Keccak-256 (KEC) and the (v, r, s) transaction signature format",
    org: "Ethereum",
    year: 2014,
    url: "https://ethereum.github.io/yellowpaper/paper.pdf",
  },
  FIPS202: {
    title: "FIPS 202 — SHA-3 Standard",
    org: "NIST",
    year: 2015,
    url: "https://doi.org/10.6028/NIST.FIPS.202",
  },
  KECCAK: {
    title: "Keccak reference / SHA-3 submission (Bertoni, Daemen, Peeters, Van Assche) — original Keccak, padding 0x01",
    org: "Keccak team",
    year: 2011,
    url: "https://keccak.team/files/Keccak-reference-3.0.pdf",
  },
  PS3: {
    title: "fail0verflow — Console Hacking 2010: PS3 Epic Fail, 27C3 (bushing, marcan, segher, sven)",
    org: "CCC",
    year: 2010,
    url: "https://fahrplan.events.ccc.de/congress/2010/Fahrplan/attachments/1780_27c3_console_hacking_2010.pdf",
  },
  "ANDROID-BLOG": {
    title: "Android Developers Blog — Some SecureRandom Thoughts",
    org: "Google",
    year: 2013,
    url: "https://android-developers.googleblog.com/2013/08/some-securerandom-thoughts.html",
  },
  "CVE-7372": {
    title: "CVE-2013-7372 (NVD) — SecureRandom (Apache Harmony) in Android's JCA, versions < 4.4",
    org: "NVD",
    year: 2013,
    url: "https://nvd.nist.gov/vuln/detail/CVE-2013-7372",
  },
  FIPS205: {
    title: "FIPS 205 — Stateless Hash-Based Digital Signature Standard",
    org: "NIST",
    year: 2024,
    url: "https://doi.org/10.6028/NIST.FIPS.205",
  },
  "FIPS180-4": {
    title: "FIPS 180-4 — Secure Hash Standard (SHS)",
    org: "NIST",
    year: 2015,
    url: "https://doi.org/10.6028/NIST.FIPS.180-4",
  },
  "NIST-SHA256EX": {
    title: "NIST CSRC — Example Values, SHA256.pdf, One Block Message Sample",
    org: "NIST CSRC",
    year: 2001,
    url: "https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/SHA256.pdf",
  },
  FIPS204: {
    title: "FIPS 204 — Module-Lattice-Based Digital Signature Standard (ML-DSA)",
    org: "NIST",
    year: 2024,
    url: "https://doi.org/10.6028/NIST.FIPS.204",
  },
  "CF-PQDNS": {
    title: "Cloudflare Blog — 1.1.1.1 now supports post-quantum DNSSEC, all 2,420 bytes of it",
    org: "Cloudflare",
    year: 2026,
    url: "https://blog.cloudflare.com/post-quantum-dnssec-1111/",
  },
  LAMPORT79: {
    title: "Lamport L. — Constructing Digital Signatures from a One Way Function, SRI International, Technical Report CSL-98",
    org: "SRI International",
    year: 1979,
    url: "https://lamport.azurewebsites.net/pubs/dig-sig.pdf",
  },
  // Provenance sweep: the actual verified first source
  // for C-21's bit-pair-per-bit construction — LAMPORT79 does not contain it (§2 is a
  // 40-key/20-subset scheme). DH76 §IV attributes the construction to Lamport in its
  // own text, so the on-screen name stays correct.
  DH76: {
    title: "Diffie W., Hellman M. — New Directions in Cryptography, IEEE Transactions on Information Theory IT-22(6)",
    org: "IEEE",
    year: 1976,
    url: "https://ee.stanford.edu/~hellman/publications/24.pdf",
  },
  RFC8391: {
    title: "RFC 8391 — XMSS: eXtended Merkle Signature Scheme (Huelsing, Butin, Gazdag, Rijneveld, Mohaisen)",
    org: "IRTF",
    year: 2018,
    url: "https://www.rfc-editor.org/rfc/rfc8391",
  },
  "ICAO9303-11": {
    title: "ICAO Doc 9303 — Machine Readable Travel Documents, Part 11: Security Mechanisms for MRTDs, 7th ed.",
    org: "ICAO",
    year: 2015,
    url: "https://www.icao.int/sites/default/files/TRIP/Publications/Doc-9303-7th-Part11.pdf",
  },
  "ISO32000-1": {
    title: "ISO 32000-1:2008 — Document management — Portable document format — Part 1: PDF 1.7",
    org: "ISO / Adobe",
    year: 2008,
    url: "https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf",
  },
  "APT-SECURE": {
    title: "Debian apt-secure(8) manual page (official project documentation)",
    org: "Debian",
    year: 2023,
    url: "https://manpages.debian.org/bookworm/apt/apt-secure.8.en.html",
  },
  // C-18's second ref — YP only backs "signature
  // authorizes the transfer", EIP-721 backs "NFT is a ledger entry" (ownerOf/transferFrom).
  EIP721: {
    title: "EIP-721 — Non-Fungible Token Standard",
    org: "Ethereum",
    year: 2018,
    url: "https://eips.ethereum.org/EIPS/eip-721",
  },
});

// ---------------------------------------------------------------------------
// CLAIMS — all 26 product records (docs/PROVENANCE.md C-1..C-26, full parity).
// `figures` is the ONLY place a cited number lives —
// js/i18n/en.js only ever holds `{placeholder}` tokens for these.
// ---------------------------------------------------------------------------
export const CLAIMS = Object.freeze([
  // ---- S1 (ECDSA) ----------------------------------------------------------
  {
    id: "c1",
    screens: ["s1"],
    kind: "standard",
    textKey: "claim.c1.text",
    refs: [
      { src: "SEC1", at: "§4.1.3 «Signing Operation»", verified: true },
      { src: "SEC1", at: "§4.1.4 «Verifying Operation»", verified: true },
      { src: "FIPS186-5", at: "§6.4.1", verified: true },
    ],
  },
  {
    id: "c2",
    screens: ["s0", "s1"],
    kind: "standard",
    textKey: "claim.c2.text",
    refs: [
      { src: "SEC2", at: "§2.4.1 «Recommended Parameters secp256k1»", verified: true },
      { src: "YP", at: "§3 «Conventions» (KEC = Keccak-256) + Annex F «Signing Transactions», p. 26 (secp256k1)", verified: true },
    ],
  },
  {
    id: "c3",
    screens: ["s0", "s1"],
    kind: "standard",
    textKey: "claim.c3.text",
    figures: { ecdsaPrivBytes: 32 },
    refs: [
      { src: "SEC1", at: "§3.2.1 «Elliptic Curve Key Pair Generation Primitive», p. 23", verified: true },
      { src: "SEC2", at: "§2.4.1", verified: true },
    ],
  },
  {
    id: "c4",
    screens: ["s0", "s1"],
    kind: "standard",
    textKey: "claim.c4.text",
    refs: [{ src: "SEC1", at: "§4.1.4", verified: true }],
  },
  {
    id: "c5",
    screens: ["s1"],
    kind: "standard",
    textKey: "claim.c5.text",
    refs: [
      { src: "RFC6979", at: "§3.2 «Generation of k»", verified: true },
      { src: "FIPS186-5", at: "§1", verified: true },
    ],
  },
  {
    // Also cited on s2 (block C's "closing the loop" comparison badge,
    // s2.blockC.ecdsaBreaks — same wording as claim.c6.text, same pattern c2/c3/c4
    // already use for their s0+s1 dual membership).
    id: "c6",
    screens: ["s1", "s2"],
    kind: "standard",
    textKey: "claim.c6.text",
    refs: [{ src: "SHOR", at: "discrete-logarithm problem, polynomial-time quantum algorithm", verified: true }],
  },
  {
    id: "c7",
    screens: ["s1"],
    kind: "derivation",
    textKey: "claim.c7.text",
    refs: [{ src: "SEC1", at: "§4.1.3 (derivation, not a direct quote)", verified: true }],
  },
  {
    id: "c8",
    screens: ["s1"],
    kind: "incident",
    textKey: "claim.c8.text",
    refs: [{ src: "PS3", at: "Console Hacking 2010: PS3 Epic Fail, 27C3 (CCC, Dec 2010)", verified: true }],
  },
  {
    id: "c9",
    screens: ["s1"],
    kind: "incident",
    textKey: "claim.c9.text",
    refs: [
      { src: "ANDROID-BLOG", at: "Some SecureRandom Thoughts (2013-08)", verified: true },
      { src: "CVE-7372", at: "CVE-2013-7372 (NVD)", verified: true },
    ],
  },
  {
    id: "c10",
    screens: ["s1"],
    kind: "standard",
    textKey: "claim.c10.text",
    figures: { ethSigBytes: 65 },
    refs: [
      { src: "EIP191", at: "version 0x45 prefix", verified: true },
      { src: "YP", at: "§3 «Conventions», p. 3 (KEC = Keccak-256) + Annex F, pp. 26–27 (ECDSASIGN -> v∈B1, r∈B32, s∈B32)", verified: true },
      { src: "SEC1", at: "§4.1.6 «Public Key Recovery Operation»", verified: true },
    ],
  },
  {
    // docs/PROVENANCE.md C-11: the expected FIPS202 §5.1 locator was WRONG (§5.1 is the
    // pad10*1 padding, which is the part SHA-3 and original Keccak SHARE, not their
    // difference — see K10.9 below, which guards against this exact regression).
    id: "c11",
    screens: ["s1"],
    kind: "standard",
    textKey: "claim.c11.text",
    refs: [
      { src: "FIPS202", at: "§6.1 «SHA-3 Hash Functions», p. 20 (suffix 01) + Annex B.2 Table 6, p. 28 (byte 0x06)", verified: true },
      { src: "KECCAK", at: "§1.1.2 «Padding rules», Definition 1, p. 7 (pad10*1; byte 0x01 is a derived byte-conversion, not in the document itself)", verified: true },
    ],
  },
  {
    id: "c12",
    screens: ["s1"],
    kind: "derivation",
    textKey: "claim.c12.text",
    refs: [
      { src: "SEC1", at: "§4.1.3 (derived property)", verified: true },
      { src: "RFC6979", at: "§3.2 (derived property)", verified: true },
    ],
  },

  // ---- S0 (intro + lens) ----------------------------------------------------
  {
    id: "c14",
    screens: ["s0"],
    kind: "standard",
    textKey: "claim.c14.text",
    refs: [
      { src: "FIPS186-5", at: "§1 «Introduction»", verified: true },
      { src: "SEC1", at: "§4.1.3 / §4.1.4", verified: true },
    ],
  },
  {
    id: "c15",
    screens: ["s0"],
    kind: "standard",
    textKey: "claim.c15.text",
    refs: [
      { src: "FIPS180-4", at: "§6.2 «SHA-256»", verified: true },
      { src: "SEC1", at: "§4.1.3 (e = Hash(M))", verified: true },
    ],
  },
  {
    id: "c16",
    screens: ["s0"],
    kind: "measurement",
    textKey: "claim.c16.text",
    refs: [
      { src: "NIST-SHA256EX", at: "«One Block Message Sample», input \"abc\"", verified: true },
      { src: "FIPS180-4", at: "§6.2 (algorithm only — the worked example itself is outside the standard, Appendix A.2)", verified: true },
    ],
  },
  {
    id: "c17",
    screens: ["s0"],
    kind: "derivation",
    textKey: "claim.c17.text",
    refs: [{ src: "SEC1", at: "§4.1.3 (output is (r, s); d is an input, never an output)", verified: true }],
  },
  {
    // docs/PROVENANCE.md C-18: the screen text asserts TWO things — an NFT is a ledger
    // entry, AND moving it is authorized by an ECDSA signature. YP only backs the
    // second half; EIP-721 backs the first (ownerOf/
    // transferFrom — the actual "ledger entry" mechanics).
    id: "c18",
    screens: ["s0"],
    kind: "standard",
    textKey: "claim.c18.text",
    refs: [
      { src: "YP", at: "Annex F «Signing Transactions», pp. 26–27 (ECDSASIGN / ECDSARECOVER, S(T))", verified: true },
      { src: "EIP721", at: "Specification, ERC721 interface (ownerOf / transferFrom)", verified: true },
    ],
  },
  {
    id: "c19",
    screens: ["s0"],
    kind: "standard",
    textKey: "claim.c19.text",
    refs: [
      { src: "ICAO9303-11", at: "§5.1 «Passive Authentication» / §5.1.1", verified: true },
      { src: "ISO32000-1", at: "§12.8 «Digital Signatures»", verified: true },
      { src: "APT-SECURE", at: "DESCRIPTION", verified: true },
    ],
  },
  {
    id: "c20",
    screens: ["s0"],
    kind: "measurement",
    textKey: "claim.c20.text",
    figures: { mldsa44SigBytes: 2420, ecdsaSigBytes: 64 },
    refs: [
      { src: "CF-PQDNS", at: "blog post, 2026-09-10 (vendor announcement, not a standard)", verified: true },
      { src: "FIPS204", at: "§4, Table 2 «Sizes (in bytes) of keys and signatures of ML-DSA» — ML-DSA-44", verified: true },
      { src: "SEC2", at: "§2.4.1 (256-bit curve order)", verified: true },
    ],
  },

  // ---- S2 (hash-based branch) ------------------------------------------------
  {
    // docs/PROVENANCE.md C-21: critic read Lamport CSL-98 in full — the bit-pair-per-bit
    // construction our anchor screen describes is NOT in it (§2 describes a 40-key /
    // 20-subset scheme instead). The real, verified first source for the bit-pair
    // construction is Diffie-Hellman 1976 §IV, which also attributes it to Lamport in
    // the same text — so the on-screen name ("Lamport") stays correct, only the
    // provenance changes. LAMPORT79 ref is KEPT (not removed) specifically to record
    // that the construction is NOT there, guarding against re-citing it wrongly later
    // (K10.9 checks this exact wording survives).
    id: "c21",
    screens: ["s2"],
    kind: "standard",
    textKey: "claim.c21.text",
    refs: [
      {
        src: "LAMPORT79",
        at: "§2 «The Algorithm», pp. 3–4 — 40 keys / 20-element subset; the bitwise construction is NOT in this report",
        verified: true,
      },
      { src: "DH76", at: "§IV «One-Way Authentication», p. 650", verified: true },
      { src: "RFC8391", at: "§3.1 «WOTS+: One-Time Signatures»", verified: true },
    ],
  },
  {
    id: "c22",
    screens: ["s2"],
    kind: "derivation",
    textKey: "claim.c22.text",
    refs: [{ src: "RFC8391", at: "§3.1 (derived property)", verified: true }],
  },
  {
    // Critic pass (2026-09-28, docs/PROVENANCE.md C-23) closed the pending §4.1
    // locator: both halves of the product statement are now quoted verbatim from RFC
    // 8391 §4.1 and §4.1.3 — both refs verified:true.
    id: "c23",
    screens: ["s2"],
    kind: "standard",
    textKey: "claim.c23.text",
    refs: [
      { src: "RFC8391", at: "§1.1 «CFRG Note on Post-Quantum Cryptography»", verified: true },
      { src: "RFC8391", at: "§4.1 «XMSS: eXtended Merkle Signature Scheme» / §4.1.3 «XMSS Private Key»", verified: true },
    ],
  },

  // ---- S2 block B/C -------------------------------------------------------
  {
    // docs/PROVENANCE.md C-24. Engineer warning honored: FORS parameters k/t/a are NOT
    // named on screen (a second number invites a third, and the
    // question-path is conceptual, not a size table) — so this record intentionally
    // carries no `figures`.
    id: "c24",
    screens: ["s2"],
    kind: "standard",
    textKey: "claim.c24.text",
    refs: [{ src: "FIPS205", at: "§8 «Forest of Random Subsets (FORS)», §§8.1–8.4", verified: true }],
  },
  {
    // docs/PROVENANCE.md C-25. Critic confirmed the mechanism locator on 2026-09-28: the
    // expected §10.2 was the WRONG section (it's the pure/pre-hash outer wrapper) —
    // the real mechanism is §3 "Overview" + §9.2 Algorithm 19 (slh_sign_internal,
    // lines 2-10). The screen uses the STRONG wording ("derived from the message
    // itself"), not the fallback softened one, per that confirmation.
    id: "c25",
    screens: ["s2"],
    kind: "standard",
    textKey: "claim.c25.text",
    refs: [
      { src: "FIPS205", at: "§1.1 «Purpose and Scope» (stateless, hash-only security)", verified: true },
      { src: "FIPS205", at: "§3 «Overview of the SLH-DSA Signature Scheme» + §9.2 Algorithm 19 slh_sign_internal, lines 2–10", verified: true },
    ],
  },
  {
    id: "c26",
    screens: ["s2"],
    kind: "standard",
    textKey: "claim.c26.text",
    refs: [{ src: "FIPS205", at: "§1.1 «Purpose and Scope»", verified: true }],
  },
  {
    // docs/PROVENANCE.md C-13. S2 block C's ending: exactly one comparison line, not a
    // table — the public-key figure is carried for completeness even
    // though the current s2.blockC.sizes wording only surfaces sig bytes + pk bytes.
    id: "c13",
    screens: ["s2"],
    kind: "standard",
    textKey: "claim.c13.text",
    figures: { slhdsaSigBytes: 7856, slhdsaPkBytes: 32 },
    refs: [
      { src: "FIPS205", at: "§11 Table 2 «SLH-DSA parameter sets» (SLH-DSA-SHA2-128s / SLH-DSA-SHAKE-128s)", verified: true },
      { src: "SEC2", at: "§2.4.1 (256-bit curve order)", verified: true },
    ],
  },
]);

// Expected number of records per screen — changes ONLY on a deliberate edit (K10.3).
// s2 grew from 4 to 8 — c13/c24/c25 (new, one screen each) plus
// c6 (now dual s1+s2). Sum by screen (10+12+8=30) exceeds the 26 distinct records
// because c2/c3/c4 (s0+s1) and c6 (s1+s2) each live on two screens — K10.3 counts it
// exactly that way (`claims.filter(c => c.screens.includes(screen))`).
export const SCREEN_COVERAGE = Object.freeze({ s0: 10, s1: 12, s2: 8 });

// Numbers that appear in product prose and are NOT cited facts — each with a reason.
// Everything else in js/i18n/*.js must come from FIGURES below (K10.4b).
export const ALLOWED_LITERALS = Object.freeze({
  4: "Lamport demo parameter N_BITS (js/schemes/params.mjs) — a demo choice, not a cited standard figure",
  16: "“first 16 hex” — hash display length, a layout property, not a cited figure",
});

// Flat map of every cited figure across all claims — the single place screens/i18n read
// cited numbers from (`figures` is the only place cited
// numbers live). A literal, not derived by a loop (K10.5 — no logic in js/data/**); kept in
// sync with the per-claim `figures` above by hand, same discipline as SCREEN_COVERAGE.
export const FIGURES = Object.freeze({
  ecdsaPrivBytes: 32, // c3
  ethSigBytes: 65, // c10
  mldsa44SigBytes: 2420, // c20
  ecdsaSigBytes: 64, // c20, c13
  slhdsaSigBytes: 7856, // c13
  slhdsaPkBytes: 32, // c13
});
