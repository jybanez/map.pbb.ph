// UTC Date objects are arithmetic carriers only, never business-time instants.
export function parseCivil(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw new TypeError("Wall-clock values must be offset-free strings.");
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/.exec(value);
  if (!m) throw new RangeError("Use YYYY-MM-DDTHH:mm[:ss[.SSS]] without an offset.");
  const [y, mo, d, h, mi, sec] = m.slice(1, 7).map(v => Number(v || 0));
  const ms = Number((m[7] || "").padEnd(3, "0"));
  const date = new Date(0);
  date.setUTCFullYear(y, mo - 1, d);
  date.setUTCHours(h, mi, sec, ms);
  if (y < 1 || date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d || date.getUTCHours() !== h || date.getUTCMinutes() !== mi || date.getUTCSeconds() !== sec) {
    throw new RangeError("Invalid wall-clock calendar date or time.");
  }
  return date;
}
export function formatCivil(date, withTime = true) {
  if (!date) return null;
  const text = date.toISOString();
  if (!withTime) return text.slice(0, 10);
  return date.getUTCMilliseconds() ? text.slice(0, -1) : text.slice(0, 19);
}
export function civilMonth(date) {
  const next = new Date(date);
  next.setUTCDate(1); next.setUTCHours(0, 0, 0, 0);
  return next;
}
export function civilTime(date) { return formatCivil(date).slice(11); }
export function civilAtTime(date, time) {
  return parseCivil(formatCivil(date, false) + "T" + time);
}
