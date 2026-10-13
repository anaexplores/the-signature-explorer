// js/core/dom.mjs — minimal DOM helpers, no framework.
// There must be no crypto logic here (K7).

/**
 * Creates a DOM element.
 * @param {string} tag - tag name, may include `.class` and `#id` in CSS notation ("div.card#foo").
 * @param {object} [attrs] - attributes/properties. `text` sets textContent, `html` sets innerHTML,
 *   keys starting with "on" (e.g. onclick) are attached as addEventListener handlers.
 * @param {Array<Node|string>} [children] - child nodes or strings.
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const [tagName, ...rest] = tag.split(/(?=[.#])/);
  const node = document.createElement(tagName || "div");
  for (const token of rest) {
    if (token.startsWith(".")) node.classList.add(token.slice(1));
    else if (token.startsWith("#")) node.id = token.slice(1);
  }
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key === "class") node.className = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "dataset" && typeof value === "object") {
      for (const [dk, dv] of Object.entries(value)) node.dataset[dk] = dv;
    } else if (typeof value === "boolean") {
      if (value) node.setAttribute(key, "");
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

/** Mounts node inside root, clearing root first. */
export function mount(root, node) {
  root.innerHTML = "";
  root.appendChild(node);
  return node;
}

/** Short addEventListener with the same signature as the DOM one. */
export function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/** querySelector shorthand. */
export function qs(selector, root = document) {
  return root.querySelector(selector);
}

/** querySelectorAll → array (not a NodeList). */
export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}
