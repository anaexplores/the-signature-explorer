// Scanner for committed secrets. Forge-agnostic; used by tools/checks/check.mjs.
// Principle: a secret must NEVER be in git. Detect by content, and check that no real
// .env file is tracked.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

// Rules are tuned for a low false-positive rate: long/structured secrets, not short words.
export const SECRET_RULES = [
  { rule: "private-key-block", re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { rule: "aws-access-key-id", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { rule: "aws-secret-access-key", re: /aws_secret_access_key\s*=\s*['"]?[A-Za-z0-9/+]{40}\b/i },
  { rule: "gh-token", re: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/ },
  // Added rules (the ones above are unchanged):
  { rule: "gh-fine-grained-pat", re: /\bgithub_pat_[0-9A-Za-z_]{22,}\b/ },
  { rule: "figma-token", re: /\bfigd_[0-9A-Za-z_\-]{20,}/ },
  // Any PEM private-key header, including the ENCRYPTED and PKCS#8 forms (the RSA/EC-only
  // the fixed-type rule above misses those). The header itself is not spelled out here: this file is
  // scanned too, and a literal example would trip the rule.
  { rule: "private-key-block-any", re: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY(?: BLOCK)?-----/ },
  // Unquoted assignment (.env / shell / yaml style) of a long literal to an api_key / token style name.
  {
    rule: "assigned-secret-unquoted",
    re: /\b[A-Za-z0-9_]*(?:api[_-]?key|token|secret)\b\s*[:=]\s*[A-Za-z0-9_\-\/+=.]{24,}\s*$/i,
  },
  { rule: "slack-token", re: /\bxox[abpors]-[0-9A-Za-z-]{10,}\b/ },
  { rule: "google-api-key", re: /\bAIza[0-9A-Za-z_\-]{35}\b/ },
  { rule: "openai-key", re: /\bsk-(?:proj-)?[A-Za-z0-9_\-]{20,}\b/ },
  { rule: "url-inline-credentials", re: /\b[a-z][a-z0-9+.\-]*:\/\/[^/\s:@]+:[^/\s:@]{3,}@/i },
  {
    rule: "assigned-secret-literal",
    re: /\b(?:api[_-]?key|secret|token|password|passwd|access[_-]?key|private[_-]?key|client[_-]?secret)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
  },
];

// Placeholder values are not secrets (a frequent false positive in .env.example and docs).
const PLACEHOLDER = /(your|example|changeme|change_me|placeholder|xxx+|dummy|sample|<[^>]*>|redacted|\*{3,}|\.\.\.|here)/i;

// Which files are scanned at all (text/code/config); binaries and artifacts are skipped.
const SCANNABLE = /\.(env|env\..+|js|jsx|ts|tsx|mjs|cjs|py|rb|go|rs|java|php|sh|ps1|json|ya?ml|toml|ini|cfg|conf|xml|txt|md|sql|tf|properties)$/i;
// These paths are always skipped.
const SKIP = /(^|[\/\\])(node_modules|\.git|dist|build|\.next|out|coverage|__pycache__|\.venv|venv|tools[\/\\]checks[\/\\]test|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.env\.example)([\/\\]|$)/i;

export function scanText(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > 4000) continue; // minified junk
    for (const { rule, re } of SECRET_RULES) {
      const m = re.exec(line);
      if (m && !PLACEHOLDER.test(m[0])) hits.push({ line: i + 1, rule, text: line.trim().slice(0, 120) });
    }
  }
  return hits;
}

export function scanFiles(files, root = process.cwd()) {
  const findings = [];
  for (const f of files) {
    const abs = path.isAbsolute(f) ? f : path.join(root, f);
    const relPath = path.relative(root, abs);
    if (SKIP.test(relPath) || !SCANNABLE.test(abs)) continue;
    let text;
    try {
      if (fs.statSync(abs).size > 1_500_000) continue;
      text = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    for (const h of scanText(text)) findings.push({ file: relPath.replace(/\\/g, "/"), ...h });
  }
  return findings;
}

// Git-tracked files (for CI). Returns null outside a git repository.
export function listTrackedFiles(root = process.cwd()) {
  try {
    const out = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return null;
  }
}

// Critical: a real .env file (not .example) must not be tracked by git.
export function trackedEnvFiles(root = process.cwd()) {
  const tracked = listTrackedFiles(root);
  if (!tracked) return [];
  return tracked.filter((f) => /(^|[\/\\])\.env(\.[\w.-]+)?$/i.test(f) && !/\.env\.example$/i.test(f));
}

// Main entry: scans the git repo (git-tracked files, or the whole tree if not under git). Returns {secrets, trackedEnv}.
export function scanRepo(root = process.cwd()) {
  const tracked = listTrackedFiles(root);
  const files = tracked ?? walkDir(root);
  return { secrets: scanFiles(files, root), trackedEnv: trackedEnvFiles(root) };
}

// Fallback for projects without git: walk the directory tree.
function walkDir(root) {
  const acc = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (SKIP.test(path.relative(root, full))) continue;
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) acc.push(full);
    }
  }
  return acc;
}
