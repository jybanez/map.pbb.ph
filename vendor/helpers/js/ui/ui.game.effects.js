const DEFAULT_OPTIONS = {
  defaultDuration: 300,
  defaultEasing: "linear",
  reducedMotion: "respect",
  reducedMotionDuration: 1,
  autoRemove: true,
  timeScale: 1,
  idPrefix: "effect",
};

export const GAME_EFFECT_EASINGS = Object.freeze({
  linear: (t) => t,
  inQuad: (t) => t * t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2),
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - ((1 - t) ** 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2),
});

export function createGameEffectTimeline(options = {}) {
  const current = normalizeOptions(options);
  const effects = new Map();
  let sequence = 0;
  let paused = Boolean(options.paused);
  let destroyed = false;

  function spawn(effect = {}) {
    if (destroyed) {
      return null;
    }
    const normalized = normalizeEffect(effect, current, nextId);
    effects.set(normalized.id, normalized);
    return snapshotEffect(normalized, current);
  }

  function update(deltaMs = 0) {
    if (destroyed || paused) {
      return getEffects();
    }
    const delta = Math.max(0, Number(deltaMs) || 0) * current.timeScale;
    if (delta <= 0) {
      return getEffects();
    }
    effects.forEach((effect, id) => {
      if (effect.done) {
        return;
      }
      effect.elapsed = Math.min(effect.totalDuration, effect.elapsed + delta);
      effect.done = effect.elapsed >= effect.totalDuration;
      if (effect.done && current.autoRemove) {
        effects.delete(id);
      }
    });
    return getEffects();
  }

  function forEach(callback, options = {}) {
    if (typeof callback !== "function") {
      return;
    }
    getEffects(options).forEach((effect) => callback(effect, api));
  }

  function getEffects(options = {}) {
    return Array.from(effects.values())
      .filter((effect) => options.includeDone === true || !effect.done)
      .map((effect) => snapshotEffect(effect, current));
  }

  function getEffect(id) {
    const effect = effects.get(String(id || ""));
    return effect ? snapshotEffect(effect, current) : null;
  }

  function remove(id) {
    return effects.delete(String(id || ""));
  }

  function clear() {
    effects.clear();
    return api;
  }

  function pause() {
    paused = true;
    return api;
  }

  function resume() {
    paused = false;
    return api;
  }

  function setPaused(nextPaused) {
    paused = Boolean(nextPaused);
    return api;
  }

  function isPaused() {
    return paused;
  }

  function getState() {
    return {
      paused,
      destroyed,
      count: effects.size,
      options: { ...current },
      effects: getEffects({ includeDone: true }),
    };
  }

  function destroy() {
    destroyed = true;
    effects.clear();
  }

  function nextId() {
    sequence += 1;
    return `${current.idPrefix}-${sequence}`;
  }

  const api = {
    spawn,
    update,
    forEach,
    getEffects,
    getEffect,
    remove,
    clear,
    pause,
    resume,
    setPaused,
    isPaused,
    getState,
    destroy,
  };

  return api;
}

function normalizeOptions(options = {}) {
  const reducedMotion = normalizeReducedMotion(options.reducedMotion);
  const reducedMotionActive = isReducedMotionActive(reducedMotion);
  return {
    ...DEFAULT_OPTIONS,
    ...(options || {}),
    defaultDuration: normalizeDuration(options.defaultDuration, DEFAULT_OPTIONS.defaultDuration),
    defaultEasing: normalizeEasingName(options.defaultEasing, DEFAULT_OPTIONS.defaultEasing),
    reducedMotion,
    reducedMotionActive,
    reducedMotionDuration: normalizeDuration(options.reducedMotionDuration, DEFAULT_OPTIONS.reducedMotionDuration),
    autoRemove: options.autoRemove !== false,
    timeScale: normalizePositiveNumber(options.timeScale, DEFAULT_OPTIONS.timeScale),
    idPrefix: String(options.idPrefix || DEFAULT_OPTIONS.idPrefix).trim() || DEFAULT_OPTIONS.idPrefix,
  };
}

function normalizeEffect(effect, options, nextId) {
  const id = String(effect.id || nextId()).trim();
  const rawDuration = normalizeDuration(effect.duration, options.defaultDuration);
  const duration = options.reducedMotionActive
    ? Math.min(rawDuration, options.reducedMotionDuration)
    : rawDuration;
  const delay = options.reducedMotionActive ? 0 : normalizeDuration(effect.delay, 0);
  const elapsed = Math.min(delay + duration, Math.max(0, Number(effect.elapsed) || 0));
  const easing = normalizeEasingName(effect.easing, options.defaultEasing);
  return {
    ...effect,
    id,
    type: String(effect.type || "effect"),
    payload: clonePayload(effect.payload),
    duration,
    delay,
    easing,
    elapsed,
    totalDuration: delay + duration,
    done: elapsed >= delay + duration,
  };
}

function snapshotEffect(effect) {
  const activeElapsed = Math.max(0, effect.elapsed - effect.delay);
  const active = effect.elapsed >= effect.delay;
  const progress = effect.duration <= 0 ? 1 : clamp01(activeElapsed / effect.duration);
  const eased = ease(effect.easing, progress);
  return {
    id: effect.id,
    type: effect.type,
    payload: clonePayload(effect.payload),
    duration: effect.duration,
    delay: effect.delay,
    elapsed: effect.elapsed,
    age: activeElapsed,
    remaining: Math.max(0, effect.totalDuration - effect.elapsed),
    progress,
    eased,
    easing: effect.easing,
    active,
    done: effect.done,
  };
}

function ease(name, progress) {
  const easing = GAME_EFFECT_EASINGS[name] || GAME_EFFECT_EASINGS.linear;
  return clamp01(easing(clamp01(progress)));
}

function normalizeDuration(value, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) {
    return Math.max(0, Number(fallback) || 0);
  }
  return Math.max(0, next);
}

function normalizePositiveNumber(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : fallback;
}

function normalizeEasingName(value, fallback) {
  const name = String(value || "").trim();
  return GAME_EFFECT_EASINGS[name] ? name : fallback;
}

function normalizeReducedMotion(value) {
  if (value === true) {
    return "force";
  }
  if (value === false) {
    return "ignore";
  }
  const normalized = String(value || DEFAULT_OPTIONS.reducedMotion).trim().toLowerCase();
  return ["respect", "ignore", "force"].includes(normalized) ? normalized : DEFAULT_OPTIONS.reducedMotion;
}

function isReducedMotionActive(mode) {
  if (mode === "force") {
    return true;
  }
  if (mode === "ignore") {
    return false;
  }
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function clonePayload(payload) {
  if (Array.isArray(payload)) {
    return payload.map(clonePayload);
  }
  if (payload && typeof payload === "object") {
    return { ...payload };
  }
  return payload;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}
