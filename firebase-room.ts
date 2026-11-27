import { CATEGORY_COLORS, isHexColor } from "./palette";
import { createDefaultState, emptyMonths, isValidYear, LIMITS, MONTH_COUNT, uid } from "./model";
import type { BadgeMode, Category, MonthPick, YearData } from "./types";

const DB_URL_STORAGE_KEY = "choiae:together:dbUrl";
const RECENT_ROOMS_KEY = "choiae:together:recentRooms";
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

export function isRoomExpired(updatedAt: number, now: number = Date.now()): boolean {
  return Number.isFinite(updatedAt) && now - updatedAt >= ROOM_TTL_MS;
}

export interface RecentRoom {
  roomId: string;
  title: string;
  year: number;
  visitedAt: number;
}

export interface RoomRecord {
  version: 1;
  year: number;
  title: string;
  categoryOrder: string[];
  categories: Record<string, Category>;
  images: Record<string, string>;
  updatedAt: number;
}

export function normalizeDbUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return null;
    if (
      !parsed.hostname.endsWith(".firebaseio.com") &&
      !parsed.hostname.endsWith(".firebasedatabase.app")
    ) {
      return null;
    }
    return `${parsed.origin}`;
  } catch {
    return null;
  }
}

const DEFAULT_DB_URL = "https://fav-932a6-default-rtdb.firebaseio.com";

export function getEnvDbUrl(): string | null {
  const raw = import.meta.env["VITE_FIREBASE_DB_URL"] as string | undefined;
  return (raw ? normalizeDbUrl(raw) : null) ?? DEFAULT_DB_URL;
}

export function getConfiguredDbUrl(): string | null {
  const envUrl = getEnvDbUrl();
  if (envUrl) return envUrl;
  try {
    const saved = window.localStorage.getItem(DB_URL_STORAGE_KEY);
    return (saved ? normalizeDbUrl(saved) : null) ?? DEFAULT_DB_URL;
  } catch {
    return DEFAULT_DB_URL;
  }
}

export function saveDbUrl(raw: string): string | null {
  const normalized = normalizeDbUrl(raw);
  if (!normalized) return null;
  try {
    window.localStorage.setItem(DB_URL_STORAGE_KEY, normalized);
  } catch {
    // ignore storage errors
  }
  return normalized;
}

