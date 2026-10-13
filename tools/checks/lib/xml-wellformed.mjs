// tools/checks/lib/xml-wellformed.mjs - K12: every committed *.svg is well-formed XML.
//
// Why: browsers parse an SVG used as an image (favicon, <img>) with a strict XML parser
// and drop the whole file on the first well-formedness error - no partial render, no
// console error on the page. A comment containing "--" (e.g. a note about a CSS custom
// property like --accent) is enough to make the favicon silently disappear. A
// Content-Type check does not catch this: the file is served fine, it just never draws.
//
// Deliberately small, dependency-free checker covering what an SVG file can contain:
// XML declaration, comments, processing instructions, CDATA, a DOCTYPE without an
// internal subset, elements, attributes and character/entity references. It reports
// the first error per file with a line number.

import fs from "node:fs";
import path from "node:path";

const NAME = /^[A-Za-z_:][\w.:-]*/;
const PREDEFINED = new Set(["amp", "lt", "gt", "quot", "apos"]);

function badReference(text) {
  // Every "&" must start a predefined entity or a numeric character reference.
  const re = /&([^;\s&<]*);?/g;
  for (let m; (m = re.exec(text)); ) {
    const ref = m[1];
    const ok = m[0].endsWith(";") && (PREDEFINED.has(ref) || /^#\d+$/.test(ref) || /^#x[0-9A-Fa-f]+$/.test(ref));
    if (!ok) return m[0];
  }
  return null;
}

/** @returns {string|null} the first well-formedness error, or null if the text is well-formed */
export function checkWellFormed(src) {
  let s = src.replace(/^﻿/, "");
  let i = 0;
  const stack = [];
  let roots = 0;
  const lineAt = (pos) => s.slice(0, pos).split("\n").length;
  const err = (pos, msg) => `line ${lineAt(pos)}: ${msg}`;

  if (s.startsWith("<?xml")) {
    const end = s.indexOf("?>");
    if (end < 0) return err(0, "unterminated XML declaration");
    i = end + 2;
  }
  while (i < s.length) {
    const lt = s.indexOf("<", i);
    const text = s.slice(i, lt < 0 ? s.length : lt);
    if (stack.length === 0 && text.trim()) return err(i, "text outside the root element");
    const ref = badReference(text);
    if (ref) return err(i, `invalid entity/character reference "${ref}"`);
    if (lt < 0) break;
    i = lt;
    if (s.startsWith("<!--", i)) {
      const end = s.indexOf("-->", i + 4);
      if (end < 0) return err(i, "unterminated comment");
      const body = s.slice(i + 4, end);
      if (body.includes("--")) return err(i + 4 + body.indexOf("--"), 'comment must not contain "--"');
      if (body.endsWith("-")) return err(end, 'comment must not end with "-"');
      i = end + 3;
    } else if (s.startsWith("<![CDATA[", i)) {
      if (stack.length === 0) return err(i, "CDATA outside the root element");
      const end = s.indexOf("]]>", i);
      if (end < 0) return err(i, "unterminated CDATA section");
      i = end + 3;
    } else if (s.startsWith("<?", i)) {
      const end = s.indexOf("?>", i);
      if (end < 0) return err(i, "unterminated processing instruction");
      i = end + 2;
    } else if (s.startsWith("<!DOCTYPE", i)) {
      const end = s.indexOf(">", i);
      if (end < 0) return err(i, "unterminated DOCTYPE");
      if (s.slice(i, end).includes("[")) return err(i, "DOCTYPE internal subset is not supported here");
      if (roots || stack.length) return err(i, "DOCTYPE after the root element");
      i = end + 1;
    } else if (s.startsWith("</", i)) {
      const m = s.slice(i + 2).match(NAME);
      if (!m) return err(i, "invalid end tag");
      const close = s.indexOf(">", i);
      if (close < 0 || s.slice(i + 2 + m[0].length, close).trim()) return err(i, `malformed end tag </${m[0]}>`);
      const open = stack.pop();
      if (open !== m[0]) return err(i, open ? `</${m[0]}> closes <${open}>` : `</${m[0]}> has no open element`);
      i = close + 1;
    } else {
      const m = s.slice(i + 1).match(NAME);
      if (!m) return err(i, 'stray "<"');
      if (stack.length === 0 && roots++ > 0) return err(i, "more than one root element");
      let j = i + 1 + m[0].length;
      const seen = new Set();
      for (;;) {
        const ws = s.slice(j).match(/^\s*/)[0].length;
        j += ws;
        if (s.startsWith("/>", j)) { j += 2; break; }
        if (s[j] === ">") { stack.push(m[0]); j += 1; break; }
        if (j >= s.length) return err(i, `unterminated start tag <${m[0]}>`);
        if (!ws) return err(j, `missing whitespace before attribute in <${m[0]}>`);
        const a = s.slice(j).match(/^([A-Za-z_:][\w.:-]*)\s*=\s*("([^"<]*)"|'([^'<]*)')/);
        if (!a) return err(j, `malformed attribute in <${m[0]}>`);
        if (seen.has(a[1])) return err(j, `duplicate attribute "${a[1]}" in <${m[0]}>`);
        seen.add(a[1]);
        const r = badReference(a[3] ?? a[4]);
        if (r) return err(j, `invalid entity/character reference "${r}" in attribute "${a[1]}"`);
        j += a[0].length;
      }
      i = j;
    }
  }
  if (stack.length) return err(s.length, `unclosed element <${stack[stack.length - 1]}>`);
  if (!roots) return err(0, "no root element");
  return null;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.svg$/i.test(e.name)) out.push(p);
  }
  return out;
}

export function runSvgGate({ root }) {
  const files = walk(root);
  const messages = [];
  let failed = false;
  for (const f of files) {
    const e = checkWellFormed(fs.readFileSync(f, "utf8"));
    if (e) {
      failed = true;
      messages.push(`✗ K12: ${path.relative(root, f).split(path.sep).join("/")} is not well-formed XML (${e}) - browsers will not draw it.`);
    }
  }
  if (!failed) messages.push(`✓ K12: ${files.length} SVG file(s) are well-formed XML.`);
  return { failed, messages, count: files.length };
}
