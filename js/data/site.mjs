// js/data/site.mjs — site-wide constants for citation & licensing.
// DATA ONLY (K10.5): no `function`, no `=>`, no `import`.
//
// Two eternal rules, duplicated from docs/PROVENANCE.md's header (never revisit):
//   1. Claim IDs (js/data/claims.mjs) are never renumbered — see that file's header.
//   2. `author` below carries the handle "anaexplores":
//      project name + a durable pseudonymous handle, not a real name. This handle is
//      eternal on par with claim IDs — it is already printed into citations issued from
//      this tool, and changing it breaks those citations. Do not "clean it up" later.

export const SITE = Object.freeze({
  // ONLY place the deployed address lives. It is the permanent public address of the site:
  // https://anaexplores.github.io/the-signature-explorer/ (declared permanent — citations
  // already point at it). If it ever has to change, rebuild (K9) and verify the
  // citation string and <link rel="canonical"> show the real URL — nothing else changes.
  canonicalBase: "https://anaexplores.github.io/the-signature-explorer/",
  title: "The Signature Explorer",
  // Project + eternal handle, not a real name.
  author: "The Signature Explorer (anaexplores)",
  // CC BY 4.0 on content (docs/**, js/i18n/** text, diagrams,
  // screenshots — see LICENSE-CONTENT), MIT on code (js/**, tools/**, test/**, css/** —
  // see LICENSE).
  licenseContent: "CC BY 4.0",
  licenseCode: "MIT",
  // Date the registry (js/data/claims.mjs) last changed content — NOT the build date,
  // NOT "today". K10.6 ties this to registrySha256 below: change one, update both.
  contentVersion: "2026-09-28",
  // sha256 of js/data/claims.mjs's exact file bytes, recomputed by
  // `node tools/checks/check.mjs` (K10.6). Falling out of sync with a fresh hash means
  // the registry changed without a matching contentVersion bump.
  registrySha256: "565d977645040dd42d042bf85a43108d304b76541eac6a467b545d1082d5a047",
});
