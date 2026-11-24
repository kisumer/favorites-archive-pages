/**
 * On-device persistence. Everything stays in this browser: IndexedDB first,
 * localStorage as a fallback, memory as a last resort (e.g. locked-down private mode).
 */
export type StoreKind = "indexeddb" | "localstorage" | "memory";

export class StorageQuotaError extends Error {
  constructor() {
    super("저장 공간이 부족해요. 백업 파일을 내보낸 뒤 사용하지 않는 사진을 지워 주세요.");
    this.name = "StorageQuotaError";
  }
}

export function isQuotaError(e: unknown): boolean {
  if (e instanceof StorageQuotaError) return true;
  if (!e || typeof e !== "object") return false;
  const err = e as { name?: string; code?: number };
  return (
    err.name === "QuotaExceededError" ||
    err.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    err.code === 22 ||
    err.code === 1014
  );
}

function wrap(e: unknown): Error {
  if (isQuotaError(e)) return new StorageQuotaError();
  return e instanceof Error ? e : new Error("저장 중 문제가 생겼어요.");
}

export interface ArchiveStore {
  kind: StoreKind;
  loadState(): Promise<unknown>;
  saveState(state: unknown): Promise<void>;
  loadImages(): Promise<Record<string, string>>;
  putImage(id: string, dataUrl: string): Promise<void>;
  deleteImages(ids: string[]): Promise<void>;
  clearAll(): Promise<void>;
}

const DB_NAME = "choiae-archive";
const DB_VERSION = 1;
const KV = "kv";
const IMAGES = "images";

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const timer = setTimeout(() => reject(new Error("indexedDB timeout")), 3000);
    let r: IDBOpenDBRequest;
    try {
      r = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (e) {
      clearTimeout(timer);
      return reject(e);
    }
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
      if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES, { keyPath: "id" });
    };
    r.onsuccess = () => {
      clearTimeout(timer);
      resolve(r.result);
    };
    r.onerror = () => {
      clearTimeout(timer);
      reject(r.error);
    };
    r.onblocked = () => {
      clearTimeout(timer);
      reject(new Error("indexedDB blocked"));
    };
  });
}

function idbStore(db: IDBDatabase): ArchiveStore {
  return {
    kind: "indexeddb",
    async loadState() {
      const tx = db.transaction(KV, "readonly");
      return (await req(tx.objectStore(KV).get("state"))) ?? null;
    },
    async saveState(state) {
      try {
        const tx = db.transaction(KV, "readwrite");
        tx.objectStore(KV).put(state, "state");
        await done(tx);
      } catch (e) {
        throw wrap(e);
      }
    },
    async loadImages() {
      const tx = db.transaction(IMAGES, "readonly");
      const rows = (await req(tx.objectStore(IMAGES).getAll())) as { id: string; data: string }[];
      const out: Record<string, string> = {};
      for (const row of rows) if (row && typeof row.data === "string") out[row.id] = row.data;
      return out;
    },
    async putImage(id, data) {
      try {
        const tx = db.transaction(IMAGES, "readwrite");
        tx.objectStore(IMAGES).put({ id, data });
        await done(tx);
      } catch (e) {
        throw wrap(e);
      }
    },
    async deleteImages(ids) {
      if (ids.length === 0) return;
      const tx = db.transaction(IMAGES, "readwrite");
      const s = tx.objectStore(IMAGES);
      for (const id of ids) s.delete(id);
      await done(tx);
    },
    async clearAll() {
      const tx = db.transaction([KV, IMAGES], "readwrite");
      tx.objectStore(KV).clear();
      tx.objectStore(IMAGES).clear();
      await done(tx);
    },
  };
}

const LS_PREFIX = "choiae:v1:";

function localStore(): ArchiveStore {
  const ls = window.localStorage;
  const imgKeys = () => {
    const keys: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(`${LS_PREFIX}img:`)) keys.push(k);
    }
    return keys;
  };
  return {
    kind: "localstorage",
    async loadState() {
      const raw = ls.getItem(`${LS_PREFIX}state`);
      return raw ? JSON.parse(raw) : null;
    },
    async saveState(state) {
      try {
        ls.setItem(`${LS_PREFIX}state`, JSON.stringify(state));
      } catch (e) {
        throw wrap(e);
      }
    },
    async loadImages() {
      const out: Record<string, string> = {};
      for (const k of imgKeys()) {
        const v = ls.getItem(k);
        if (v) out[k.slice(`${LS_PREFIX}img:`.length)] = v;
      }
      return out;
    },
    async putImage(id, data) {
      try {
        ls.setItem(`${LS_PREFIX}img:${id}`, data);
      } catch (e) {
        throw wrap(e);
      }
    },
    async deleteImages(ids) {
      for (const id of ids) ls.removeItem(`${LS_PREFIX}img:${id}`);
    },
    async clearAll() {
      for (const k of imgKeys()) ls.removeItem(k);
      ls.removeItem(`${LS_PREFIX}state`);
    },
  };
}

function memoryStore(): ArchiveStore {
  let state: unknown = null;
  const images = new Map<string, string>();
  return {
    kind: "memory",
    async loadState() {
      return state;
    },
    async saveState(s) {
      state = s;
    },
    async loadImages() {
      return Object.fromEntries(images);
    },
    async putImage(id, data) {
      images.set(id, data);
    },
    async deleteImages(ids) {
      for (const id of ids) images.delete(id);
    },
    async clearAll() {
      state = null;
      images.clear();
    },
  };
}

export async function openStore(): Promise<ArchiveStore> {
  try {
    const db = await openDb();
    // Probe a write so broken private-mode implementations fall back early.
    const tx = db.transaction(KV, "readwrite");
    tx.objectStore(KV).put(Date.now(), "probe");
    await done(tx);
    void navigator.storage?.persist?.().catch(() => undefined);
    return idbStore(db);
  } catch {
    try {
      window.localStorage.setItem(`${LS_PREFIX}probe`, "1");
      window.localStorage.removeItem(`${LS_PREFIX}probe`);
      return localStore();
    } catch {
      return memoryStore();
    }
  }
}

export async function estimateStorage(): Promise<{ usage: number; quota: number } | null> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est || est.usage == null || est.quota == null) return null;
    return { usage: est.usage, quota: est.quota };
  } catch {
    return null;
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)}MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)}GB`;
}
