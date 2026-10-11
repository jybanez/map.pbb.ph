import { Marked } from "../vendor/marked.esm.js";
import createDOMPurify from "../vendor/dompurify.es.mjs";

const MAX_BYTES = 256 * 1024;
const FALLBACK_CHARS = 4096;
const sanitizers = new WeakMap();
let nextId = 0;
const escape = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const tags = ["p", "br", "strong", "em", "code", "a"];
const fullTags = [...tags, "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "pre", "table", "thead", "tbody", "tr", "th", "td", "div"];
const defaults = { markdown: "", profile: "full", maxLines: null, headingOffset: 0, tables: true, linkTarget: "_self", emptyText: "No content", showMoreLabel: "Show more", showLessLabel: "Show less", fallbackLabel: "Formatting unavailable. Showing plain text.", oversizeLabel: "Content exceeds the display limit. Showing a plain-text preview.", codeLabel: "Code block", tableLabel: "Table" };

function normalize(options) {
  const next = { ...defaults, ...options };
  if (next.markdown == null) next.markdown = "";
  if (typeof next.markdown !== "string") throw new TypeError("markdown must be a string.");
  if (!["compact", "full"].includes(next.profile)) throw new TypeError("profile must be compact or full.");
  if (!["_self", "_blank"].includes(next.linkTarget)) throw new TypeError("linkTarget must be _self or _blank.");
  if (next.maxLines != null && (!Number.isInteger(next.maxLines) || next.maxLines < 1 || next.maxLines > 20)) throw new TypeError("maxLines must be null or an integer from 1 to 20.");
  if (!Number.isInteger(next.headingOffset)) throw new TypeError("headingOffset must be an integer.");
  if (next.images !== undefined && next.images !== false) throw new TypeError("Images are disabled in Markdown v1.");
  for (const key of ["emptyText", "showMoreLabel", "showLessLabel", "fallbackLabel", "oversizeLabel", "codeLabel", "tableLabel"]) next[key] = String(next[key] ?? defaults[key]);
  return next;
}

function safeURL(href) {
  const raw = String(href ?? "");
  // Reject ambiguous schemes rather than trying to repair attacker-controlled URLs.
  if (/[\u0000-\u0020\u007f-\u009f\\]/u.test(raw) || !/^(https?:\/\/|mailto:)/i.test(raw)) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:", "mailto:"].includes(url.protocol) || url.username || url.password) return null;
    if (url.protocol !== "mailto:" && !url.hostname) return null;
    if (url.protocol === "mailto:" && (!url.pathname || /%0[ad]/i.test(raw))) return null;
    return url.href;
  } catch { return null; }
}

function renderFragment(source, opts, doc) {
  const compact = opts.profile === "compact";
  const parser = new Marked({ gfm: true, breaks: true, async: false, renderer: {
    html(token) { return escape(token.text); },
    image(token) { return escape(token.text); },
    link(token) {
      const label = this.parser.parseInline(token.tokens), href = safeURL(token.href);
      if (!href) return label;
      return `<a href="${escape(href)}" target="${opts.linkTarget}" rel="noopener noreferrer">${label}</a>`;
    },
    heading(token) {
      const text = this.parser.parseInline(token.tokens);
      if (compact) return `<p>${text}</p>`;
      const depth = Math.max(1, Math.min(6, token.depth + opts.headingOffset));
      return `<h${depth}>${text}</h${depth}>`;
    },
    code(token) {
      const text = escape(token.text);
      return compact ? `<p>${text}</p>` : `<pre tabindex="0" aria-label="${escape(opts.codeLabel)}"><code>${text}</code></pre>`;
    },
    blockquote(token) { return compact ? `<p>${escape(token.text)}</p>` : `<blockquote>${this.parser.parse(token.tokens)}</blockquote>`; },
    list(token) {
      if (compact) return token.items.map(item => `<p>${escape(item.text)}</p>`).join("");
      const tag = token.ordered ? "ol" : "ul";
      const start = token.ordered && Number.isSafeInteger(token.start) ? ` start="${token.start}"` : "";
      return `<${tag}${start}>${token.items.map(item => `<li>${this.parser.parse(item.tokens)}</li>`).join("")}</${tag}>`;
    },
    table(token) {
      if (compact || !opts.tables) return [token.header, ...token.rows].map(row => `<p>${row.map(cell => escape(cell.text)).join(" | ")}</p>`).join("");
      const cells = (row, tag) => `<tr>${row.map(cell => `<${tag}>${this.parser.parseInline(cell.tokens)}</${tag}>`).join("")}</tr>`;
      return `<div role="region" tabindex="0" aria-label="${escape(opts.tableLabel)}"><table><thead>${cells(token.header, "th")}</thead><tbody>${token.rows.map(row => cells(row, "td")).join("")}</tbody></table></div>`;
    },
    hr() { return "<br>"; },
    del(token) { return this.parser.parseInline(token.tokens); }
  } });
  let purifier = sanitizers.get(doc.defaultView);
  if (!purifier) { purifier = createDOMPurify(doc.defaultView); sanitizers.set(doc.defaultView, purifier); }
  if (!purifier.isSupported) throw Object.assign(new Error("Sanitizer unavailable"), { reason: "sanitizer-unavailable" });
  const html = parser.parse(source);
  const fragment = purifier.sanitize(html, {
    ALLOWED_TAGS: compact ? tags : fullTags,
    ALLOWED_ATTR: ["href", "target", "rel", "start", "role", "tabindex", "aria-label"],
    // These fixed renderer attributes are not URLs; href still uses both URL gates.
    ADD_URI_SAFE_ATTR: ["target", "rel", "start", "tabindex", "aria-label"],
    ALLOWED_NAMESPACES: ["http://www.w3.org/1999/xhtml"],
    ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:https?:\/\/|mailto:)/i,
    RETURN_DOM_FRAGMENT: true, SANITIZE_DOM: true
  });
  if (!fragment || fragment.nodeType !== 11 || (html.trim() && !fragment.hasChildNodes())) throw new Error("Sanitizer returned no content");
  return fragment;
}

