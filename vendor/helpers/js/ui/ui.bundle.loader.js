// Dist-only accessor. The builder supplies the canonical registry and module map.
export function createBundleLoader(registry, modules, cssUrl) {
  const styles = new WeakMap();
  function resolve(name) {
    const entry = registry[String(name)];
    if (!Object.prototype.hasOwnProperty.call(registry, String(name))) {
      throw new Error(`Helper UI bundle does not include component "${name}".`);
    }
    return { name: String(name), ...entry, deps: [...(entry.deps || [])], css: [cssUrl] };
  }
  async function ensureStyles(name, options = {}) {
    const entry = resolve(name);
    if (typeof document === "undefined") return entry;
    const parent = options.parent || document.head;
    if (!styles.has(parent)) {
      const promise = new Promise((resolveStyle, reject) => {
        const existing = Array.from(parent.querySelectorAll('link[rel="stylesheet"]'))
          .find((link) => link.href === cssUrl);
        if (existing?.sheet) { resolveStyle(); return; }
        const link = existing || document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssUrl;
        const cleanup = () => {
          link.removeEventListener("load", loaded);
          link.removeEventListener("error", failed);
        };
        const loaded = () => { cleanup(); resolveStyle(); };
        const failed = () => {
          cleanup();
          if (!existing) link.remove();
          reject(new Error(`Unable to load Helper bundle stylesheet: ${cssUrl}`));
        };
        link.addEventListener("load", loaded);
        link.addEventListener("error", failed);
        if (!existing) parent.appendChild(link);
      });
      styles.set(parent, promise);
      promise.catch(() => styles.delete(parent));
    }
    await styles.get(parent);
    return entry;
  }
  async function load(name, options = {}) {
    const entry = resolve(name);
    if (options.recursive !== false) {
      await Promise.all(entry.deps.map((dep) => load(dep, options)));
    }
    if (options.css !== false) await ensureStyles(name, options);
    const module = modules[entry.js.replace(/\?.*$/, "")];
    if (!module) throw new Error(`Missing Helper bundle module for "${name}".`);
    return options.js ? module : entry;
  }
  async function get(name, options = {}) {
    const entry = resolve(name);
    const module = await load(name, { ...options, js: true });
    if (!entry.export) return module;
    if (!(entry.export in module)) throw new Error(`Missing Helper bundle export "${entry.export}".`);
    return module[entry.export];
  }
  return Object.freeze({
    has: (name) => Object.prototype.hasOwnProperty.call(registry, String(name)),
    resolve, ensureStyles, load, get,
    loadMany: (names, options) => Promise.all(names.map((name) => load(name, options))),
    async create(name, ...args) {
      const factory = await get(name);
      if (typeof factory !== "function") throw new Error(`Helper component "${name}" is not a factory.`);
      return factory(...args);
    },
  });
}
