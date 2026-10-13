# PROVENANCE — provenance of the cryptographic claims

> This document is the human-readable provenance registry behind `js/data/claims.mjs`. Every factual claim shown on a screen of The Signature Explorer has an entry here (`### C-N · ...`) that ties it to a **primary source** (a standard, an original paper, or an official vendor bulletin) with an **exact locator** (section, table, page, or URL). Blogs, Wikipedia and model memory are not accepted as sources.
> The registry is enforced by gate **K10** in `tools/checks/` (`tools/checks/check.mjs` and `tools/checks/lib/claims-gate.mjs`). Sub-check K10.1 parses this file as plain text and requires its claim IDs and its source table to match `js/data/claims.mjs` exactly; further sub-checks cover locators, screen coverage, numbers, registry version, anchor uniqueness and two regression guards. Prose in this file can be reworded freely, but claim IDs, headings, the source table and the `[dev-only]` marker are parsed and must stay stable.
> Labels: **[primary]** primary source · **[primary ✓ web]** primary source checked against the document itself (URL below) · **[code ✓]** verified by running code in this repository · **[VERIFY]** the source is named but the exact section/table/page was not yet checked by eye and must be checked before release.
> Verdict: 🟢 confirmed · 🟡 imprecise as first worded (a rewording is provided) · 🔴 wrong.

---

## ⛔ TWO PERMANENT RULES

1. **Claim IDs are NEVER renumbered.** A heading `### C-13 · …` becomes `id: "c13"` in `js/data/claims.mjs` and the public anchor `…/hash.html#claim-c13`. Anchors end up in other people's syllabi and in issued citations. A new entry always gets the **next free number**, even if an earlier entry was taken off the screen. An entry taken off the screen is neither deleted nor reused for another fact — it is marked `[dev-only]`.
2. **The citation handle `anaexplores` is NEVER changed.** The author in a citation is `The Signature Explorer (anaexplores)`. The handle is permanent, like the IDs: it is already printed in other people's documents, and changing it would break issued citations. The same rule is repeated in the header of `js/data/site.mjs`.

## How to read an entry

- **Product statement (EN)** — ⭐ the text that goes **on the screen**, as the value of key `claim.<id>.text` in `js/i18n/en.js`. It is a **description of a fact**, not a bibliography: the bibliography comes separately from `refs`/`SOURCES`. Numbers inside are **placeholders** such as `{ecdsaPrivBytes}`, never literals (K10.4a).
- **Screens** — the value of `screens` in the data; it must match `RENDERED_CLAIMS` of the corresponding `js/screens/*.mjs` (K10.3).
- **kind** — `standard | derivation | incident | measurement`; it drives the UI caption ("derived from" instead of "defined in").
- **`[dev-only]`** in a heading — the entry is **outside the K10.1 parity**: it has no on-screen text of its own (a caution for engineers, or a fact whose screen has not been built yet). No data entry may reference a `[dev-only]` entry. When on-screen text appears, the marker is removed **in the same commit** that adds the data entry.

---

## Primary sources (canonical links)

