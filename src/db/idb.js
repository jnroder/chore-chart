const DB_NAME = "choreChartDB";
const DB_VERSION = 1;
const STORE = "instances";

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode) {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

function reqAsPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function listInstances() {
  const store = await tx("readonly");
  const results = await reqAsPromise(store.getAll());
  return (results || []).sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0),
  );
}

export async function getInstance(id) {
  const store = await tx("readonly");
  return reqAsPromise(store.get(id));
}

export async function saveInstance(instanceData) {
  const data = { ...instanceData, updatedAt: Date.now() };
  const store = await tx("readwrite");
  await reqAsPromise(store.put(data));
  return data;
}

export async function deleteInstance(id) {
  const store = await tx("readwrite");
  return reqAsPromise(store.delete(id));
}