export function clearSavedDbUrl(): void {
  try {
    window.localStorage.removeItem(DB_URL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function loadRecentRooms(): RecentRoom[] {
  try {
    const raw = window.localStorage.getItem(RECENT_ROOMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RecentRoom =>
        r &&
        typeof r.roomId === "string" &&
        typeof r.title === "string" &&
        typeof r.year === "number" &&
        typeof r.visitedAt === "number",
    );
  } catch {
    return [];
  }
}

export function saveRecentRoom(room: RecentRoom): void {
  try {
    const current = loadRecentRooms().filter((r) => r.roomId !== room.roomId);
    const next = [room, ...current].slice(0, 8);
    window.localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function generateRoomId(): string {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint8Array(6);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(arr);
    for (let i = 0; i < 6; i++) out += chars[arr[i]! % chars.length];
  } else {
    for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function extractRoomId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      const u = new URL(trimmed);
      const q = u.searchParams.get("room");
      if (q && /^[a-zA-Z0-9_-]{4,32}$/.test(q)) return q;
    }
  } catch {
    // fall through
  }
  const match = trimmed.match(/^[a-zA-Z0-9_-]{4,32}$/);
  return match ? match[0] : null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function idOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 && v.length < 200 ? v : null;
}

function normalizePick(raw: unknown): MonthPick {
  const r = asRecord(raw);
  if (!r) return { name: "", caption: "", imageId: null, stickerColor: null };
  return {
    name: str(r["name"], LIMITS.pickName),
    caption: str(r["caption"], LIMITS.caption),
    imageId: idOrNull(r["imageId"]),
    stickerColor: isHexColor(r["stickerColor"]) ? r["stickerColor"] : null,
  };
}

function normalizeCategory(raw: unknown, id: string, index: number): Category {
  const r = asRecord(raw) ?? {};
  const rawMonths = Array.isArray(r["months"])
    ? r["months"]
    : asRecord(r["months"])
      ? Array.from({ length: MONTH_COUNT }, (_, m) => (r["months"] as Record<string, unknown>)[String(m)])
      : [];
  const badgeMode: BadgeMode = r["badgeMode"] === "category" ? "category" : "rainbow";
  const fallbackColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length]?.hex ?? "#FFB3D1";
  return {
    id,
    name: str(r["name"], LIMITS.categoryName),
    quote: str(r["quote"], LIMITS.quote),
    color: isHexColor(r["color"]) ? r["color"] : fallbackColor,
    coverImageId: idOrNull(r["coverImageId"]),
    badgeMode,
    months: Array.from({ length: MONTH_COUNT }, (_, m) => normalizePick(rawMonths[m])),
  };
}

export function roomRecordToYearData(
  raw: unknown,
): { yearData: YearData; images: Record<string, string>; updatedAt: number } | null {
  const r = asRecord(raw);
  if (!r) return null;
  const rawYear = Number(r["year"]);
  const year = isValidYear(rawYear) ? rawYear : new Date().getFullYear();
  const title = str(r["title"], LIMITS.title);
  const rawUpdatedAt = Number(r["updatedAt"]);
  const updatedAt = Number.isFinite(rawUpdatedAt) && rawUpdatedAt > 0 ? rawUpdatedAt : Date.now();
  const rawCats = asRecord(r["categories"]) ?? {};
  const rawOrder = Array.isArray(r["categoryOrder"])
    ? r["categoryOrder"].filter((x): x is string => typeof x === "string")
    : Object.keys(rawCats);

  const seen = new Set<string>();
  const categories: Category[] = [];
  rawOrder.forEach((id, idx) => {
    if (!id || seen.has(id) || !rawCats[id]) return;
    seen.add(id);
    categories.push(normalizeCategory(rawCats[id], id, idx));
  });
  Object.keys(rawCats).forEach((id, idx) => {
    if (seen.has(id)) return;
    seen.add(id);
    categories.push(normalizeCategory(rawCats[id], id, categories.length + idx));
  });

  const rawImages = asRecord(r["images"]) ?? {};
  const images: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawImages)) {
    if (typeof v === "string" && v.startsWith("data:image/")) {
      images[k] = v;
    }
  }

  return {
    yearData: {
      year,
      title,
      author: "",
      categories,
    },
    images,
    updatedAt,
  };
}

async function rtdbRequest<T = unknown>(
  url: string,
  method: "GET" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const init: RequestInit =
    body === undefined
      ? { method, cache: "no-store" }
      : {
          method,
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        };

  let res: Response | null = null;
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(url, init);
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  if (!res) {
    throw new Error(
      lastErr instanceof Error && lastErr.message !== "Load failed"
        ? lastErr.message
        : "네트워크 연결이 잠시 끊겼어요. 다시 시도해 주세요.",
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new Error("Firebase 데이터베이스 접근 권한이 없어요. 보안 규칙(Rules)을 확인해 주세요.");
    }
    throw new Error(`서버 요청 실패 (${res.status})${text ? `: ${text.slice(0, 80)}` : ""}`);
  }
  if (method === "DELETE") return undefined as T;
  return (await res.json()) as T;
}

export async function createRoom(
  dbUrl: string,
  year: number = new Date().getFullYear(),
): Promise<{ roomId: string; yearData: YearData }> {
  const roomId = generateRoomId();
  const def = createDefaultState(year);
  const y = def.years[0]!;
  const firstCat = y.categories[0] ?? {
    id: uid(),
    name: "",
    quote: "",
    color: CATEGORY_COLORS[0]!.hex,
    coverImageId: null,
    badgeMode: "rainbow" as const,
    months: emptyMonths(),
  };

  const payload: RoomRecord = {
    version: 1,
    year: y.year,
    title: "",
    categoryOrder: [firstCat.id],
    categories: { [firstCat.id]: firstCat },
    images: {},
    updatedAt: Date.now(),
  };

  await rtdbRequest(`${dbUrl}/rooms/${roomId}.json`, "PUT", payload);
  // Increment cumulative room counter (best-effort; never blocks room creation)
  void rtdbRequest(`${dbUrl}/total.json`, "PUT", { ".sv": { increment: 1 } }).catch(() => undefined);
  return {
    roomId,
    yearData: { year: y.year, title: "", author: "", categories: [firstCat] },
  };
}

