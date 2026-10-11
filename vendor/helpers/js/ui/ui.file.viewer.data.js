// Bounded parsers shared by the complete text-file viewers. All values stay data.
export const FILE_VIEWER_LIMITS = Object.freeze({
  json: { maxBytes: 1024 * 1024, maxNodes: 5000, maxDepth: 32 },
  markdown: { maxBytes: 256 * 1024 },
  csv: { maxBytes: 2 * 1024 * 1024, maxRows: 20000, maxColumns: 128, maxCells: 200000 },
});

export function viewerLimits(format, requested = {}) {
  const result = { ...FILE_VIEWER_LIMITS[format] };
  for (const key of Object.keys(result)) {
    if (requested[key] === undefined) continue;
    if (!Number.isInteger(requested[key]) || requested[key] < 1 || requested[key] > result[key]) {
      throw new RangeError(`${key} must be an integer from 1 to ${result[key]}.`);
    }
    result[key] = requested[key];
  }
  return result;
}

export function checkText(text, maxBytes) {
  if (typeof text !== "string") throw new TypeError("content must be a UTF-8 text string.");
  if (text.length > maxBytes || new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new RangeError(`File exceeds the ${maxBytes.toLocaleString("en-US")}-byte preview limit. Open or download the source instead.`);
  }
  return text.replace(/^\uFEFF/, "");
}

export function parseViewerJson(text, limits = FILE_VIEWER_LIMITS.json) {
  const value = JSON.parse(text);
  const pending = [[value, 0]];
  let count = 0;
  while (pending.length) {
    const [node, depth] = pending.pop();
    if (++count > limits.maxNodes || depth > limits.maxDepth) {
      throw new RangeError(`JSON exceeds the preview limit (${limits.maxNodes} nodes, ${limits.maxDepth} levels). Download the source instead.`);
    }
    if (node && typeof node === "object") {
      for (const child of Object.values(node)) pending.push([child, depth + 1]);
    }
  }
  return value;
}

export function parseViewerCsv(text, { headers = true, ...limits } = FILE_VIEWER_LIMITS.csv) {
  limits = { ...FILE_VIEWER_LIMITS.csv, ...limits };
  const records = [];
  let record = [], field = "", quoted = false, afterQuote = false, cells = 0;
  const pushField = () => {
    if (++cells > limits.maxCells || record.length >= limits.maxColumns) throw new RangeError("CSV exceeds the cell or column preview limit. Download the source instead.");
    record.push(field); field = ""; afterQuote = false;
  };
  const pushRecord = () => {
    pushField();
    if (records.length >= limits.maxRows + (headers ? 1 : 0)) throw new RangeError("CSV exceeds the row preview limit. Download the source instead.");
    if (records.length && record.length !== records[0].length) throw new SyntaxError(`CSV record ${records.length + 1} has ${record.length} fields; expected ${records[0].length}.`);
    records.push(record); record = [];
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { quoted = false; afterQuote = true; }
      } else field += char;
    } else if (char === ",") pushField();
    else if (char === "\r" || char === "\n") {
      pushRecord();
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else if (afterQuote) throw new SyntaxError(`Unexpected text after a closing quote in CSV record ${records.length + 1}.`);
    else if (char === '"') {
      if (field) throw new SyntaxError(`Unexpected quote in CSV record ${records.length + 1}.`);
      quoted = true;
    } else field += char;
  }
  if (quoted) throw new SyntaxError("Unclosed quoted field at the end of the CSV file.");
  if (field || record.length || afterQuote) pushRecord();
  const names = headers ? (records.shift() || []) : (records[0] || []).map((_, i) => `Column ${i + 1}`);
  return {
    columns: names.map((name, i) => ({ key: `c${i}`, label: name || `Column ${i + 1}`, sortable: true })),
    rows: records.map((values, index) => Object.fromEntries([["id", index], ...values.map((v, i) => [`c${i}`, v])])),
  };
}

export function viewerSourceUrl(value, base) {
  if (!value) return "";
  const url = new URL(String(value), base);
  if (!["http:", "https:", "blob:"].includes(url.protocol) || url.username || url.password) {
    throw new TypeError("Use an HTTP, HTTPS or blob source URL without embedded credentials.");
  }
  return url.href;
}

export async function readViewerResponse(response, maxBytes, signal) {
  if (!response.ok) throw new Error(`Unable to load file (HTTP ${response.status}). Check access and retry.`);
  if (Number(response.headers.get("content-length")) > maxBytes) {
    await response.body?.cancel();
    throw new RangeError("File exceeds the preview byte limit. Open or download the source instead.");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let count = 0, text = "";
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      count += value.byteLength;
      if (count > maxBytes) throw new RangeError("File exceeds the preview byte limit. Open or download the source instead.");
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}
