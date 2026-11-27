/**
 * Persistent browser cache (IndexedDB) for shared-room images so revisiting or
 * refreshing a room never re-downloads images the browser has already fetched.
 * Uses a dedicated database separate from solo mode's "choiae-archive".
 */

const CACHE_DB_NAME = "choiae-together-cache";
const CACHE_DB_VERSION = 1;
const STORE_NAME = "images";
const CACHE_TTL_MS = 48 * 60 * 60 * 1000;

interface CachedImageRow {
  key: string;
  roomId: string;
  imageId: string;
  data: string;
  savedAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openCacheDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    const timer = setTimeout(() => resolve(null), 2000);
    try {
      const req = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
          store.createIndex("roomId", "roomId", { unique: false });
        }
      };
      req.onsuccess = () => {
        clearTimeout(timer);
        resolve(req.result);
      };
      req.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      req.onblocked = () => {
        clearTimeout(timer);
        resolve(null);
      };
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
  });
  return dbPromise;
}

function idbReq<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function idbTxDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("aborted"));
  });
}

export async function loadCachedRoomImages(roomId: string): Promise<Record<string, string>> {
  try {
    const db = await openCacheDb();
    if (!db) return {};
    const tx = db.transaction(STORE_NAME, "readonly");
    const idx = tx.objectStore(STORE_NAME).index("roomId");
    const rows = (await idbReq(idx.getAll(roomId))) as CachedImageRow[];
    const now = Date.now();
    const out: Record<string, string> = {};
    for (const row of rows) {
      if (row && typeof row.imageId === "string" && typeof row.data === "string" && now - row.savedAt < CACHE_TTL_MS) {
        out[row.imageId] = row.data;
      }
    }
    void pruneExpiredCache(db);
    return out;
  } catch {
    return {};
  }
}

export async function saveCachedRoomImages(roomId: string, images: Record<string, string>): Promise<void> {
  const entries = Object.entries(images);
  if (entries.length === 0) return;
  try {
    const db = await openCacheDb();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const now = Date.now();
    for (const [imageId, data] of entries) {
      if (typeof data !== "string" || !data.startsWith("data:image/")) continue;
      const row: CachedImageRow = {
        key: `${roomId}:${imageId}`,
        roomId,
        imageId,
        data,
        savedAt: now,
      };
      store.put(row);
    }
    await idbTxDone(tx);
  } catch {
    // ignore quota or private-mode errors
  }
}

export async function deleteCachedRoomImages(roomId: string): Promise<void> {
  try {
    const db = await openCacheDb();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index("roomId");
    const keys = (await idbReq(idx.getAllKeys(roomId))) as IDBValidKey[];
    for (const k of keys) store.delete(k);
    await idbTxDone(tx);
  } catch {
    // ignore
  }
}

let lastPrunedAt = 0;

async function pruneExpiredCache(db: IDBDatabase): Promise<void> {
  const now = Date.now();
  if (now - lastPrunedAt < 10 * 60 * 1000) return;
  lastPrunedAt = now;
  try {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const all = (await idbReq(store.getAll())) as CachedImageRow[];
    for (const row of all) {
      if (row && now - row.savedAt >= CACHE_TTL_MS) {
        store.delete(row.key);
      }
    }
    await idbTxDone(tx);
  } catch {
    // ignore
  }
}