export async function deleteRoom(dbUrl: string, roomId: string): Promise<void> {
  await rtdbRequest(`${dbUrl}/rooms/${roomId}.json`, "DELETE");
}

export function collectYearImageIds(yearData: YearData): string[] {
  const ids = new Set<string>();
  for (const c of yearData.categories) {
    if (c.coverImageId) ids.add(c.coverImageId);
    for (const p of c.months) {
      if (p.imageId) ids.add(p.imageId);
    }
  }
  return [...ids];
}

export async function fetchRoomMeta(
  dbUrl: string,
  roomId: string,
): Promise<{ yearData: YearData; updatedAt: number } | null> {
  const base = `${dbUrl}/rooms/${roomId}`;
  const [year, title, categoryOrder, categories, updatedAt] = await Promise.all([
    rtdbRequest<unknown>(`${base}/year.json`, "GET"),
    rtdbRequest<unknown>(`${base}/title.json`, "GET"),
    rtdbRequest<unknown>(`${base}/categoryOrder.json`, "GET"),
    rtdbRequest<unknown>(`${base}/categories.json`, "GET"),
    rtdbRequest<unknown>(`${base}/updatedAt.json`, "GET"),
  ]);
  if (year === null && categories === null && updatedAt === null) return null;
  const parsed = roomRecordToYearData({ year, title, categoryOrder, categories, updatedAt });
  if (!parsed) return null;
  return { yearData: parsed.yearData, updatedAt: parsed.updatedAt };
}

export async function fetchMissingImages(
  dbUrl: string,
  roomId: string,
  ids: string[],
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const entries = await Promise.all(
    ids.map(async (id) => {
      try {
        const data = await rtdbRequest<unknown>(
          `${dbUrl}/rooms/${roomId}/images/${encodeURIComponent(id)}.json`,
          "GET",
        );
        if (typeof data === "string" && data.startsWith("data:image/")) {
          return [id, data] as const;
        }
      } catch {
        // skip failed individual image
      }
      return null;
    }),
  );
  const out: Record<string, string> = {};
  for (const e of entries) {
    if (e) out[e[0]] = e[1];
  }
  return out;
}

export async function fetchRoom(
  dbUrl: string,
  roomId: string,
  cachedImages: Record<string, string> = {},
): Promise<{
  yearData: YearData;
  images: Record<string, string>;
  newlyFetchedImages: Record<string, string>;
  updatedAt: number;
} | null> {
  const meta = await fetchRoomMeta(dbUrl, roomId);
  if (!meta) return null;
  if (isRoomExpired(meta.updatedAt)) {
    await deleteRoom(dbUrl, roomId).catch(() => undefined);
    throw new Error("마지막 수정 후 24시간이 지나 자동으로 삭제된 방이에요.");
  }
  const neededIds = collectYearImageIds(meta.yearData);
  const missingIds = neededIds.filter((id) => !cachedImages[id]);
  const newlyFetchedImages = await fetchMissingImages(dbUrl, roomId, missingIds);
  const images: Record<string, string> = {};
  for (const id of neededIds) {
    const data = newlyFetchedImages[id] ?? cachedImages[id];
    if (data) images[id] = data;
  }
  return { yearData: meta.yearData, images, newlyFetchedImages, updatedAt: meta.updatedAt };
}

export async function uploadRoomImage(
  dbUrl: string,
  roomId: string,
  imageId: string,
  dataUrl: string,
): Promise<void> {
  await rtdbRequest(`${dbUrl}/rooms/${roomId}.json`, "PATCH", {
    [`images/${imageId}`]: dataUrl,
    updatedAt: Date.now(),
  });
}

/**
 * Compute minimal diff between previous and next YearData and write only changed paths
 * so concurrent edits by different participants don't overwrite each other.
 */
