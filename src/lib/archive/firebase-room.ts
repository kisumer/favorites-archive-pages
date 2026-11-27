import { CATEGORY_COLORS, isHexColor } from "./palette";
import { createDefaultState, emptyMonths, isValidYear, LIMITS, MONTH_COUNT, uid } from "./model";
import type { BadgeMode, Category, MonthPick, YearData } from "./types";

const DB_URL_STORAGE_KEY = "choiae:together:dbUrl";
const RECENT_ROOMS_KEY = "choiae:together:recentRooms";

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

const DEFAULT_DB_URL = "https://favorite-archive-default-rtdb.firebaseio.com";

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

export function roomRecordToYearData(raw: unknown): { yearData: YearData; images: Record<string, string> } | null {
  const r = asRecord(raw);
  if (!r) return null;
  const rawYear = Number(r["year"]);
  const year = isValidYear(rawYear) ? rawYear : new Date().getFullYear();
  const title = str(r["title"], LIMITS.title);
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
  };
}

async function rtdbRequest<T = unknown>(
  url: string,
  method: "GET" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(
    url,
    body === undefined
      ? { method }
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
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
  return {
    roomId,
    yearData: { year: y.year, title: "", author: "", categories: [firstCat] },
  };
}

export async function fetchRoom(
  dbUrl: string,
  roomId: string,
): Promise<{ yearData: YearData; images: Record<string, string> } | null> {
  const raw = await rtdbRequest<unknown>(`${dbUrl}/rooms/${roomId}.json`, "GET");
  if (!raw) return null;
  return roomRecordToYearData(raw);
}

export async function uploadRoomImage(
  dbUrl: string,
  roomId: string,
  imageId: string,
  dataUrl: string,
): Promise<void> {
  await rtdbRequest(`${dbUrl}/rooms/${roomId}/images/${encodeURIComponent(imageId)}.json`, "PUT", dataUrl);
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

  if (hasRootPatch) {
    ops.push(rtdbRequest(`${base}.json`, "PATCH", rootPatch));
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

  const clone: Record<string, unknown> = structuredClone(currentRaw);
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
  onData: (parsed: { yearData: YearData; images: Record<string, string> }) => void,
  onStatus: (status: "connected" | "reconnecting" | "error") => void,
): () => void {
  let rawRoom: Record<string, unknown> = {};
  let closed = false;
  let es: EventSource | null = null;
  let pollTimer: number | null = null;

  const emit = () => {
    const parsed = roomRecordToYearData(rawRoom);
    if (parsed) onData(parsed);
  };

  const handleEvent = (type: "put" | "patch", rawData: string) => {
    try {
      const payload = JSON.parse(rawData) as { path?: string; data?: unknown };
      if (typeof payload.path !== "string") return;
      if (type === "put" && payload.path === "/" && payload.data === null) {
        onStatus("error");
        return;
      }
      if (type === "patch" && payload.data && typeof payload.data === "object") {
        // For patch, apply each key
        const prefix = payload.path === "/" ? "" : payload.path;
        for (const [k, v] of Object.entries(payload.data as Record<string, unknown>)) {
          rawRoom = applyRtdbEvent(rawRoom, `${prefix}/${k}`, v);
        }
      } else {
        rawRoom = applyRtdbEvent(rawRoom, payload.path, payload.data);
      }
      onStatus("connected");
      emit();
    } catch {
      // ignore malformed event
    }
  };

  const startPollingFallback = () => {
    if (pollTimer !== null || closed) return;
    pollTimer = window.setInterval(() => {
      if (closed) return;
      void rtdbRequest<Record<string, unknown> | null>(`${dbUrl}/rooms/${roomId}.json`, "GET")
        .then((res) => {
          if (closed || !res) return;
          rawRoom = res;
          onStatus("connected");
          emit();
        })
        .catch(() => {
          if (!closed) onStatus("reconnecting");
        });
    }, 4000);
  };

  if (typeof EventSource !== "undefined") {
    es = new EventSource(`${dbUrl}/rooms/${roomId}.json`);
    es.addEventListener("put", (e) => handleEvent("put", (e as MessageEvent<string>).data));
    es.addEventListener("patch", (e) => handleEvent("patch", (e as MessageEvent<string>).data));
    es.onopen = () => {
      if (!closed) onStatus("connected");
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
    if (pollTimer !== null) window.clearInterval(pollTimer);
  };
}