| ID | Document | URL | Verification status |
|----|----------|-----|---------------------|
| SEC1 | SEC 1 v2.0 «Elliptic Curve Cryptography» (SECG, 2009) | https://www.secg.org/sec1-v2.pdf | §4.1.3 / §4.1.4 / §4.1.6 checked against the PDF [primary ✓ web]. **§3.2.1 «Elliptic Curve Key Pair Generation Primitive» (p. 23 of 138) — checked against the PDF [primary ✓ web] 2026-09-28** |
| SEC2 | SEC 2 v2.0 «Recommended Elliptic Curve Domain Parameters» (SECG, 2010) | https://www.secg.org/sec2-v2.pdf | §2.4.1 checked against the PDF [primary ✓ web] |
| FIPS186-5 | FIPS 186-5 «Digital Signature Standard (DSS)» (NIST, 2023) | https://doi.org/10.6028/NIST.FIPS.186-5 | **§1 Introduction · §6 «The Elliptic Curve Digital Signature Algorithm (ECDSA)» · §6.4.1 Signature Generation · §6.4.2 Verification — checked against the PDF [primary ✓ web] 2026-09-22** |
| RFC6979 | RFC 6979 «Deterministic Usage of DSA and ECDSA» (Pornin, 2013) | https://www.rfc-editor.org/rfc/rfc6979 | §3.2 «Generation of k» checked [primary ✓ web] |
| SHOR | Shor P.W. «Polynomial-Time Algorithms for Prime Factorization and Discrete Logarithms on a Quantum Computer», SIAM J. Comput. 26(5):1484–1509, 1997, doi:10.1137/S0097539795293172 (extended version FOCS 1994) | https://doi.org/10.1137/S0097539795293172 | citation/year/journal checked [primary ✓ web] |
| EIP191 | EIP-191 «Signed Data Standard» (Ethereum) | https://eips.ethereum.org/EIPS/eip-191 | version 0x45 format checked [primary ✓ web] |
| YP | Ethereum Yellow Paper (Wood) — Keccak-256 (KEC) and the (v,r,s) signature | https://ethereum.github.io/yellowpaper/paper.pdf | **Checked against the PDF [primary ✓ web] 2026-09-28** (revision «SHANGHAI VERSION efc5f9a — 2025-02-04»): **§3 «Conventions» (p. 3)** — `KEC` = Keccak-256; **Appendix F «Signing Transactions» (pp. 26–27)** — secp256k1, `ECDSASIGN → (v ∈ B₁, r ∈ B₃₂, s ∈ B₃₂)`, `v` = recovery identifier, `h(T)` = Keccak-256 of the transaction |
| FIPS202 | FIPS 202 «SHA-3 Standard» (NIST, 2015) | https://doi.org/10.6028/NIST.FIPS.202 | **Checked against the PDF [primary ✓ web] 2026-09-28.** ⚠️ **The expected locator §5.1 is WRONG** (see C-11): §5.1 «Specification of pad10\*1» (p. 19) is padding that SHA-3 and original Keccak SHARE, not what differs. The domain-separation suffix is in **§6.1 «SHA-3 Hash Functions» (p. 20)**, the byte form `0x06` is in **Annex B.2 «Hexadecimal Form of Padding Bits», Table 6 (pp. 27–28)**; the bit↔byte conversion is in **Annex B.1 «Conversion Functions» (p. 26)** |
| KECCAK | Keccak reference / SHA-3 submission (Bertoni, Daemen, Peeters, Van Assche) — original Keccak (padding 0x01) | https://keccak.team/files/Keccak-reference-3.0.pdf | **Checked against the PDF [primary ✓ web] 2026-09-28** (Version 3.0, 14 January 2011 — exactly the version cited by YP §3): **§1.1.2 «Padding rules», Definition 1 (p. 7)** — multi-rate padding `pad10*1`. ⚠️ **The byte `0x01` is NOT in the document** — the document is bit-oriented, and the byte form is derived (see C-11) |
| PS3 | fail0verflow «Console Hacking 2010: PS3 Epic Fail», 27C3 (CCC, Dec. 2010), bushing/marcan/segher/sven | https://fahrplan.events.ccc.de/congress/2010/Fahrplan/attachments/1780_27c3_console_hacking_2010.pdf | speakers/year/venue checked [primary ✓ web] |
| ANDROID-BLOG | Android Developers Blog «Some SecureRandom Thoughts» (Google, 2013-08) | https://android-developers.googleblog.com/2013/08/some-securerandom-thoughts.html | official vendor bulletin checked [primary ✓ web] |
| CVE-7372 | CVE-2013-7372 (NVD) — SecureRandom (Apache Harmony) in Android JCA < 4.4 | https://nvd.nist.gov/vuln/detail/CVE-2013-7372 | number and description checked [primary ✓ web] |
| FIPS205 | FIPS 205 «Stateless Hash-Based Digital Signature Standard» (NIST, 2024) | https://doi.org/10.6028/NIST.FIPS.205 | **§1.1 Purpose and Scope · §8 «Forest of Random Subsets (FORS)» · §11 Table 2 (sizes) — checked against the PDF [primary ✓ web] 2026-09-22. §3 «Overview of the SLH-DSA Signature Scheme» · §9.2 «SLH-DSA Signature Generation» (Algorithm 19 `slh_sign_internal`, lines 2–10) — checked against the PDF [primary ✓ web] 2026-09-28** |
| FIPS180-4 | FIPS 180-4 «Secure Hash Standard (SHS)» (NIST, 2015) | https://doi.org/10.6028/NIST.FIPS.180-4 | **§6.2 «SHA-256» · Appendix A.2 (examples are placed OUTSIDE the standard) — checked against the PDF [primary ✓ web] 2026-09-22** |
| NIST-SHA256EX | NIST CSRC «Example Values» — SHA256.pdf, «One Block Message Sample» (Input `"abc"`) | https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/SHA256.pdf | **digest `BA7816BF 8F01CFEA 414140DE 5DAE2223 B00361A3 96177A9C B410FF61 F20015AD` checked against the PDF [primary ✓ web] 2026-09-22** |
| FIPS204 | FIPS 204 «Module-Lattice-Based Digital Signature Standard» (ML-DSA) (NIST, 2024) | https://doi.org/10.6028/NIST.FIPS.204 | **§4 Table 2 «Sizes (in bytes) of keys and signatures of ML-DSA»: ML-DSA-44 → pk 1312, sig 2420 — checked against the PDF [primary ✓ web] 2026-09-22** |
| CF-PQDNS | Cloudflare Blog «1.1.1.1 now supports post-quantum DNSSEC, all 2,420 bytes of it» (2026-09-10) | https://blog.cloudflare.com/post-quantum-dnssec-1111/ | ⚠️ **a vendor announcement, NOT a standard.** Date/algorithm ML-DSA-44/size 2420 confirmed [primary ✓ web] as an announcement; the size itself is taken from FIPS204 |
| LAMPORT79 | Lamport L. «Constructing Digital Signatures from a One Way Function», SRI International, Technical Report **CSL-98**, October 1979 | https://lamport.azurewebsites.net/pubs/dig-sig.pdf | **PDF OPENED AND READ IN FULL [primary ✓ web] 2026-09-28** (Microsoft Research mirror, `…/uploads/prod/2016/12/Constructing-Digital-Signatures-from-a-One-Way-Function.pdf`; `lamport.azurewebsites.net` itself did not respond again — the canonical URL is kept, it works outside that network). The report is 8 pages: title + §1 Introduction + §2 The Algorithm + §3 Constructing the Function G + References; the title page reads «18 October 1979 · CSL-98». 🔴 **The bitwise «two secrets per bit» construction is NOT in the report** — see C-21 |
| DH76 | Diffie W., Hellman M. «New Directions in Cryptography», *IEEE Transactions on Information Theory* **IT-22(6)**, November 1976, pp. 644–654 | https://ee.stanford.edu/~hellman/publications/24.pdf | **Checked against the PDF [primary ✓ web] 2026-09-28 — §IV «One-Way Authentication» (heading on p. 649), the construction itself on p. 650.** Added to both the registry and the data in one step (K10.1) — the only checked primary source for the bitwise construction in C-21 |
| EIP721 | EIP-721 «Non-Fungible Token Standard» | https://eips.ethereum.org/EIPS/eip-721 | **Checked against the text of the standard [primary ✓ web] 2026-09-28** — Specification section, interface `ERC721`: `ownerOf`/`transferFrom`. Added as the second `ref` of C-18 (project decision) |
| RFC8391 | RFC 8391 «XMSS: eXtended Merkle Signature Scheme» (Huelsing, Butin, Gazdag, Rijneveld, Mohaisen; IRTF, May 2018) | https://www.rfc-editor.org/rfc/rfc8391 | **§1.1 «CFRG Note…» (stateful; «If a secret key state is used twice, no cryptographic security guarantees remain») · §3.1 «WOTS+: One-Time Signatures» — checked against the RFC text [primary ✓ web] 2026-09-22. **§4.1 «XMSS: eXtended Merkle Signature Scheme»** (tree, root as public key, `2^h` signatures, «XMSS is a stateful signature scheme…»; subsection **§4.1.3 «XMSS Private Key»** — the index `idx` in the private key) — checked against the RFC text [primary ✓ web] 2026-09-28** |
| ICAO9303-11 | ICAO Doc 9303 «Machine Readable Travel Documents», Part 11 «Security Mechanisms for MRTDs», Seventh Edition, 2015 | https://www.icao.int/sites/default/files/TRIP/Publications/Doc-9303-7th-Part11.pdf | **§5.1 «Passive Authentication» / §5.1.1 «Inspection Process» — checked against the official ICAO PDF [primary ✓ web] 2026-09-22.** ⚠️ The current edition is the 8th (2021), which is paywalled; we cite the 7th, freely published by ICAO |
| ISO32000-1 | ISO 32000-1:2008 «Document management — Portable document format — Part 1: PDF 1.7» (copy published by Adobe) | https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf | **§12.8 «Digital Signatures» — presence of the section checked against the PDF [primary ✓ web] 2026-09-22.** ⚠️ The current edition is ISO 32000-2 (PDF 2.0), paywalled; we cite the one that was checked |
| APT-SECURE | Debian `apt-secure(8)` manual page (the project's official documentation) | https://manpages.debian.org/bookworm/apt/apt-secure.8.en.html | **DESCRIPTION: «Starting with version 0.6, APT contains code that does signature checking of the Release file for all repositories» — checked [primary ✓ web] 2026-09-22** |

### ✅ Sources DH76 / EIP721 — added 2026-09-28

The provenance review deliberately did **not** add these rows to the table in a one-sided edit: K10.1 compares the set of table IDs with `SOURCES` from `js/data/claims.mjs` by strict equality, and a one-sided edit of this document would break the gate immediately. Both rows are now in the pipe table above **and** in `SOURCES`, added in a single step. `c21` received a second `ref` on `DH76` (`verified:true`); `c18` received a second `ref` on `EIP721` (project decision).

- **`DH76`** — Diffie W., Hellman M. «New Directions in Cryptography», *IEEE Transactions on Information Theory* **IT-22(6)**, November 1976, pp. 644–654. URL: `https://ee.stanford.edu/~hellman/publications/24.pdf`.
  **Status:** checked by eye against the PDF [primary ✓ web] 2026-09-28 — **§IV «One-Way Authentication» (heading on p. 649), the construction itself on p. 650**. 🔴 **Mandatory:** this is the only checked primary source for the bitwise construction in C-21 (see C-21).
- **`EIP721`** *(optional, project decision)* — EIP-721 «Non-Fungible Token Standard». URL: `https://eips.ethereum.org/EIPS/eip-721`.
  **Status:** checked against the text of the standard [primary ✓ web] 2026-09-28 — the **Specification** section, interface `ERC721`: `ownerOf(uint256 _tokenId) external view returns (address)` («Find the owner of an NFT … The address of the owner of the NFT») and `transferFrom` («Transfers the ownership of an NFT from one address to another address»); Abstract — «a standard API for NFTs within smart contracts. This standard provides basic functionality to track and transfer NFTs». Does not block K10.7 (see C-18).

> **Market-intelligence correction (keep in mind for the S2 hash-branch screen):** NIST's third-round candidates number **8, not 9** (HAWK was withdrawn 2026-07-28). The product currently **does not contain** this number (grep over `js/**` and `*.html` — zero hits); if a screen introduces it, it must be added as a registry entry, not as a dictionary string.

---

## Registry of claims, screen S1 (ECDSA screen)

### C-1 · An ECDSA signature is a pair of numbers (r, s)

- **Product statement (EN):** *"An ECDSA signature is a pair of numbers `(r, s)`, computed from the message hash, the private key, and a per-signature nonce `k`."*
- **Screens:** `s1` · **kind:** `standard`
- **On-screen context:** `s1.sig.rLabel` / `s1.sig.sLabel` / `s1.verify.ok`.
- **Primary source:** SEC1 **§4.1.3 «Signing Operation»** — `r = x-coord(k·G) mod n`, `s = k⁻¹(e + r·d) mod n`, the output is the pair `(r, s)`; verification — SEC1 **§4.1.4 «Verifying Operation»**. [primary ✓ web] Duplicated in FIPS186-5 **§6.4.1** [primary ✓ web].
- **Verdict:** 🟢

### C-2 · secp256k1 — the same curve as in MetaMask/Ethereum

- **Product statement (EN):** *"MetaMask signs with ECDSA on secp256k1 — the very same curve this page uses."*
- **Screens:** `s0`, `s1` · **kind:** `standard`
- **On-screen context:** `s0.metamask.anchor`, `s1.metamask.anchor`, `s1.metamask.curve`.
- **Primary source:** curve parameters — SEC2 **§2.4.1 «Recommended Parameters secp256k1»** (p, a=0, b=7, G, n, h=1) [primary ✓ web]. That Ethereum uses secp256k1 specifically — YP **Appendix F «Signing Transactions» (p. 26)**, first sentence: «Transactions are signed using recoverable ECDSA signatures. This method utilises the SECP-256k1 curve as described by Courtois et al. [2014]». [primary ✓ web, checked against the PDF 2026-09-28 — **[VERIFY] #2 closed, the expected Appendix F was confirmed**]
- **Verdict:** 🟢 (for "the same curve"; the claim "the same math" is deliberately NOT used — see C-10/C-11). Locator checked → `verified:true`.

### C-3 · Key pair: `d` is private, `Q = d·G` is public; "easy this way, impossible back"

- **Product statement (EN):** *"An ECDSA private key is a {ecdsaPrivBytes}-byte number `d`; the public key is the curve point `Q = d·G`. Computing `Q` from `d` takes microseconds; recovering `d` from `Q` is the discrete-logarithm problem, and no classical algorithm is known that does it."*
- **Screens:** `s0`, `s1` · **kind:** `standard` · **figures:** `ecdsaPrivBytes: 32`
- **On-screen context:** `s1.gen.privLabel`, `s1.gen.pubLabel`, `s1.gen.note`, `s0.showKey.label`. ⚠️ At the time of the review both labels contained the **bare literal `32`** — they were migrated to `{ecdsaPrivBytes}` (K10.4a).
- **Primary source:** key generation — SEC1 **§3.2.1 «Elliptic Curve Key Pair Generation Primitive»** (p. 23 of 138), verbatim: «*1. Randomly or pseudorandomly select an integer `d` in the interval `[1, n − 1]`. 2. Compute `Q = dG`. 3. Output `(d, Q)`*». [primary ✓ web, checked against the PDF 2026-09-28 — **[VERIFY] #5 closed, the section number was confirmed**] The size of `d` = 32 bytes follows from the order `n` (256 bits) — SEC2 **§2.4.1** [primary ✓ web]. "Impossible back" = ECDLP; the quantitative quantum argument is C-6.
- **Verdict:** 🟢 — locator checked, `verified:true`.

### C-4 · The signature is bound to the message: edit the message → verify ✗

- **Product statement (EN):** *"Verification recomputes the hash of the message it is given, so flipping a single character makes the same signature fail."*
- **Screens:** `s0`, `s1` · **kind:** `standard`
- **On-screen context:** `s0.tamper.hint`, `s0.verify.fail`, `s1.verify.fail`.
- **Primary source:** SEC1 **§4.1.4** — verify recomputes `e = Hash(M)` and checks `r ≡ x-coord(u₁G + u₂Q) mod n`; changing `M` changes `e` → the equality breaks. [primary ✓ web]
- **Verdict:** 🟢

### C-5 · The library derives `k` deterministically (RFC 6979)

- **Product statement (EN):** *"Production libraries do not draw the nonce `k` at random: RFC 6979 derives it deterministically from the private key and the message hash, so the same `k` cannot reappear by accident."*
- **Screens:** `s1` · **kind:** `standard`
- **On-screen context:** `s1.nonce.intro`, `s1.nonce.manualK`.
- **Primary source:** RFC6979 **§3.2 «Generation of k»** — `k` is derived by an HMAC construction from the private key and the message hash. [primary ✓ web] Deterministic ECDSA as an approved variant — FIPS186-5 **§1** (reference to RFC 6979) [primary ✓ web].
- **Verdict:** 🟢

### C-6 · A quantum computer (Shor) derives `d` from `Q` — "breaks the secret, not the signature"

- **Product statement (EN):** *"A quantum computer running Shor's algorithm solves the discrete-logarithm problem in polynomial time — the exact problem ECDSA's security rests on — so it recovers `d` from `Q`. The signature itself still verifies; what breaks is the secret behind it."*
- **Screens:** `s1, s2` · **kind:** `standard`
- **On-screen context:** `s1.quantum.note`, `s1.quantum.verdict`, `s1.quantum.stillVerified`, `s1.lens.a3`. The wording of `s1.quantum.note` in `en.js` already carries the safe version [code ✓]. **Added with the S2 hash-branch screen:** `s2.blockC.ecdsaBreaks` — the same Product statement verbatim, the ECDSA half of the comparison panel in S2 block C (closing the thread "quantum breaks clever math, but not hashes" next to C-26 on the same panel).
- **Primary source:** SHOR (1997) — a polynomial-time quantum algorithm for the **discrete logarithm** and for factoring. [primary ✓ web]
- **Verdict:** 🟡 → **closed by the wording above.** Subtlety: Shor 1997 treats the discrete logarithm in the multiplicative group `(Z/pZ)*` / finite fields; **the paper has no direct treatment of ECDLP** — that is the standard generalization. Canonical primary sources on the quantum cost of ECDLP: **Proos & Zalka 2003 (arXiv:quant-ph/0301141)**, Roetteler et al. 2017.
  - **Footer rule:** if the UI stresses specifically **ECDLP on a curve**, add Proos–Zalka 2003 as a second `ref`. Do **not** attribute the ECDLP treatment to Shor's paper. The current wording says "discrete-log problem" and is therefore correct as is.

### C-7 · Nonce reuse → recovery of the private key `d`

- **Product statement (EN):** *"Two signatures made with the same nonce `k` share the same `r`. From that pair alone — no private key needed — anyone can solve for `k`, and then for `d`."*
- **Screens:** `s1` · **kind:** `derivation`
- **On-screen context:** `s1.nonce.toggle`, `s1.nonce.recoveredLabel`, `s1.nonce.matchVerdict`.
- **Primary source:** a **corollary** derived from SEC1 **§4.1.3** (not a quotation — the UI captions it "derived from"):
  - `s₁ = k⁻¹(z₁ + r·d) mod n`, `s₂ = k⁻¹(z₂ + r·d) mod n` (same `k`, same `r`);
  - `s₁ − s₂ = k⁻¹(z₁ − z₂) ⇒ k = (z₁ − z₂)·(s₁ − s₂)⁻¹ mod n`;
  - `d = (s₁·k − z₁)·r⁻¹ mod n`;
  - (`z` = the truncated message hash, SEC1 §4.1.3, step `e→z`.)
- **Verdict:** 🟢 — strict, and it matches the implementation `recoverFromNonceReuse` (K1: the recovered `d` == the real `d`) [code ✓].
  - **Implementation footnote (not user-facing):** low-`s` normalization (`s > n/2 → s = n − s`) is a non-malleability requirement; it is not a "MUST" in SEC1, but it is in Ethereum/Bitcoin (BIP-62 / EIP-2). The sign of `s` plays no role in recovering `d`.

### C-8 · Incident: Sony PS3 — constant nonce → platform key recovered

- **Product statement (EN):** *"Sony's PS3 signing code used the same constant nonce for every signature. In 2010 that let researchers recover the console's ECDSA private key from published signatures."*
- **Screens:** `s1` · **kind:** `incident`
- **On-screen context:** `s1.nonce.intro`, `s1.nonce.manualK`.
- **Primary source:** PS3 — the talk **fail0verflow «Console Hacking 2010: PS3 Epic Fail», 27C3 (CCC, December 2010)**, authors bushing, marcan, segher, sven. [primary ✓ web]
- **Verdict:** 🟢 — conference materials, not a blog retelling (condition N4/K3). Precision: `k` was a **constant**, not "accidentally repeated" — the wording reflects this.

### C-9 · Incident: Android SecureRandom 2013 → predictable nonce

- **Product statement (EN):** *"Android's SecureRandom bug (2013, CVE-2013-7372) made ECDSA nonces predictable, and Bitcoin keys were drained from wallets that relied on it."*
- **Screens:** `s1` · **kind:** `incident`
- **On-screen context:** `s1.lens.a2` ("weak randomness"), the provenance block of S1.
- **Primary source:** ANDROID-BLOG «Some SecureRandom Thoughts» (Google, 2013-08) — an official vendor bulletin [primary ✓ web]; identifier — **CVE-2013-7372** (NVD): `engineNextBytes` in `SecureRandom` (Apache Harmony ≤ 6.0M3) applies a wrong offset when no seed is set → a predictable PRNG [primary ✓ web].
- **Verdict:** 🟢 — the CVE number is confirmed, not invented.
  - **Subtlety (do not mix up):** the "2013 incident" is covered by **two** CVEs. **CVE-2013-7372** is the offset bug in `SecureRandom`; **CVE-2013-7373** concerns applications calling the system OpenSSL PRNG without initialization. The line "SecureRandom → predictable `k`" is **7372**. Do not put both numbers in one sentence without distinguishing them.

### C-10 · How our demo differs from MetaMask: Keccak-256, EIP-191, recovery id `v`

- **Product statement (EN):** *"MetaMask's `personal_sign` (EIP-191) hashes a prefixed message with Keccak-256 and returns {ethSigBytes} bytes — `(r, s)` plus a recovery id `v`. This page hashes with SHA-256 and shows plain `(r, s)`: same curve, same failure modes, fewer moving parts."*
- **Screens:** `s1` · **kind:** `standard` · **figures:** `ethSigBytes: 65`
- **On-screen context:** `s1.metamask.diff`. ⚠️ At the time of the review this string contained the **bare literal `65`** — it was migrated to `{ethSigBytes}` (K10.4a). This was the **third** literal to migrate, besides the two `32`s from C-3.
- **Primary sources, by part:**
  1. **EIP-191 prefix** — EIP191: version `0x45` = `0x19 ‖ 0x45 ("E") ‖ "thereum Signed Message:\n" + len(message) ‖ message`. [primary ✓ web]
  2. **Ethereum hashes with Keccak-256 (not SHA-256)** — YP **§3 «Conventions» (p. 3)**, verbatim: «*the Keccak-256 hash function (as per version 3 of the winning entry to the SHA-3 contest by Bertoni et al. [2011], **rather than the final SHA-3 specification**), is denoted `KEC` (and generally referred to as plain Keccak)*». [primary ✓ web, checked against the PDF 2026-09-28] That Keccak-256 is what is hashed when signing — YP **App. F (p. 27)**: «*The message hash, `h(T)`, to be signed is the Keccak-256 hash of the transaction*».
  3. **65 bytes = (r, s, v)** — YP **App. F «Signing Transactions» (p. 26)**, formula (310): `ECDSASIGN(e ∈ B₃₂, pr ∈ B₃₂) ≡ (v ∈ B₁, r ∈ B₃₂, s ∈ B₃₂)`, and in prose: «*It is assumed that `v` is the ‘recovery identifier’. The recovery identifier is a 1 byte value…*». [primary ✓ web, checked against the PDF 2026-09-28 — **[VERIFY] #2 closed**] The recovery math — SEC1 **§4.1.6 «Public Key Recovery Operation»** [primary ✓ web].
     - ⚠️ **Precision boundary (do not drift):** the string "65 bytes" is not in YP — App. F gives the types `B₁ + B₃₂ + B₃₂`, and 65 is their sum. This is **arithmetic over a checked locator**, not a quotation. In the UI the entry stays `kind: standard` (the format itself is defined by the standard), but in discussion and in the footer "65" must not be presented as a number quoted from YP.
- **Verdict:** 🟢 on the composition of the claim — **provided C-11 is strictly observed.** Locator checked → `verified:true`.

### C-11 · ⚠️ Ethereum's Keccak-256 ≠ final SHA-3 (FIPS 202)

> ⚠️ **STATUS CHANGE against the original design (a finding of the provenance review, checked in code).** The original design named C-11 as the canonical example of a `[dev-only]` entry — "a caution without on-screen text of its own". **That is no longer true:** the safe rewording has already landed as the key `s1.metamask.keccakNote` and **is actually rendered** on S1 (`js/screens/ecdsa.mjs:101`) [code ✓ 2026-09-22]. C-11 is therefore a **full product entry**, the `[dev-only]` marker is **NOT** put on it, and it takes part in the K10.1 parity and in `RENDERED_CLAIMS` of screen `s1`. This is exactly the case the design describes as "if C-11 later gets its own on-screen wording, the marker is removed and a data entry is added in the same commit".

- **Product statement (EN):** *"Ethereum uses Keccak-256 — the original Keccak submission — which differs from NIST's finalized SHA-3 (FIPS 202) by one padding byte. For the same input the two produce different digests."*
- **Screens:** `s1` · **kind:** `standard`
- **On-screen context:** `s1.metamask.keccakNote` [code ✓ rendered].
- **Fact (checked 2026-09-28 against both PDFs, [primary ✓ web]):** FIPS202 (SHA3-256) appends the **domain-separation suffix `01`** before the multi-rate padding; **original Keccak** (which Ethereum uses) appends no suffix. For one input, `Keccak-256(x) ≠ SHA3-256(x)`. **[VERIFY] #3 and #4 closed — but the expected locator FIPS 202 §5.1 turned out to be WRONG.**
  - **What is actually where (recorded so nobody "restores the old state"):**
    1. ⚠️ **FIPS 202 §5.1 «Specification of pad10\*1» (p. 19) — NOT the difference, but the common part.** It is Algorithm 9, `pad10*1(x, m) → P = 1 ‖ 0ʲ ‖ 1` — **the same** multi-rate padding as in original Keccak. Citing §5.1 as "how SHA-3 differs from Keccak" would be plausible and wrong: by §5.1 they coincide.
    2. ✅ **The difference — FIPS 202 §6.1 «SHA-3 Hash Functions» (p. 20)**, normatively: «*`SHA3-256(M) = KECCAK[512] (M ‖ 01, 256)` … the resulting input `N` to `KECCAK[c]` is the message with the suffix appended, i.e, `N = M ‖ 01`. The suffix supports domain separation*». The suffix `01` is **two bits**, and exactly it makes SHA3-256 ≠ Keccak-256.
    3. ✅ **The byte `0x06` — Annex B.2 «Hexadecimal Form of Padding Bits» (p. 27), Table 6 (p. 28)**: for hash functions `M ‖ 0x06 ‖ 0x00 … ‖ 0x80` (when `q > 2`), `M ‖ 0x0680` (when `q = 2`), `M ‖ 0x86` (when `q = 1`). That is, **`0x06` is the byte form of `01` plus the start of `pad10*1`**, not a separate entity of the standard.
    4. ⚠️ **KECCAK reference — the byte `0x01` is NOT in the document.** Checked: **§1.1.2 «Padding rules», Definition 1 (p. 7)** defines `pad10*1` purely bitwise; neither `0x01` nor any byte suffix occurs in the text (grep over the whole extracted text — zero occurrences of `0x01`/`0x06`). **`0x01` is a derivation**: with no suffix on byte-aligned input, the first appended bit `1` under Keccak's LSB-first convention yields the byte `0x01`, by exactly the same conversion that FIPS 202 **Annex B.1 «Conversion Functions» (p. 26)** applies to obtain `0x06`. Annex B.1 itself confirms the compatibility of the conventions: «*The formal bit-reordering function that was specified in [12] — for the KECCAK submission to the SHA-3 competition — gives equivalent conversions when the message is byte-aligned*».
    5. ✅ **The chain "YP → exactly this Keccak" closes:** YP §3 refers to «*version 3 of the winning entry to the SHA-3 contest by Bertoni et al. [2011]*» — the PDF we checked is «The KECCAK reference, **Version 3.0, January 14, 2011**». The version matches exactly.
- **Verdict:** 🟡 → **closed by the wording above** (it is already on the screen verbatim). Both locators checked → `verified:true` on both `ref`s.
  - 🚫 **What must NOT be written on the screen after this check:** "Keccak-256 and SHA3-256 differ in the padding rule". The padding rule (`pad10*1`) is **the same** for both; what differs is the **domain-separation suffix in front of it**. The current on-screen wording says "differs … by one padding byte" — this is correct at the byte level (`0x01` versus `0x06`) and **must be kept as is**; on any edit, do not rewrite it into "different padding rule".
  - **Hard prohibition for implementers:** it is **FORBIDDEN** to set FIPS202 as the primary source **for Ethereum's hash**. The provenance for "Ethereum uses Keccak-256" is YP + the KECCAK reference. FIPS202 is used **only** as a contrast — "what this hash is NOT". In the data these are two distinct `ref`s of one entry, and the UI caption must not read as "Keccak-256 is defined in FIPS 202".

### C-12 · S1 lens: the signature "reveals nothing about `d` … until a nonce repeats"

- **Product statement (EN):** *"A correctly made ECDSA signature reveals nothing about the private key — the one exception is a repeated nonce, which gives it away completely."*
- **Screens:** `s1` · **kind:** `derivation`
- **On-screen context:** `s1.lens.a1`, `s1.lens.a2`, `s1.lens.a3`.
- **Primary source:** the property of ECDSA with a correct/deterministic `k` — a corollary of SEC1 **§4.1.3** + RFC6979 **§3.2**; the exceptions are C-6 (Shor), C-7 (reuse), C-9 (weak RNG). [primary ✓ web for the components]
- **Verdict:** 🟢 — the qualifier "until a nonce repeats" makes the claim precise.

### C-13 · Size comparison: SLH-DSA-128s versus ECDSA

> Added to the data with the S2 hash-branch screen (`js/data/claims.mjs`, `[dev-only]` removed in the same commit). The line lives in **S2 block C**, as exactly one comparison line (decision O3) — not a table.

- **Product statement (EN):** *"An SLH-DSA-128s signature is {slhdsaSigBytes} bytes against {ecdsaSigBytes} for ECDSA on secp256k1 — that is the price of needing nothing but a hash function. The public key stays small: {slhdsaPkBytes} bytes."*
- **Screens:** `s2` · **kind:** `standard` · **figures:** `slhdsaSigBytes: 7856`, `slhdsaPkBytes: 32`, `ecdsaSigBytes: 64`
- **Primary sources:**
  1. **SLH-DSA-128s = 7 856 bytes** (signature), **pk = 32 bytes** — FIPS205 **§11, Table 2 «SLH-DSA parameter sets»**, rows `SLH-DSA-SHA2-128s` / `SLH-DSA-SHAKE-128s`. [primary ✓ web against the PDF, re-confirmed 2026-09-22]
  2. **ECDSA secp256k1:** `d` = **32 bytes** and signature `(r, s)` = **64 bytes** — a corollary of the 256-bit order `n`, SEC2 **§2.4.1** [primary ✓ web]; **65 bytes** in Ethereum = `(r, s, v)` — YP **App. F (p. 26)**, see C-10 [primary ✓ web 2026-09-28].
- **Verdict:** 🟢 on the numbers.
  - ℹ️ **Data cross-check 2026-09-28:** in `js/data/claims.mjs`, C-13 has **no `ref` on YP** (only FIPS205 §11 Table 2 + SEC2 §2.4.1, both `verified:true`). The YP mention above is registry context, not a locator of the entry. Consequently **YP touches three data entries (C-2, C-10, C-18), not four** — the wording "touches C-2, C-10, C-13, C-18 at once" in an earlier summary was inaccurate for C-13; corrected here.
  - **Subtlety — CLOSED BY A STATEMENT OF FACT, not by a check ([VERIFY] #6):** the **SLH-DSA-128s private key = 64 bytes** (`SK = SK.seed ‖ SK.prf ‖ PK.seed ‖ PK.root`, each `n=16` ⇒ `4n=64`) — this value is **not in Table 2**; it would be derived from FIPS205 §9.1 / the key format. **Checked in code 2026-09-28: the screen does NOT show this number** — `figures` of C-13 = `{ slhdsaSigBytes: 7856, slhdsaPkBytes: 32 }`, the keys `claim.c13.text` / `s2.blockC.*` in `js/i18n/en.js` say nothing about the SLH-DSA private key, and a grep over `js/**` for the SLH-DSA private key gives zero. So **checking §9.2/§9.1 is not required and no locator is created**: a nonexistent `ref` has nothing to verify, and there is no `verified:false` for this item in the data. The note is closed by the **statement "does not reach the screen"**; K10.7 is unaffected.
    - 🚩 **Condition for reopening:** if the screen ever shows the SLH-DSA private key, that requires a **separate by-eye check of FIPS 205 §9.1** and a separate `ref`, **not** Table 2. An implementer does not add such an entry on their own.
  - **Constraint O3:** exactly **one** comparison line, not a table. The third number (ML-DSA-44, C-20) is **not placed** on S2 — only on S0.

---

## Registry of claims, screen S0 (intro + lens)

### C-14 · What a signature is: proving possession of a secret without revealing it

- **Product statement (EN):** *"A digital signature proves that whoever produced it holds a particular private key — and it proves this without ever transmitting that key."*
- **Screens:** `s0` · **kind:** `standard`
- **On-screen context:** `s0.title`, `s0.subtitle` ("Prove you hold the secret — without showing it.").
- **Primary source:** FIPS186-5 **§1 «Introduction»** — «This standard defines methods for digital signature generation that can be used for the protection of binary data (commonly called a message) and for the verification and validation of those digital signatures» [primary ✓ web, checked against the PDF 2026-09-22]. The concrete mechanism for the scheme shown on the screen — SEC1 **§4.1.3 / §4.1.4** [primary ✓ web].
- **Verdict:** 🟢 — "without showing it" is correct: the signature is a function of `d`, but `d` is not part of the output (see C-17).

### C-15 · The message fingerprint on S0 is a real SHA-256

- **Product statement (EN):** *"The fingerprint under the message box is a real SHA-256 digest, computed in your browser: the signature is made over this digest, not over the text itself."*
- **Screens:** `s0` · **kind:** `standard`
- **On-screen context:** `s0.hash.label` ("SHA-256 (first 16 hex):"), `s0.msg.label`.
- **Primary source:** FIPS180-4 **§6.2 «SHA-256»** — the algorithm specification. [primary ✓ web, checked against the PDF 2026-09-22] That it is the hash that gets signed — SEC1 **§4.1.3** (step `e = Hash(M)`) [primary ✓ web].
- **Verdict:** 🟢 — "first 16 hex" is a layout property, not a fact (the literal `16` goes to `ALLOWED_LITERALS`).

### C-16 · Build check: `sha256("abc")` matches the NIST reference vector

- **Product statement (EN):** *"The line below recomputes SHA-256 of the string `abc` every time this page loads and compares it with NIST's published example value — if the build were broken, it would say so."*
- **Screens:** `s0` · **kind:** `measurement`
- **On-screen context:** `build.integrityLabel`, `build.integrityMatch`, `build.integrityMismatch`; the constant `EXPECTED_SHA256_ABC` in `js/screens/intro.mjs:26` [code ✓].
- **Primary source:** ⚠️ **a correction to the original design.** The original design attributed the vector as "[primary: FIPS 180-4]" — **this is imprecise**: FIPS180-4 **Appendix A.2** states explicitly that the examples are placed **outside the standard**, on the CSRC examples page. The canonical primary source of the vector is **NIST-SHA256EX, «One Block Message Sample», Input `"abc"` → `BA7816BF 8F01CFEA 414140DE 5DAE2223 B00361A3 96177A9C B410FF61 F20015AD`** [primary ✓ web, digest checked against the PDF 2026-09-22 and matches `EXPECTED_SHA256_ABC` character for character]. FIPS180-4 §6.2 remains the primary source **for the algorithm**, not for the vector.
- **Verdict:** 🟢 on the vector itself · 🟡 on the original attribution — **corrected here**; the implementation sets two `ref`s: NIST-SHA256EX (the vector) + FIPS180-4 §6.2 (the algorithm).

### C-17 · A signature does not reveal the private key ("…which is exactly what never happens for real")

- **Product statement (EN):** *"Signing never puts the private key on the wire: the key stays where it was made, and only `(r, s)` travels. Revealing it here is a demo convenience, not something a real signer ever does."*
- **Screens:** `s0` · **kind:** `derivation`
- **On-screen context:** `s0.showKey.button`, `s0.showKey.label`, `s0.showKey.note`.
- **Primary source:** a corollary of SEC1 **§4.1.3** — the output of the signing operation is `(r, s)`; `d` is an input, not an output. Recovery in reverse is possible only through the listed failures (C-6, C-7, C-9). [primary ✓ web] The limitation is stated in C-12.
- **Verdict:** 🟢 as a derivation (in the UI — "derived from", not "defined in").

### C-18 · "Quantum doesn't just take your ETH — an NFT is a record guarded by the same signature"

- **Product statement (EN):** *"An NFT is not a file you hold — it is a ledger entry, and the only thing that authorizes moving it is an ECDSA signature on the very same curve. Whatever breaks the signature breaks the ownership."*
- **Screens:** `s0` · **kind:** `standard`
- **On-screen context:** `s0.landing.nft`.
- **Primary source:** transferring an NFT is an ordinary Ethereum transaction authorized by an ECDSA/secp256k1 signature: YP **Appendix F «Signing Transactions» (pp. 26–27)** — `ECDSASIGN → (v, r, s)`, `S(T)` (the sender function) via `ECDSARECOVER`, the secp256k1 curve. [primary ✓ web, checked against the PDF 2026-09-28 — **[VERIFY] #2 closed**]
- **[VERIFY] #8 (EIP-721) — closed by a STATEMENT OF FACT + a precautionary check, 2026-09-28:**
  - **Statement (the main point):** **EIP-721 is NOT quoted on the screen.** Checked in code: at the time of the review, C-18 in `js/data/claims.mjs` had exactly one `ref` — on YP; the source `EIP721` was **absent** from `SOURCES`; a grep over `js/**` and `*.html` for `721` gave **zero hits**. The EIP-721 mention in this entry was registry context, not a data locator. So K10.7 was not blocked by this item **under any decision**.
  - **The check was nevertheless performed (so that the implementation had a choice with a ready locator):** EIP-721, **Specification** section, interface `ERC721` — `ownerOf(uint256 _tokenId) external view returns (address)` («*Find the owner of an NFT … The address of the owner of the NFT*») and `transferFrom` («*Transfers the ownership of an NFT from one address to another address … Throws unless `msg.sender` is the current owner, an authorized operator, or the approved address for this NFT*»); **Abstract** — «*a standard API for NFTs within smart contracts. This standard provides basic functionality to track and transfer NFTs*». [primary ✓ web, read from the text of the standard 2026-09-28]
  - **Reviewer's recommendation (not mandatory):** the on-screen line asserts **two** things — "an NFT is a ledger entry" and "moving it is authorized by an ECDSA signature". YP App. F supports the **second**; it does not support the first at all. It is more honest to add `EIP721` as a second `ref` with the locator "Specification, `ERC721`: `ownerOf` / `transferFrom`" and `verified:true` (the source row goes **both into the table of this document and into `SOURCES`, in one commit** — see the block on sources added 2026-09-28). This was subsequently adopted: C-18 now carries the second `ref` on `EIP721`.
- **Verdict:** 🟡 → **closed by the wording above** (it removes the ambiguity "NFT = a picture"). The YP locator is checked → `verified:true`; no `verified:false` remains in the entry.

### C-19 · "The same machinery signs your passport chip, your PDFs, and every OS update you install"

> 🔎 **Decision of the provenance review on the tracked blocker for this line: the line STAYS on the screen, but is reworded.** All three examples were raised to primary sources (two from official PDFs, the third from the project's official documentation). The line does not need to be removed. However, the wording **"the same machinery"** is false when read literally: passports, PDFs and OS updates use different algorithms (RSA, ECDSA, EdDSA, OpenPGP) and different container formats. What they share is a **construction**, not "the same machinery". Hence 🟡 and the mandatory replacement of the wording.

- **Product statement (EN):** *"The same construction — sign with a private key, verify against a published public key — is what authenticates the chip in your passport, a signed PDF, and the operating-system updates your machine installs."*
- **Screens:** `s0` · **kind:** `standard`
- **On-screen context:** `s0.landing.everyday`. ⚠️ At the time of the review the current value of the key was to be replaced with the wording above — this is not cosmetic, it closes the tracked blocker.
- **Primary sources, by part (all three checked 2026-09-22):**
  1. **Passport** — ICAO9303-11 **§5.1 «Passive Authentication» / §5.1.1**: the inspection system reads the Document Security Object (SOD), builds a certification path to the Document Signer Certificate and **verifies the SOD signature** with the Document Signer's public key; data-group hashes are compared with the SOD. [primary ✓ web against the official ICAO PDF]
  2. **PDF** — ISO32000-1 **§12.8 «Digital Signatures»** (a copy of the standard published by Adobe). [primary ✓ web — presence and number of the section checked against the PDF; ⚠️ the current edition ISO 32000-2 is paywalled, we cite the checked one]
  3. **OS updates** — APT-SECURE, section **DESCRIPTION**: «Starting with version 0.6, APT contains code that does signature checking of the Release file for all repositories». [primary ✓ web] This is **one concrete, verifiable example** ("OS updates" in general is a class, not a document). The wording "the operating-system updates your machine installs" stays true on this example; extending it to "every OS" without a second source is **not allowed**.
- **Verdict:** 🟡 → **closed by the rewording above.** Without replacing the line — 🔴 on the word "machinery" (literally false, different algorithms).
  - **Alternative, if more concreteness is wanted (NOT mandatory):** add a second `ref` on Microsoft Authenticode or Android Verified Boot. Neither of them was checked against a primary source in this review — adding one without a check is forbidden.

### C-20 · Post-quantum signatures are already in production: 1.1.1.1 validates ML-DSA-44

- **Product statement (EN):** *"This is not a future problem: since September 2026 Cloudflare's 1.1.1.1 resolver validates post-quantum DNSSEC signatures made with ML-DSA-44 — {mldsa44SigBytes} bytes each, against {ecdsaSigBytes} for the ECDSA signatures DNSSEC uses today."*
- **Screens:** `s0` · **kind:** `measurement` · **figures:** `mldsa44SigBytes: 2420`, `ecdsaSigBytes: 64`
- **On-screen context:** the new key `s0.landing.pqLive`, next to `s0.landing.nft` / `s0.landing.everyday`. **One line, with no elaboration** (same rule as O2). **Not placed on S2** — a third number next to the SLH-DSA vs ECDSA comparison breaks O3.
- **Primary sources (it matters to tell the two apart):**
  1. **The event** (what was switched on and when) — CF-PQDNS, Cloudflare Blog, 2026-09-10: 1.1.1.1 validates post-quantum DNSSEC on ML-DSA-44. ⚠️ **A vendor announcement, NOT a standard.** The UI captions it exactly so (`kind: measurement` → "announced by", not "defined in"). [primary ✓ web as a vendor announcement]
  2. **The scheme and size** — FIPS204 **§4, Table 2 «Sizes (in bytes) of keys and signatures of ML-DSA»**: ML-DSA-44 → **signature 2420 bytes**, pk 1312 bytes. [primary ✓ web, checked against the PDF 2026-09-22]
  3. **64 bytes of ECDSA** — a corollary of the 256-bit curve order, SEC2 §2.4.1 [primary ✓ web]. Cloudflare compares with ECDSA **P-256**, whose signature size is the same, 64 bytes; on the screen the figure is correct for both curves, but **do not present it as "P-256" and "secp256k1" at the same time** — say just "ECDSA".
- **Verdict:** 🟢 on the numbers and on the fact of the event.
  - **Hard prohibition for implementers:** do not set the Cloudflare blog as the primary source **for ML-DSA** — the primary source for the scheme and size is FIPS 204. The blog is the primary source **only** for the fact of deployment.

---

## Registry of claims, screen S2 (hash branch)

### C-21 · Lamport mechanics: two secrets per bit, the public key is their hashes, a signature reveals one half

- **Product statement (EN):** *"A Lamport key pair holds two random secrets for every bit of the message; the public key is just their hashes. Signing reveals exactly one secret per bit — the one the message's bit selects — and verifying means hashing what was revealed and matching it against the public key."*
- **Screens:** `s2` · **kind:** `standard`
- **On-screen context:** `s2.gen.state.before`, `s2.gen.state.after`, `s2.msg.label`, `s2.grid.*`, `s2.legend.*`, `s2.cell.*`. Implementation — `js/schemes/lamport.mjs`, covered by the smoke test (K1) [code ✓].
> 🔴 **MAIN FINDING OF THE 2026-09-28 CHECK. The Lamport CSL-98 report PDF was finally opened and read in full — and the bitwise "two secrets per bit" construction is NOT in it.** The earlier pass honestly did not invent a page number; the reason that number could not be found is now known: no such page exists. A LAMPORT79 locator for the on-screen claim C-21 is **impossible in principle**, and any attempt to set one would be a false citation on the product's anchor screen. Below is what the report actually contains and how the provenance is closed.

- **What is ACTUALLY in LAMPORT79 (checked against the PDF, [primary ✓ web] 2026-09-28).** The report is **8 pages**: title (« 18 October 1979 · CSL-98 »), **§1 Introduction**, **§2 The Algorithm**, **§3 Constructing the Function G**, References (Diffie–Hellman 1976; Rabin 1978). The scheme in **§2 «The Algorithm» (pp. 3–4)** is **subset-based, not bitwise**: the sender picks **40** keys `k₁…k₄₀`, publishes `α = (F(k₁), …, F(k₄₀))`; the function `G` maps a document to a **20-element subset** of `{1,…,40}`, and the signature is **exactly those 20 keys**: «*To generate a signature for a document `m`, `P` first computes `G(m)` to obtain a set `{i₁, …, i₂₀}` of integers. The signature consists of the 20 keys `k_{i₁}, …, k_{i₂₀}`*». Verification — «*`F(hⱼ) = α_{iⱼ}`*». The author explicitly calls the numbers 40/20 arbitrary and taken from Rabin for ease of comparison.
  - The closest place to "a bit" is **§3 (pp. 6–7)**, where `R(s)` is defined through bits: «*if the binary representation of `s` contains exactly 20 ones, then `R(s) = {i : the i-th bit of `s` equals one}`*». But this is **one secret per position, revealed only for the one-bits**, plus the rigid constraint "exactly 20 ones" — precisely so that `G(m′)` cannot turn out to be a subset of `G(m)`. This is **not** "two secrets per bit"; on the contrary, the construction with two secrets per bit is exactly what removes the need for such a constraint structurally.
  - 🚫 **What is not in the report at all:** pairs of secrets per bit; a public key as "hashes of both halves"; revealing "one half of two, chosen by the message bit". The wording of C-21 cannot be found in CSL-98 on any of the 8 pages.
- **Primary source of the bitwise construction — DH76 (checked by eye against the PDF, [primary ✓ web] 2026-09-28):** Diffie W., Hellman M., «New Directions in Cryptography», IEEE Trans. Inform. Theory **IT-22(6)**, Nov. 1976 — **§IV «One-Way Authentication»** (section heading on p. 649), **the construction on p. 650**, verbatim:
  > «*One-way message authentication has a partial solution suggested to the authors by **Leslie Lamport** of Massachusetts Computer Associates. This technique employs a one-way function `f` … If the transmitter wishes to send an `N` bit message he generates **`2N`**, randomly chosen, `k`-dimensional binary vectors `x₁,X₁,x₂,X₂,···,x_N,X_N` **which he keeps secret**. The receiver is given the **corresponding images under `f`**, namely `y₁,Y₁,y₂,Y₂,···,y_N,Y_N`. Later, when the message `m = (m₁,m₂,···,m_N)` is to be sent, the transmitter **sends `x₁` or `X₁` depending on whether `m₁ = 0 or 1`** … The receiver operates with `f` on the first received block and sees whether it yields `y₁` or `Y₁` as its image … But the receiver is **incapable of forging a change in even one bit** of `m`.*»

  This is **verbatim** the Product statement of C-21, point for point: two random secrets for every bit · the public key = their images under a one-way function · the signature reveals exactly one secret per bit, chosen by the message bit · verification = apply `f` and compare. And **the attribution to Lamport stands in the DH76 text itself** — so the name "Lamport" on the screen stays correct, and only the document locator changes.
- **Additionally checked (context, not for the screen):** Merkle R., «A Certified Digital Signature», CRYPTO ’89, LNCS 435 — **§3 «The Lamport-Diffie One Time Signature»** describes a variant with **one** secret per bit («*If the j-th bit of `m` was a 1, A would reveal `xⱼ`. If the j-th bit of `m` was a 0, A would not reveal `xⱼ`*»), i.e. **also not** what our screen shows. Use **DH76**, not Merkle, as the source of C-21.
- **Verdict:** 🟢 **on the fact** — the construction is correct, confirmed by the implementation [code ✓] and now has a checked verbatim primary source. **🔴 on the earlier attribution** — a `ref` on LAMPORT79 under this claim is **incorrect on the merits**, not "merely unchecked".
  - 🔧 **What the registry data must carry (mandatory):**
    1. Add the source **`DH76`** (to the pipe table of this document **and** to `SOURCES`, in one commit — see the block on sources added 2026-09-28).
    2. For entry `c21`, set a `ref` `{ src: "DH76", at: "§IV «One-Way Authentication», p. 650", verified: true }`.
    3. **Do NOT delete the `ref` on LAMPORT79** (the source remains historically valid and is needed by the table), but **rewrite its `at`** to an honest one: **`"§2 «The Algorithm», pp. 3–4 — 40 keys / 20-element subset; the bitwise construction is NOT in this report"`**, and set **`verified: true`** — the locator is now checked by eye, the "section number pending verification" badge is removed. Do **not** shorten `at` to "§2": the caveat that the bitwise variant is absent in the report is the content of the finding. (Gate sub-check K10.9 enforces this caveat.)
    4. The `ref` on RFC8391 §3.1 — as it was, `verified:true`.
  - **Historical precision (do not invent on the screen):** the "two secrets per bit" construction is **customarily** called "Lamport's scheme" (and DH76 attributes it to him), but it was **published by Diffie–Hellman in 1976**, not in Lamport's 1979 report — the 1979 report describes a different, subset-based scheme, and the author himself calls it an improvement on Rabin's scheme (1978). Do **not** attribute the bitwise construction to Merkle: Merkle's 1979 thesis is about a tree over one-time keys (see C-23), and CRYPTO ’89 §3 is about the one-secret-per-bit variant.
  - ✅ **The on-screen text does NOT need to change.** The `Product statement (EN)` above says "*A Lamport key pair …*" — this is the established **name of the scheme**, not a claim "this is what is written in Lamport's 1979 report". The finding does not require a change of wording; it requires a change of **locator**.

### C-22 · Why one-time: a second signature with the same key reveals both halves and yields forgeries

- **Product statement (EN):** *"Sign a second, different message with the same key and every bit position where the two messages disagree gives up both of its secrets. An attacker can then choose either bit freely at those positions: with L leaked positions, 2^L messages become forgeable — including messages this key never signed."*
- **Screens:** `s2` · **kind:** `derivation`
- **On-screen context:** `s2.verdict.oneSigned`, `s2.note.oneSigned`, `s2.verdict.multiSigned`, `s2.note.multiSigned`, `s2.attack.title`, `s2.forge.*`.
- **Primary source:** a **derivation from C-21** (in the UI — "derived from"): a signature reveals the half `m[i]` of pair `i`; two signatures over `m` and `m'` reveal both halves exactly at the positions where `m[i] ≠ m'[i]`; at each such position the forger is free to choose the bit ⇒ `forgeable = 2^leaked`. Confirmation by a standard at the level of the property: RFC8391 **§3.1** («if a private key is used to sign two different messages, the scheme becomes insecure») [primary ✓ web].
- **Verdict:** 🟢 — the derivation is strict and **executed by code**: the smoke test checks `0000` + `1110` → leakage of exactly 3/4 positions → 8 forgeable messages, and a signature assembled from the leaked halves passes the real `verify()` [code ✓, the project's "all green" command]. The numbers `{count}/{leaked}/{total}/{forgeable}` are **runtime substitutions from `js/schemes/lamport.mjs`, not quoted figures**: they are not entered in `figures` and do not go into `ALLOWED_LITERALS` (the dictionary has none of them — only placeholders) [code ✓].

### C-23 · The next step — XMSS/Merkle: many one-time keys under one root, at the price of state

- **Product statement (EN):** *"XMSS solves this by putting many one-time keys under a single Merkle root, so one public key covers thousands of signatures. The price is state: the signer must remember which one-time key it already burned, and reusing a key state destroys the guarantee outright."*
- **Screens:** `s2` · **kind:** `standard`
- **On-screen context:** `s2.note.multiSigned` ("XMSS/Merkle (next screens) solve exactly this"). In the S2 hash-branch screen the same entry serves step 1 of block B.
- **Primary source:** RFC8391 **§1.1 «CFRG Note on Post-Quantum Cryptography»** — «the signature schemes described in this document are stateful, meaning the secret key changes over time. **If a secret key state is used twice, no cryptographic security guarantees remain.** … it becomes feasible to forge a signature on a new message» [primary ✓ web, checked against the RFC text 2026-09-22]. The structure of the tree and WOTS+ as leaves — RFC8391 **§3.1** (WOTS+) and **§4.1 «XMSS: eXtended Merkle Signature Scheme»** [primary ✓ web, checked against the RFC text 2026-09-28 — **[VERIFY] #9 closed**].
  - **What exactly §4.1 supplies for each half of the claim** (checked verbatim):
    - "many one-time keys under one root" → «Each XMSS public/private key pair is associated with a perfect binary tree… Each tree leaf contains a special tree hash of a WOTS+ public key value… The value corresponding to the root of the XMSS tree forms the XMSS public key together with the seed»; «To generate a key pair that can be used to sign 2^h messages, a tree of height h is used».
    - "at the price of state" → «XMSS is a stateful signature scheme, meaning that the private key changes with every signature generation. To prevent one-time private keys from being used twice, the WOTS+ key pairs are numbered… The private key contains an index that is updated with every signature generation, such that it contains the index of the next unused WOTS+ key pair». The same index as part of SK — **§4.1.3 «XMSS Private Key»**: «the leaf index idx of the next WOTS+ private key that has not yet been used».
    - "reusing a key state destroys the guarantee outright" → §1.1 (see above).
- **Verdict:** 🟢 on the fact "stateful, reusing state is fatal" and on "many OTS under one root". **Both halves of the Product statement now have a checked locator** (§1.1 + §4.1/§4.1.3); `verified:true` on both `ref`s.
  - **Subtlety for the hash-branch screen:** the idea of a tree over one-time keys historically belongs to **Merkle** (thesis «Secrets, Authentication and Public Key Systems», Stanford, 1979) — if a screen names him, a separate `ref` is needed; the screen currently **uses** the name Merkle ("XMSS/Merkle"), but as the name of a construction, not as an attribution of a work. Leaving it so is safe; turning it into a historical claim without checking the thesis is not allowed.
  - ⚠️ **Subtlety for the hash-branch screen (found while checking, 2026-09-28):** FIPS205 **§3, footnote 2** — «The WOTS+ and XMSS schemes that are used as components of SLH-DSA are **not the same as** the WOTS+ and XMSS schemes in RFC 8391 [11] and SP 800-208 [12]». Therefore, on a screen where steps 1–3 follow each other (XMSS → FORS → SLH-DSA), it is **not allowed** to claim that SLH-DSA "uses the XMSS from RFC 8391". The wording of C-23 does not do this (it is about XMSS as a separate scheme), nor does C-25 — keep it so. If step 3 ever wants to say "inside, it is the same XMSS", that is a separate entry with FIPS205 §6 provenance, not RFC 8391.

### C-24 · FORS / few-time: degradation instead of a cliff (step 2)

> Added to the data with the S2 hash-branch screen (`js/data/claims.mjs`, `[dev-only]` removed in the same commit). The on-screen wording below **does not name** `k`/`t`/`a` — see the warning below; the decision stands.

- **Product statement (EN):** *"FORS signs a random subset of secrets instead of a fixed one, so a repeat does not hand over the key at once — it only shaves off security, gradually."*
- **Screens:** `s2` · **kind:** `standard`
- **Primary source:** FIPS205 **§8 «Forest of Random Subsets (FORS)»**, subsections §8.1–§8.4 (generating secrets, the tree, signing, recovering the public key from a signature). [primary ✓ web, section headings checked against the PDF 2026-09-22]
- **Verdict:** 🟢 on existence and place in the standard. ⚠️ **A quantitative statement of "gradual degradation" is forbidden on the screen without a separate check:** the concrete FORS parameters (`k`, `t`, `a`) and the security bounds tied to them are in FIPS205 **§11 Table 1** and in the SPHINCS+ analysis; if the screen **names FORS numbers**, they are added as a separate entry with a checked locator, not derived "by sense".
  - 🚫 **WARNING TO IMPLEMENTERS (provenance review decision, 2026-09-28): the FORS numbers `k`, `t`, `a` are NOT put on the screen.** This is not "not checked yet" but a deliberate refusal:
    1. **The question path on that screen is conceptual** (three expandable question-steps). `k`/`t`/`a` explain nothing to the reader without a parameter table beside them.
    2. **Extra numbers pull toward a size table, which decision O3 forbids** ("exactly one comparison line, do not expand into a table" — size tables are what a competing visualizer does, and we distance ourselves from it). A second number on the screen immediately breeds a third.
    3. Practical consequence: **no value** is entered in `figures` of C-24, and the text of step 2 in `js/i18n/en.js` **must not contain any numeric literal** (otherwise K10.4b is red, and rightly so). The wording of step 2 is taken verbatim from the `Product statement (EN)` above — it deliberately uses no numbers.
    4. If the owner later wants numbers, that is a **separate registry entry** (the next free C-N) with a checked FIPS205 §11 Table 1 locator **and** a separate project decision against O3. An implementer does not add such an entry on their own.

### C-25 · SLH-DSA: no state at all (step 3)

> Added to the data with the S2 hash-branch screen (`js/data/claims.mjs`, `[dev-only]` removed in the same commit). The mechanism "the index is derived from the message" was checked by the provenance review on 2026-09-28 (see below) — the on-screen wording uses the STRONG version, not a softened one.

- **Product statement (EN):** *"SLH-DSA drops the counter entirely: which one-time keys get used is derived from the message itself, so the signer remembers nothing between signatures. The whole scheme rests on hash functions and nothing else."*
- **Screens:** `s2` · **kind:** `standard`
- **Primary source:** FIPS205 — the title and subject of the standard: «**Stateless** Hash-Based Digital Signature Standard», **§1.1 «Purpose and Scope»**: «The security of the stateless hash-based digital signature algorithm (SLH-DSA) relies on the presumed difficulty of finding preimages for hash functions as well as several related properties of the same hash functions» [primary ✓ web, checked against the PDF 2026-09-22]. That SLH-DSA is the standardized SPHINCS+ — FIPS205 §1 (introductory part) [primary ✓ web].
- **The mechanism "the choice of one-time keys is derived from the message itself" — checked 2026-09-28 against the PDF [primary ✓ web]. The expected §10.2 turned out to be a WRONG locator — the correct two are:**
  1. **Conceptually — FIPS205 §3 «Overview of the SLH-DSA Signature Scheme»:** «An SLH-DSA signature is created by computing a randomized hash of the message, **using part of the resulting message digest to pseudorandomly select a FORS key**, and signing the remaining part of the message digest with that key». This is exactly what the on-screen wording says, and it is said in the overview section of the standard — the best locator for the product.
  2. **Normatively — FIPS205 §9.2 «SLH-DSA Signature Generation», Algorithm 19 `slh_sign_internal`, lines 2–10:** line 3 — `R ← PRF_msg(SK.prf, opt_rand, M)` ("generate randomizer"); line 5 — `digest ← H_msg(R, PK.seed, PK.root, M)` ("compute message digest"); lines 6–10 — from this digest are cut `md` (what FORS will sign), `idx_tree` and `idx_leaf`. The prose of §9.2 before the algorithm says it directly: «Bits are then extracted from the message digest to be signed by the FORS key (line 6), **to select an XMSS tree** (lines 7 and 9), and **to select a WOTS+ key and corresponding FORS key within that XMSS tree** (lines 8 and 10)».
  - ⚠️ **Why §10.2 is not the right section** (recorded so nobody "restores the old state"): §10.2 «SLH-DSA Signature Generation» is the **outer wrapper** (`slh_sign` / `hash_slh_sign`, pure vs pre-hash, context string ≤255 bytes). The index-derivation mechanism is not there — both versions simply call `slh_sign_internal`. Citing §10.2 would be plausible and wrong.
- **Verdict:** 🟢 — all three components checked: "stateless" (the title of the standard + §1.1), "rests only on hashes" (§1.1), **and the mechanism "key choice is derived from the message" (§3 + §9.2/Alg. 19)**. `[VERIFY]` removed.
  - ✅ **Take the STRONG wording for the screen** — the `Product statement (EN)` above, unchanged, including "derived from the message itself". The fallback softened version "the signer keeps no counter" is **not needed and not used**: it is weaker and loses exactly the idea for which step 3 exists (not "there is no counter", but "no counter is needed, because the index arrives deterministically from the message").
  - **Precision boundary (do not drift on edits):** "derived from the message itself" is correct as a description of the **input**: `R` is taken from `SK.prf`, the message and `opt_rand`, and the digest from `R` and the message. By default (the hedged variant) `opt_rand` is fresh randomness, i.e. the signature is **not deterministic**. Therefore it is **not allowed** to write "the same message always gives the same signature" or "deterministic" — the screen does not say this today; keep it so. The entry's claim is about the **absence of state carried between signatures**, not about determinism.

### C-26 · S2 lens: hash-based signatures are quantum-safe because their security reduces to the hash

- **Product statement (EN):** *"Hash-based signatures stay quantum-safe because their security reduces to the strength of the hash function — there is no clever algebraic structure for Shor's algorithm to attack."*
- **Screens:** `s2` · **kind:** `standard`
- **On-screen context:** `s2.lens.a1`, `s2.lens.a2`, `s2.lens.a3` ("Yes — security reduces to the strength of the hash").
- **Primary source:** FIPS205 **§1.1 «Purpose and Scope»** — the security of SLH-DSA rests on the difficulty of finding preimages of hash functions «as well as several related properties of the same hash functions»; «Unlike the algorithms specified in FIPS 186-5, SLH-DSA is designed to provide resistance against attacks from a large-scale quantum computer». [primary ✓ web, checked against the PDF 2026-09-22] Contrast — SHOR (C-6).
- **Verdict:** 🟢 with a caveat on wording: the standard says "preimage resistance **and several related properties**", so "reduces to the strength of the hash" is a correct compression, but it is **not allowed** to write "reduces to preimage resistance alone". The wording above observes this.
  - **What NOT to claim:** "quantum gives nothing against hashes". Grover gives a quadratic speedup of preimage search; this is exactly why the SLH-DSA parameters are chosen with a margin. The screen does not claim this today — keep it so.

---

## Numbers and placeholders (input for gate sub-check K10.4)

**`figures` — the only place for quoted numbers:**

| Placeholder | Value | Entry | Primary source |
|---|---|---|---|
| `{ecdsaPrivBytes}` | 32 | C-3 | SEC2 §2.4.1 [primary ✓ web] |
| `{ecdsaSigBytes}` | 64 | C-13, C-20 | SEC2 §2.4.1 (corollary) [primary ✓ web] |
| `{ethSigBytes}` | 65 | C-10 | YP App. F, p. 26 (`v∈B₁ + r∈B₃₂ + s∈B₃₂`, a sum) [primary ✓ web] + SEC1 §4.1.6 [primary ✓ web] |
| `{slhdsaSigBytes}` | 7856 | C-13 | FIPS205 §11 Table 2 [primary ✓ web] |
| `{slhdsaPkBytes}` | 32 | C-13 | FIPS205 §11 Table 2 [primary ✓ web] |
| `{mldsa44SigBytes}` | 2420 | C-20 | FIPS204 §4 Table 2 [primary ✓ web] |

**Bare literals in `js/i18n/en.js` that had to be migrated to placeholders** [code ✓ by grep 2026-09-22]:
`s1.gen.privLabel` "32 bytes" · `s0.showKey.label` "32 bytes" · **`s1.metamask.diff` "65 bytes"** ← the third one, not named in the original design.

**`ALLOWED_LITERALS` candidates (number → reason):** `4` — the Lamport demo parameter `N_BITS`/`SECRET_BYTES`, source `js/schemes/params.mjs`, not a standard (`s2.subtitle`, `s2.msg.label`) · `16` — "first 16 hex", the displayed length of the hash, a layout property (`s0.hash.label`). Names such as `SHA-256`, `Keccak-256`, `FIPS 202`, `RFC 6979`, `CVE-2013-7372`, `EIP-191`, `27C3`, and years are stripped by the K10.4b regex and need no allowlist entry.

---

## Confirmation of the @noble/curves@1.9.7 exports

Checked at runtime on the pinned version (`package-lock.json`: `@noble/curves` **1.9.7**, `@noble/hashes` **1.8.0**) — this moves the names used by the code from a secondary-source status to **[code ✓]**:

| Name used in the design | Exists in 1.9.7 | Note |
|---|---|---|
| `secp256k1.ProjectivePoint.BASE.multiply(k)` | ✅ yes (function) | **deprecated alias** in 1.9.7; the current form is `secp256k1.Point.BASE.multiply(...)` |
| `secp256k1.CURVE.n` | ✅ yes (`bigint`, ends in `…364141`) | **deprecated alias**; the current form is `secp256k1.Point.CURVE().n` |
| `mod`, `invert` (from `@noble/curves/abstract/modular`) | ✅ yes (both functions) | re-exported in `js/vendor/noble.mjs` [code ✓] |

- **Conclusion for implementers:** the names work, but `ProjectivePoint`/`CURVE` are marked `@deprecated`; prefer `secp256k1.Point.BASE` and `secp256k1.Point.CURVE().n`.

---

## Summary (state after the 2026-09-28 release check)

- **Total entries:** **26** (C-1…C-26). All 26 take part in the K10.1 parity; no `[dev-only]` marker is currently in use (C-13, C-24 and C-25 were `[dev-only]` until their on-screen text was built).
  - S1 — 12 product entries (C-1…C-12) + C-13 (the S2 size comparison).
  - S0 — 7 entries (C-14…C-20); C-2/C-3/C-4 additionally extend to `s0` (they were `s1` only).
  - S2 — 6 entries (C-21…C-26), plus C-13, C-24, C-25 on block B/C; C-6 became two-screen (`s1, s2`).
- **Resulting `SCREEN_COVERAGE`:** `{ s0: 10, s1: 12, s2: 8 }`.
  - `s0` (10): C-2, C-3, C-4, C-14, C-15, C-16, C-17, C-18, C-19, C-20.
  - `s1` (12): C-1, C-2, C-3, C-4, C-5, C-6, C-7, C-8, C-9, C-10, C-11, C-12.
  - `s2` (8): C-21, C-22, C-23, C-24, C-25, C-6, C-26, C-13 (this is also the reading order of `RENDERED_CLAIMS`).
  - ⚠️ The sum over screens is larger than the number of entries because C-2/C-3/C-4 live on two screens and C-6 on two — this is normal and is exactly how K10.3 counts (by the selection `claims.filter(c => c.screens.includes(screen))`).
- **Verdicts (after the 2026-09-28 release check):** 🟢 **20** (C-1, C-2, C-3, C-4, C-5, C-7, C-8, C-9, C-10, C-12, C-13, C-14, C-15, C-17, C-20, **C-21**, C-22, C-23, C-25, C-26) · 🟡 **6** (C-6, C-11, C-16, C-18, C-19, C-24*) · 🔴 **0**.
  - **C-21 was raised 🟡 → 🟢**: the fact was always right, only the locator was missing — it exists now (DH76 §IV, p. 650, verbatim quotation in the body of the entry). 🔴 remains **only on the earlier attribution** of the LAMPORT79 `ref`, which is not a verdict on the entry but a data task (see C-21).
  - *C-24 is marked 🟢 for the existence of the section, but carries a prohibition on quantitative statements without a separate check — in the summary it is counted among 🟡 as "has a restriction on wording".
  - **Every 🟡 has a ready rewording** in the body of the entry ⇒ records with 🔴 or without a verdict: none.
- **[VERIFY] — 0 open items.** All ten items that were ever open have been closed — eight by checking the documents by eye, two by a statement of fact ("does not reach the screen"). The list below is kept in full as history, including the two cases where the **expected number turned out to be wrong** (FIPS 202 §5.1 and the Lamport attribution itself) — so that nobody "restores the old state".
  1. ~~FIPS 186-5 — exact § of the ECDSA operations~~ → **CLOSED 2026-09-22:** §1 Introduction, §6, §6.4.1, §6.4.2 checked against the PDF.
  2. ~~Ethereum Yellow Paper — exact appendix~~ → **CLOSED 2026-09-28, the expectation was confirmed:** revision «Shanghai efc5f9a, 2025-02-04»; `KEC` = Keccak-256 — **§3 «Conventions», p. 3**; the signature — **App. F «Signing Transactions», pp. 26–27** (`ECDSASIGN → (v∈B₁, r∈B₃₂, s∈B₃₂)`, secp256k1, `h(T)` = Keccak-256). Touches **C-2, C-10, C-18** (in the data, *not* C-13 — C-13 has no `ref` on YP, the earlier summary was inaccurate there).
  3. ~~Keccak reference — the page of padding `0x01`~~ → **CLOSED 2026-09-28 with a refinement:** **§1.1.2 «Padding rules», Definition 1, p. 7** (`pad10*1`, Version 3.0 of 14.01.2011 — exactly the version YP §3 cites). ⚠️ **The byte `0x01` is not in the document** — it is derived from the bitwise rule by byte conversion. Touches C-11.
  4. ~~FIPS 202 §5.1/§B.2 — `0x06`~~ → **CLOSED 2026-09-28, and the expected §5.1 was WRONG:** §5.1 is `pad10*1`, **shared** by SHA-3 and Keccak, not the difference. The suffix `01` — **§6.1, p. 20**; the byte `0x06` — **Annex B.2 / Table 6, pp. 27–28**; the conversion — **Annex B.1, p. 26**. Touches C-11.
  5. ~~SEC 1 v2.0 §3.2.1~~ → **CLOSED 2026-09-28, the number was confirmed:** «Elliptic Curve Key Pair Generation Primitive», **p. 23 of 138** («*select an integer `d` in `[1, n − 1]` … Compute `Q = dG`*»). Touches C-3.
  6. ~~FIPS 205 §9.1 — private key `4n = 64`~~ → **DROPPED 2026-09-28 BY A STATEMENT OF FACT, not by a check:** the screen does **not** show the SLH-DSA private key (grep over `js/**`: `figures` of C-13 = `slhdsaSigBytes`/`slhdsaPkBytes`, no text about the SLH-DSA private key). No locator needed, no `ref` created, K10.7 unaffected. The condition for reopening is in the body of C-13.
  7. ~~Lamport 1979 (CSL-98) — the page of the bitwise construction~~ → **CLOSED 2026-09-28, AND THIS IS THE BIGGEST FINDING: the page does not exist.** The PDF was opened in full (Microsoft Research mirror) — all 8 pages; §2 «The Algorithm» describes a **subset scheme of 40 keys / a 20-element subset**, and the bitwise "two secrets per bit" variant is **not in the report**. The real checked primary source of the construction is **DH76 §IV «One-Way Authentication», p. 650** (and the attribution to Lamport stands there, in the DH76 text). Touches C-21. Details are in the body of C-21.
  8. ~~EIP-721 — exact section~~ → **DROPPED 2026-09-28 BY A STATEMENT OF FACT + a precautionary check:** EIP-721 is **not quoted** on the screen (the source was not in `SOURCES`, a grep for `721` over `js/**`/`*.html` gave zero), K10.7 is unaffected under any decision. The locator was nevertheless checked and was later used as the second `ref` of C-18 (Specification, `ERC721`: `ownerOf` / `transferFrom`).
  9. ~~RFC 8391 §4.1 — section number of the XMSS structure~~ → **CLOSED 2026-09-28:** §4.1 «XMSS: eXtended Merkle Signature Scheme» + §4.1.3 «XMSS Private Key» checked against the RFC text. C-23 is fully supported.
  10. ~~FIPS 205 §10.2 — § of the mechanism "index/randomizer derived from the message"~~ → **CLOSED 2026-09-28, and the expected number was WRONG:** the mechanism is in **§3 (overview)** and **§9.2 / Algorithm 19 `slh_sign_internal`**, whereas §10.2 is the outer pure/pre-hash wrapper. C-25 was raised to 🟢 and ships with the strong wording.

### Release conditions and precision rules

**Release condition (K10.7, `--release` mode of the gate):** zero `verified:false` locators in `js/data/claims.mjs`, a canonical `https://` base URL, the reference author string, and the license files present. **The by-eye check against the primary documents required for this is complete (2026-09-28):** on the provenance side, no check remains open. All seven formerly unverified locators in the data were flipped to `verified:true` with the exact `at` wording established in the entries above (c2/YP, c3/SEC1, c10/YP, c11/FIPS202, c11/KECCAK, c18/YP, c21/LAMPORT79); the sources `DH76` and `EIP721` were added to `SOURCES` and to the table of this document in the same step, and `c21` and `c18` received their second `ref`s.

**Precision rules that carry over to any future edit:**

1. **C-11 is NOT `[dev-only]`:** its text `s1.metamask.keccakNote` is rendered on S1 [code ✓ `js/screens/ecdsa.mjs:101`], so it takes part in the parity and in `RENDERED_CLAIMS` of `s1`. Leaving it `[dev-only]` would put a factual claim on the screen without a registry entry.
2. **No bare numeric literals in the dictionary:** quoted numbers live only in `figures` (K10.4a), and unexplained numbers in product prose fail K10.4b.
3. **C-19 wording:** "the same construction", never "the same machinery".
4. **C-20:** one line, S0 only, `kind: measurement`, the Cloudflare blog is captioned as a vendor announcement; the primary source for the size is FIPS 204, not the blog.
5. **C-13 / C-24 / C-25:** these entries stay `[dev-only]` until their on-screen text exists; adding them to the data earlier would make them orphans and fail K10.3.
6. **C-6 (Shor):** keep "discrete-log problem". If the UI stresses ECDLP on a curve, add a `ref` to Proos–Zalka 2003. Do not attribute the ECDLP treatment to Shor's paper.
7. **C-11 (Keccak vs SHA-3):** the equality "Keccak-256 = SHA-3 / FIPS 202" is forbidden. FIPS 202 is used only as a contrast.
8. **C-9 (Android):** use **CVE-2013-7372**; do not mix it with 7373 in one sentence.
9. **C-16:** cite the `sha256("abc")` vector from **NIST Example Values (SHA256.pdf)**, not from FIPS 180-4 — the standard itself has no examples (Appendix A.2).
10. **C-26:** do not write "reduces to preimage resistance alone", and do not claim that quantum is powerless against hashes (Grover).
11. **C-24:** the FORS numbers `k`, `t`, `a` do not go on the screen; `figures` of C-24 stays empty.
12. **C-25:** use the strong wording verbatim; do not write "deterministic".
13. **C-23 / C-25:** do not claim that SLH-DSA "uses the XMSS from RFC 8391" — FIPS 205 §3, footnote 2 explicitly denies it.
14. **C-21 / C-22:** keep the DH76 §IV, p. 650 locator on C-21; the LAMPORT79 `ref` must keep its explicit caveat that the bitwise construction is not in that report (enforced by gate sub-check K10.9).

---

## Log

A condensed, neutral record of how the registry was built and verified. Dates are ISO dates.

- **2026-08-04 · Screen S1 registry (C-1…C-13) drafted.** The historical incidents (PS3 27C3 2010, Android SecureRandom 2013 + CVE-2013-7372) were raised to [primary ✓ web]; the exports of `@noble/curves@1.9.7` were confirmed [code ✓].
- **2026-09-22 · Registry extended from 13 to 26 entries.** Screens S0 (C-14…C-20) and S2 (C-21…C-26) were added, and each of C-1…C-26 received a `Product statement (EN)`. The two permanent rules (IDs, citation handle) were put in the header. Checked against primary sources in this round [primary ✓ web]: FIPS 186-5 §1/§6/§6.4.1/§6.4.2, FIPS 180-4 §6.2 + Appendix A.2, NIST Example Values SHA256.pdf (the `abc` vector), FIPS 204 §4 Table 2 (ML-DSA-44 = 2420), FIPS 205 §1.1/§8/§11 Table 2, RFC 8391 §1.1/§3.1, ICAO Doc 9303-11 §5.1, ISO 32000-1 §12.8, Debian `apt-secure(8)`, the Cloudflare blog of 2026-09-10, and the metadata of Lamport CSL-98. Decisions of that round: the "passport / PDFs / OS updates" line stays but is reworded ("the same construction", not "the same machinery"); C-11 is not `[dev-only]` because its safe wording already renders on S1; a third bare literal ("65 bytes" in `s1.metamask.diff`) was found; C-13, C-24 and C-25 were marked `[dev-only]` because their on-screen text did not exist yet; the NIST candidate count correction (8, not 9) was recorded.
- **2026-09-28 · Provenance gaps closed before the hash-branch screen.** Checked by eye: the FIPS 205 PDF (table of contents + §3 + §9.2/Algorithm 19 + §10.2) and the full text of RFC 8391 (§4.1, §4.1.3). Results: (1) C-25 went to 🟢, because the expected §10.2 was the wrong locator — the mechanism is in §9.2 / Algorithm 19 and, in product terms, in §3; (2) coverage for the "must it keep state?" step already exists as C-23, whose last open item (§4.1) was closed; (3) an explicit warning was added to C-24 that FORS numbers `k`, `t`, `a` do not go on the screen; side finding: FIPS 205 §3 footnote 2 (the WOTS+/XMSS inside SLH-DSA are not those of RFC 8391).
- **2026-09-28 · Hash-branch screen entered into the data.** `[dev-only]` was removed from C-13, C-24 and C-25 in the same commit as their data entries, so the registry reached full parity (26 of 26). `SCREEN_COVERAGE` became `{ s0: 10, s1: 12, s2: 8 }`; C-6 became two-screen (`s1, s2`) so that block C closes the thread "quantum breaks clever math, but not hashes" with two wordings side by side (C-6 and C-26). C-25 uses the strong wording. C-24 shows no numbers.
- **2026-09-28 · Release check — all open items closed.** Eight items were closed by checking the documents by eye and two by a statement of fact (see the list above). Main findings: (a) the Lamport CSL-98 report does not contain the bitwise "two secrets per bit" construction — the checked primary source for it is Diffie–Hellman 1976 §IV, p. 650, which also attributes the idea to Lamport; (b) the expected FIPS 202 §5.1 locator is wrong — §5.1 is padding shared by SHA-3 and Keccak, the difference is the suffix in §6.1 (byte form in Annex B.2 / Table 6), and the Keccak reference contains no `0x01` byte (it is derived); (c) the Ethereum Yellow Paper locators were confirmed (§3 for `KEC`, Appendix F for the signature), and the string "65 bytes" is not in it (65 is the sum of the types); (d) SEC 1 §3.2.1 was confirmed; (e) EIP-721 was checked in reserve.
- **2026-09-28 · K10.7 closed — zero `verified:false`.** All seven `verified:false` flags were flipped to `true` using the exact locators established above (with §5.1 removed from c11/FIPS202 and replaced by §6.1 + Annex B.2, and the LAMPORT79 `ref` of c21 kept, to preserve the negative fact "the construction is not here"). `DH76` and `EIP721` were added to `SOURCES` and to the pipe table of this document in one step, because K10.1 requires strict equality of the ID sets. A new gate sub-check, **K10.9**, was added against exactly three plausible-and-wrong regressions: (1) c11/FIPS202 `at` getting `§5.1` again; (2) c21/LAMPORT79 losing the caveat that the bitwise construction is absent from the report; (3) c21 losing its `ref` on DH76. All three were verified by negative testing. On-screen texts were not touched in this step — only provenance changed.