export async function syncYearDiff(
  dbUrl: string,
  roomId: string,
  prev: YearData,
  next: YearData,
): Promise<void> {
  const base = `${dbUrl}/rooms/${roomId}`;
  const ops: Promise<unknown>[] = [];

  const rootPatch: Record<string, unknown> = { updatedAt: Date.now() };
  let hasRootPatch = false;

  if (prev.title !== next.title) {
    rootPatch["title"] = next.title;
    hasRootPatch = true;
  }
  if (prev.year !== next.year) {
    rootPatch["year"] = next.year;
    hasRootPatch = true;
  }

  const prevOrder = prev.categories.map((c) => c.id);
  const nextOrder = next.categories.map((c) => c.id);
  if (JSON.stringify(prevOrder) !== JSON.stringify(nextOrder)) {
    rootPatch["categoryOrder"] = nextOrder;
    hasRootPatch = true;
  }

  const prevMap = new Map(prev.categories.map((c) => [c.id, c]));
  const nextMap = new Map(next.categories.map((c) => [c.id, c]));

  // Deleted categories
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) {
      ops.push(rtdbRequest(`${base}/categories/${encodeURIComponent(id)}.json`, "DELETE"));
    }
  }

  // Added or updated categories
  for (const [id, nextCat] of nextMap.entries()) {
    const prevCat = prevMap.get(id);
    if (!prevCat) {
      ops.push(rtdbRequest(`${base}/categories/${encodeURIComponent(id)}.json`, "PUT", nextCat));
      continue;
    }

    const catPatch: Record<string, unknown> = {};
    let hasCatPatch = false;
    if (prevCat.name !== nextCat.name) {
      catPatch["name"] = nextCat.name;
      hasCatPatch = true;
    }
    if (prevCat.quote !== nextCat.quote) {
      catPatch["quote"] = nextCat.quote;
      hasCatPatch = true;
    }
    if (prevCat.color !== nextCat.color) {
      catPatch["color"] = nextCat.color;
      hasCatPatch = true;
    }
    if (prevCat.coverImageId !== nextCat.coverImageId) {
      catPatch["coverImageId"] = nextCat.coverImageId;
      hasCatPatch = true;
    }
    if (prevCat.badgeMode !== nextCat.badgeMode) {
      catPatch["badgeMode"] = nextCat.badgeMode;
      hasCatPatch = true;
    }

    if (hasCatPatch) {
      ops.push(
        rtdbRequest(`${base}/categories/${encodeURIComponent(id)}.json`, "PATCH", catPatch),
      );
    }

    for (let m = 0; m < MONTH_COUNT; m++) {
      const pMonth = prevCat.months[m];
      const nMonth = nextCat.months[m];
      if (JSON.stringify(pMonth) !== JSON.stringify(nMonth)) {
        ops.push(
          rtdbRequest(
            `${base}/categories/${encodeURIComponent(id)}/months/${m}.json`,
            "PUT",
            nMonth,
          ),
        );
      }
    }
  }

  if (hasRootPatch || ops.length > 0) {
    ops.push(rtdbRequest(`${base}.json`, "PATCH", rootPatch));
  }

  await Promise.all(ops);
}

/** Apply an incoming Firebase RTDB SSE event ("put" or "patch") onto a raw RoomRecord object. */
export function applyRtdbEvent(
  currentRaw: Record<string, unknown>,
  path: string,
  data: unknown,
): Record<string, unknown> {
  if (path === "/" || path === "") {
    return asRecord(data) ? { ...(data as Record<string, unknown>) } : {};
  }
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return currentRaw;

  const clone: Record<string, unknown> = JSON.parse(JSON.stringify(currentRaw)) as Record<string, unknown>;
  let cursor: Record<string, unknown> | unknown[] = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    if (Array.isArray(cursor)) {
      const idx = Number(key);
      if (!cursor[idx] || typeof cursor[idx] !== "object") cursor[idx] = {};
      cursor = cursor[idx] as Record<string, unknown>;
    } else {
      if (!cursor[key] || typeof cursor[key] !== "object") {
        // Check if next key is numeric (like months/0)
        cursor[key] = {};
      }
      cursor = cursor[key] as Record<string, unknown>;
    }
  }

  const lastKey = parts[parts.length - 1]!;
  if (data === null) {
    if (Array.isArray(cursor)) {
      cursor[Number(lastKey)] = null;
    } else {
      delete cursor[lastKey];
    }
  } else if (
    typeof data === "object" &&
    !Array.isArray(data) &&
    !Array.isArray(cursor) &&
    cursor[lastKey] &&
    typeof cursor[lastKey] === "object" &&
    !Array.isArray(cursor[lastKey])
  ) {
    // Merge for patch/nested updates
    cursor[lastKey] = { ...(cursor[lastKey] as Record<string, unknown>), ...(data as Record<string, unknown>) };
  } else {
    if (Array.isArray(cursor)) {
      cursor[Number(lastKey)] = data;
    } else {
      cursor[lastKey] = data;
    }
  }
  return clone;
}

