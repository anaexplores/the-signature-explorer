// js/core/site-meta.mjs — keeps <link rel="canonical"> + <meta property="og:url"> in sync
// with SITE.canonicalBase. Each HTML file already carries these two tags as STATIC text
// with absolute URLs (link-preview bots run no JavaScript); this module sets the existing
// tag's href/content to the computed URL (gate K10.7 verifies they are equal), and only
// creates the tag if it is missing, so no duplicates appear. Same rule js/core/sources.mjs's
// resolveUrl() enforces for citations: NEVER fall back to location.origin or any other
// guessed address (that's exactly the localhost-in-a-citation bug this rule was written to
// prevent) — while SITE.canonicalBase is empty this module does nothing at all.
//
// <title>/<meta name="description">/OG "type"+"title"+"description"/Twitter Card tags
// live as plain, static text directly in each HTML file's own <head> — NOT through
// this module and NOT through js/i18n/*, on purpose: crawlers and link-preview bots
// (Twitter/Facebook/some search engines) often don't execute JavaScript, so SEO/social
// metadata has to be present in the raw HTML bytes, not injected at runtime. Only the
// canonical URL and og:url are also touched at runtime, because they derive from
// SITE.canonicalBase, which is set in js/data/site.mjs.
//
// K7: no crypto here — DOM only. Zero state of its own, called once per screen at
// module load, same "screen owns everything, this is a pure helper" contract as
// js/core/lens.mjs and js/core/sources.mjs.

import { SITE } from "../data/site.mjs";

/**
 * @param {string} pagePath - the canonical filename for this screen, e.g. "index.html",
 *   "ecdsa.html", "hash.html" — same convention js/core/sources.mjs's resolveUrl()
 *   already uses for the citation URL, kept consistent so both point at the same URL.
 */
export function injectCanonicalMeta(pagePath) {
  if (!SITE.canonicalBase) return;
  const url = `${SITE.canonicalBase.replace(/\/$/, "")}/${pagePath}`;

  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;

  let og = document.head.querySelector('meta[property="og:url"]');
  if (!og) {
    og = document.createElement("meta");
    og.setAttribute("property", "og:url");
    document.head.appendChild(og);
  }
  og.setAttribute("content", url);
}
