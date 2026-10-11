import { ICON_DEFINITIONS } from "./ui.icons.catalog.js?v=0.21.240";

const SVG_NS = "http://www.w3.org/2000/svg";
const definitions = new Map(Object.entries(ICON_DEFINITIONS));

// Packs are explicit imports: applications pay only for the artwork they use.
export function registerIconPack(pack) {
  const entries = Object.entries(pack || {});
  const validated = entries.map(([name, definition]) => {
    if (!/^[a-z][a-z0-9-]*\.[a-z0-9-]+$/.test(name) || !definition?.category || !Array.isArray(definition.nodes) || !definition.nodes.length) {
      throw new Error(`[registerIconPack] Invalid definition "${name}".`);
    }
    const copy = JSON.parse(JSON.stringify(definition));
    for (const node of copy.nodes) {
      if (!["path", "circle", "ellipse", "rect", "line", "polyline", "polygon"].includes(node.tag)) throw new Error("Unsupported icon node.");
      for (const [key, value] of Object.entries(node.attrs || {})) {
        if (!/^(d|cx|cy|r|rx|ry|x|y|x1|x2|y1|y2|width|height|points|fill|stroke|stroke-width|fill-rule|clip-rule|opacity|transform)$/.test(key) || /url\s*\(/i.test(String(value))) throw new Error("Unsupported icon attribute.");
      }
    }
    if (copy.brandColor && !/^#[0-9a-f]{6}$/i.test(copy.brandColor)) throw new Error("Invalid brand color.");
    const existing = definitions.get(name);
    if (existing && JSON.stringify(existing) !== JSON.stringify(copy)) throw new Error(`[registerIconPack] Icon already exists: ${name}`);
    return [name, copy];
  });
  for (const [name, definition] of validated) definitions.set(name, definition);
  return validated.length;
}

export function createIcon(name, options = {}) {
  const resolvedName = definitions.has(String(name || "").trim()) ? String(name).trim() : options.fallback || name;
  const definition = getIconDefinition(resolvedName);
  if (!definition) {
    throw new Error(`[createIcon] Unknown icon "${name}".`);
  }

  const size = normalizeSize(options.size);
  const decorative = options.decorative !== false && !options.ariaLabel && !options.title;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", definition.viewBox || "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", String(normalizeStrokeWidth(options.strokeWidth)));
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("data-icon", resolvedName);
  if (options.variant === "brand" && definition.brandColor) svg.style.color = definition.brandColor;
  svg.setAttribute("data-icon-category", definition.category);
  svg.setAttribute("class", ["ui-icon", `is-${definition.category}`, options.className || ""].filter(Boolean).join(" "));

  if (decorative) {
    svg.setAttribute("aria-hidden", "true");
  } else {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", String(options.ariaLabel || options.title || name).trim());
  }

  if (options.title) {
    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = String(options.title);
    svg.appendChild(title);
  }

  definition.nodes.forEach((node) => {
    const child = document.createElementNS(SVG_NS, node.tag);
    Object.entries(node.attrs || {}).forEach(([key, value]) => {
      child.setAttribute(key, String(value));
    });
    svg.appendChild(child);
  });

  return svg;
}

export function getIconDefinition(name) {
  const key = String(name || "").trim();
  if (!definitions.has(key)) {
    return null;
  }
  const definition = definitions.get(key);
  return {
    ...definition,
    nodes: definition.nodes.map((node) => ({ ...node, attrs: { ...node.attrs } })),
  };
}

export function listIcons() {
  return Array.from(definitions.keys()).sort();
}

export function listIconCategories() {
  return Array.from(new Set(listIcons().map((name) => definitions.get(name).category))).sort();
}

function normalizeSize(value) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : 16;
}

function normalizeStrokeWidth(value) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : 1.8;
}