export function subscribeRoom(
  dbUrl: string,
  roomId: string,
  initialUpdatedAt: number,
  getKnownImageIds: () => Set<string>,
  onData: (parsed: { yearData: YearData; images: Record<string, string>; updatedAt: number }) => void,
  onStatus: (status: "connected" | "reconnecting" | "error") => void,
): () => void {
  let lastSeenUpdatedAt = initialUpdatedAt;
  let closed = false;
  let fetching = false;
  let pendingRefresh = false;
  let es: EventSource | null = null;
  let pollTimer: number | null = null;

  const stopPolling = () => {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const refreshFromServer = async () => {
    if (closed) return;
    if (fetching) {
      pendingRefresh = true;
      return;
    }
    fetching = true;
    try {
      const meta = await fetchRoomMeta(dbUrl, roomId);
      if (closed) return;
      if (!meta) {
        onStatus("error");
        return;
      }
      lastSeenUpdatedAt = Math.max(lastSeenUpdatedAt, meta.updatedAt);
      const known = getKnownImageIds();
      const missingIds = collectYearImageIds(meta.yearData).filter((id) => !known.has(id));
      const newImages = await fetchMissingImages(dbUrl, roomId, missingIds);
      if (closed) return;
      onStatus("connected");
      onData({ yearData: meta.yearData, images: newImages, updatedAt: meta.updatedAt });
    } catch {
      if (!closed) onStatus("reconnecting");
    } finally {
      fetching = false;
      if (pendingRefresh && !closed) {
        pendingRefresh = false;
        void refreshFromServer();
      }
    }
  };

  const handleTimestamp = (rawTs: unknown) => {
    if (rawTs === null) {
      onStatus("error");
      return;
    }
    const ts = Number(rawTs);
    if (!Number.isFinite(ts) || ts <= 0) return;
    onStatus("connected");
    if (ts > lastSeenUpdatedAt) {
      lastSeenUpdatedAt = ts;
      void refreshFromServer();
    }
  };

  const startPollingFallback = () => {
    if (pollTimer !== null || closed) return;
    pollTimer = window.setInterval(() => {
      if (closed || document.visibilityState === "hidden") return;
      void rtdbRequest<unknown>(`${dbUrl}/rooms/${roomId}/updatedAt.json`, "GET")
        .then((res) => {
          if (!closed) handleTimestamp(res);
        })
        .catch(() => {
          if (!closed) onStatus("reconnecting");
        });
    }, 12_000);
  };

  if (typeof EventSource !== "undefined") {
    // Subscribe ONLY to the 13-byte updatedAt timestamp — never re-download images on reconnect.
    es = new EventSource(`${dbUrl}/rooms/${roomId}/updatedAt.json`);
    es.addEventListener("put", (e) => {
      try {
        const payload = JSON.parse((e as MessageEvent<string>).data) as { data?: unknown };
        handleTimestamp(payload.data);
      } catch {
        // ignore malformed event
      }
    });
    es.onopen = () => {
      if (closed) return;
      stopPolling();
      onStatus("connected");
    };
    es.onerror = () => {
      if (closed) return;
      onStatus("reconnecting");
      startPollingFallback();
    };
  } else {
    startPollingFallback();
  }

  return () => {
    closed = true;
    es?.close();
    stopPolling();
  };
}
