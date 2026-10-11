export const PERSONAL_DB = 'pbb-personal-layers-v1';
export function validateLayerDocument(value, validateFeatures = features => features) {
  if (!value || value.schema !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0 || !Array.isArray(value.layers)) throw Error('Saved personal layers have an unsupported or damaged format.');
  const ids = new Set();
  const layers = value.layers.map(layer => {
    if (!layer || typeof layer.id !== 'string' || !layer.id || ids.has(layer.id) || typeof layer.name !== 'string' || !layer.name.trim() || layer.name.length > 80 || typeof layer.visible !== 'boolean' || !Array.isArray(layer.features)) throw Error('Saved personal layer details are invalid.');
    ids.add(layer.id);
    return { id: layer.id, name: layer.name, visible: layer.visible, features: validateFeatures(layer.features) };
  });
  return structuredClone({ schema: 1, revision: value.revision, layers });
}
export function createPersonalLayerStore({ indexedDB = globalThis.indexedDB } = {}) {
  let database = null, opening = null, closed = false;
  function open() {
    if (closed) return Promise.reject(Error('Personal layer storage is closed.'));
    if (database) return Promise.resolve(database);
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      if (!indexedDB) return reject(Error('This browser does not provide local personal-layer storage.'));
      const request = indexedDB.open(PERSONAL_DB, 1);
      let failed = false; const deny = error => { failed = true; reject(error); };
      const timer = setTimeout(() => deny(Error('Personal-layer storage could not open. Close other Map tabs and reload.')), 5000);
      request.onupgradeneeded = () => { request.result.createObjectStore('documents'); };
      request.onerror = () => { clearTimeout(timer); deny(request.error); };
      request.onblocked = () => { clearTimeout(timer); deny(Error('Personal-layer storage is blocked by another tab.')); };
      request.onsuccess = () => {
        clearTimeout(timer);
        if (closed || failed) { request.result.close(); reject(Error('Storage context closed.')); return; }
        database = request.result; const connection = database;
        database.onversionchange = () => { connection.close(); if(database===connection){database=null;opening=null;} };
        resolve(database);
      };
    });
    opening = opening.catch(error => { opening = null; throw error; });
    return opening;
  }
  async function read() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readonly'), request = tx.objectStore('documents').get('layers');
      request.onsuccess = () => { try { resolve(request.result === undefined ? {schema:1,revision:0,layers:[]} : validateLayerDocument(request.result)); } catch(error) { reject(error); } };
      request.onerror = () => reject(request.error);
      tx.onabort = () => reject(tx.error || Error('Personal-layer read failed.'));
    });
  }
  async function save(document) {
    const valid = validateLayerDocument(document), db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('documents', 'readwrite'), store = tx.objectStore('documents'); let failure;
      const request = store.get('layers');
      request.onsuccess = () => {
        try {
          const previous = request.result === undefined ? {revision:0} : validateLayerDocument(request.result);
          if (previous.revision !== valid.revision) throw Error('Personal layers changed in another tab. Your edits remain here; reload only after preserving them.');
          valid.revision++; store.put(valid, 'layers');
        } catch(error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => resolve(structuredClone(valid));
      tx.onabort = () => reject(failure || tx.error || Error('Personal-layer save failed.'));
      tx.onerror = () => { failure ||= tx.error; };
    });
  }
  return { read, save, close() { closed = true; database?.close(); database = null; } };
}
