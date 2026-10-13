// js/i18n/index.mjs — t(key) + dictionary selection.
// v1 only ships `en`, but the selection mechanism exists from day one so a second
// locale never requires touching screens.

import en from "./en.js";

const DICTIONARIES = { en };
const FALLBACK_LANG = "en";

function currentLang() {
  const lang = (typeof document !== "undefined" && document.documentElement?.lang) || FALLBACK_LANG;
  return DICTIONARIES[lang] ? lang : FALLBACK_LANG;
}

/**
 * Looks up a flat i18n key (e.g. "s2.title") in the active dictionary.
 * Falls back to `en`, then to the key itself (visibly broken > silently blank —
 * easier to spot a missing key during review than a blank string).
 *
 * `vars` substitutes `{name}` placeholders — used only for numbers/counts that come
 * from js/schemes/* (all numbers/sizes come from params.mjs, not from the locale
 * text — the sentence itself stays a dictionary value, only the digits are dynamic).
 */
export function t(key, vars) {
  const dict = DICTIONARIES[currentLang()];
  const fallback = DICTIONARIES[FALLBACK_LANG];
  let str = key;
  if (dict && Object.prototype.hasOwnProperty.call(dict, key)) str = dict[key];
  else if (fallback && Object.prototype.hasOwnProperty.call(fallback, key)) str = fallback[key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.split(`{${name}}`).join(String(value));
    }
  }
  return str;
}

export function availableLanguages() {
  return Object.keys(DICTIONARIES);
}