function plainText(fragment) {
  let text = "";
  const visit = node => {
    if (node.nodeType === 3) { text += node.textContent; return; }
    if (node.nodeName === "BR") text += "\n";
    for (const child of node.childNodes) visit(child);
    if (/^(P|H[1-6]|LI|BLOCKQUOTE|PRE|TR)$/.test(node.nodeName)) text += "\n";
  };
  visit(fragment);
  return text.replace(/\n+$/, "");
}

/** Render untrusted Markdown with fixed profiles and a fail-closed sanitizer. */
export function createMarkdownView(host, options = {}) {
  if (!host?.appendChild || !host.ownerDocument?.defaultView) throw new TypeError("Markdown view requires a browser host.");
  const doc = host.ownerDocument, win = doc.defaultView;
  let opts = normalize(options), destroyed = false, expanded = false, truncated = false, reason = null, fragment, plain = "", collapsed = false;
  const root = doc.createElement("div"); root.className = "ui-markdown";
  const content = doc.createElement("div"); content.className = "ui-markdown-content"; content.id = `ui-markdown-${++nextId}`;
  const toggle = doc.createElement("button"); toggle.type = "button"; toggle.className = "ui-markdown-toggle"; toggle.setAttribute("aria-controls", content.id);
  root.append(content, toggle);
  function prepare(next) {
    const source = next.markdown;
    let fallback = null, result;
    if (source.length > MAX_BYTES || new TextEncoder().encode(source).length > MAX_BYTES) fallback = "oversize";
    else if (!source.trim()) {
      result = doc.createDocumentFragment(); const empty = doc.createElement("p"); empty.className = "ui-markdown-empty"; empty.textContent = next.emptyText; result.append(empty);
    } else {
      try { result = renderFragment(source, next, doc); }
      catch (error) { fallback = error.reason === "sanitizer-unavailable" ? error.reason : "render-error"; }
    }
    if (fallback) {
      result = doc.createDocumentFragment();
      const label = doc.createElement("p"); label.className = "ui-markdown-notice"; label.textContent = fallback === "oversize" ? next.oversizeLabel : next.fallbackLabel;
      const text = doc.createElement("div"); text.className = "ui-markdown-plain"; text.textContent = source.slice(0, FALLBACK_CHARS) + (source.length > FALLBACK_CHARS ? "…" : ""); result.append(label, text);
    }
    return { fragment: result, plain: plainText(result), reason: fallback };
  }
  function show() {
    const focused = doc.activeElement === toggle;
    content.replaceChildren(collapsed ? doc.createTextNode(plain) : fragment.cloneNode(true));
    content.classList.toggle("is-clamped", collapsed);
    content.style.setProperty("--ui-markdown-lines", String(opts.maxLines || 1));
    toggle.hidden = !truncated; toggle.textContent = expanded ? opts.showLessLabel : opts.showMoreLabel;
    toggle.setAttribute("aria-expanded", String(expanded));
    if (focused && !toggle.hidden) toggle.focus({ preventScroll: true });
  }
  function measure() {
    if (destroyed || opts.profile !== "compact" || !opts.maxLines || reason || !opts.markdown.trim()) return;
    // Measure a non-interactive plain preview, never invisible keyboard targets.
    const probe = doc.createElement("div"); probe.className = "ui-markdown-content is-clamped ui-markdown-measure";
    probe.setAttribute("aria-hidden", "true"); probe.style.setProperty("--ui-markdown-lines", String(opts.maxLines)); probe.textContent = plain; root.append(probe);
    const next = probe.scrollHeight > probe.clientHeight + 1; probe.remove();
    const nextCollapsed = next && !expanded;
    if (next !== truncated || nextCollapsed !== collapsed) { truncated = next; collapsed = nextCollapsed; show(); }
  }
  function apply(next) {
    const prepared = prepare(next); // Build off-DOM; failures are safe text before commit.
    opts = next; fragment = prepared.fragment; plain = prepared.plain; reason = prepared.reason;
    expanded = false; truncated = false; collapsed = opts.profile === "compact" && !!opts.maxLines && !reason;
    root.dataset.profile = opts.profile; root.dataset.fallback = reason || "";
    show(); measure();
  }
  const onToggle = () => { if (destroyed) return; expanded = !expanded; collapsed = truncated && !expanded; show(); };
  toggle.addEventListener("click", onToggle);
  apply(opts); host.append(root); measure();
  const observer = new win.ResizeObserver(measure); observer.observe(root);
  doc.fonts?.ready.then(() => { if (!destroyed) measure(); });
  return {
    update(next = {}) { if (!destroyed) apply(normalize({ ...opts, ...next })); },
    getSource: () => opts.markdown,
    getState: () => ({ profile: opts.profile, expanded, truncated, fallback: reason !== null, reason, destroyed }),
    destroy() { if (destroyed) return; destroyed = true; observer.disconnect(); toggle.removeEventListener("click", onToggle); root.remove(); fragment = null; plain = ""; }
  };
}
