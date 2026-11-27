import { MAX_CUSTOM_FONT_CSS, normalizePosterFont, sanitizeCustomFontCss } from "./fonts";
import { CATEGORY_COLORS, isHexColor } from "./palette";
import type {
  ArchiveState,
  BadgeMode,
  Category,
  MonthPick,
  Result,
  ThemeId,
  YearData,
} from "./types";

export const MONTH_COUNT = 12;

// Preserve archives created before the six-person limit.
const LEGACY_CATEGORY_LIMIT = 20;

export const LIMITS = {
  categories: 6,
  categoryName: 16,
  quote: 60,
  pickName: 20,
  caption: 28,
  title: 30,
  author: 20,
} as const;

export function uid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function monthLabel(month: number): string {
  return `${month + 1}月`;
}

export function emptyPick(): MonthPick {
  return { name: "", caption: "", imageId: null, stickerColor: null };
}

export function emptyMonths(): MonthPick[] {
  return Array.from({ length: MONTH_COUNT }, () => emptyPick());
}

export function isPickEmpty(p: MonthPick | undefined): boolean {
  return !p || (!p.name.trim() && !p.caption.trim() && !p.imageId);
}

function colorAt(i: number): string {
  return CATEGORY_COLORS[i % CATEGORY_COLORS.length]?.hex ?? "#FFB3D1";
}

export function createCategory(name: string, color: string): Category {
  return {
    id: uid(),
    name,
    quote: "",
    color,
    coverImageId: null,
    badgeMode: "rainbow",
    months: emptyMonths(),
  };
}

export function seedCategories(): Category[] {
  return [createCategory("", colorAt(0))];
}

export function createYear(year: number, categories: Category[] = seedCategories()): YearData {
  return { year, title: "", author: "", categories };
}

export function createDefaultState(year: number = new Date().getFullYear()): ArchiveState {
  const y = isValidYear(year) ? year : 2026;
  return { version: 1, currentYear: y, theme: "kitsch", years: [createYear(y)] };
}

export function isValidYear(n: number): boolean {
  return Number.isInteger(n) && n >= 1000 && n <= 9999;
}

export function parseYearInput(
  input: string,
): { ok: true; year: number } | { ok: false; error: string } {
  const t = input.trim();
  if (!t) return { ok: false, error: "연도를 입력해 주세요." };
  if (!/^\d{4}$/.test(t)) return { ok: false, error: "연도는 숫자 4자리로 입력해 주세요. (예: 2027)" };
  const year = Number(t);
  if (!isValidYear(year)) return { ok: false, error: "1000년부터 9999년까지만 만들 수 있어요." };
  return { ok: true, year };
}

export function getYear(state: ArchiveState, year: number = state.currentYear): YearData | undefined {
  return state.years.find((y) => y.year === year);
}

function sortYears(years: YearData[]): YearData[] {
  return [...years].sort((a, b) => a.year - b.year);
}

function mapYear(state: ArchiveState, year: number, fn: (y: YearData) => YearData): ArchiveState {
  return { ...state, years: state.years.map((y) => (y.year === year ? fn(y) : y)) };
}

function mapCategory(
  state: ArchiveState,
  year: number,
  categoryId: string,
  fn: (c: Category) => Category,
): ArchiveState {
  return mapYear(state, year, (y) => ({
    ...y,
    categories: y.categories.map((c) => (c.id === categoryId ? fn(c) : c)),
  }));
}

function findCategory(state: ArchiveState, year: number, categoryId: string): Category | undefined {
  return getYear(state, year)?.categories.find((c) => c.id === categoryId);
}

function validMonth(month: number): boolean {
  return Number.isInteger(month) && month >= 0 && month < MONTH_COUNT;
}

/** New year: optionally copies category name/quote/colour/cover from another year, never the monthly picks. */
export function addYear(
  state: ArchiveState,
  year: number,
  opts: { copyFrom?: number | null } = {},
): Result {
  if (!isValidYear(year)) return { ok: false, error: "1000년부터 9999년까지만 만들 수 있어요." };
  if (getYear(state, year)) return { ok: false, error: `${year}년은 이미 있어요.` };
  let categories: Category[];
  const source = opts.copyFrom != null ? getYear(state, opts.copyFrom) : undefined;
  if (source && source.categories.length > 0) {
    categories = source.categories.slice(0, LIMITS.categories).map((c) => ({
      ...c,
      id: uid(),
      months: emptyMonths(),
    }));
  } else {
    categories = seedCategories();
  }
  const newYear: YearData = {
    year,
    title: "",
    author: source?.author ?? "",
    categories,
  };
  return {
    ok: true,
    state: { ...state, currentYear: year, years: sortYears([...state.years, newYear]) },
  };
}

export function setCurrentYear(state: ArchiveState, year: number): Result {
  if (!getYear(state, year)) return { ok: false, error: "해당 연도를 찾을 수 없어요." };
  return { ok: true, state: { ...state, currentYear: year } };
}

export function deleteYear(state: ArchiveState, year: number): Result {
  if (!getYear(state, year)) return { ok: false, error: "해당 연도를 찾을 수 없어요." };
  if (state.years.length <= 1) return { ok: false, error: "연도는 최소 하나는 남아 있어야 해요." };
  const years = state.years.filter((y) => y.year !== year);
  let currentYear = state.currentYear;
  if (currentYear === year) {
    const nearest = [...years].sort((a, b) => Math.abs(a.year - year) - Math.abs(b.year - year))[0];
    currentYear = nearest?.year ?? years[0]!.year;
  }
  return { ok: true, state: { ...state, years, currentYear } };
}

export function updateYearMeta(
  state: ArchiveState,
  year: number,
  patch: Partial<Pick<YearData, "title" | "author" | "font" | "customFontCss" | "bgColor" | "bgPattern" | "bgDotColor">>,
): Result {
  if (!getYear(state, year)) return { ok: false, error: "해당 연도를 찾을 수 없어요." };
  return { ok: true, state: mapYear(state, year, (y) => ({ ...y, ...patch })) };
}

export function addParticipant(state: ArchiveState, year: number): Result {
  const current = getYear(state, year);
  if (!current) return { ok: false, error: "해당 연도를 찾을 수 없어요." };
  const coauthors = current.coauthors ?? [];
  return { ok: true, state: mapYear(state, year, (y) => ({ ...y, coauthors: [...coauthors, ""] })) };
}

export function updateParticipant(state: ArchiveState, year: number, index: number, name: string): Result {
  if (index === 0) return updateYearMeta(state, year, { author: name.slice(0, LIMITS.author) });
  const coauthors = getYear(state, year)?.coauthors ?? [];
  if (!Number.isInteger(index) || index < 1 || index > coauthors.length)
    return { ok: false, error: "참여자를 찾을 수 없어요." };
  return {
    ok: true,
    state: mapYear(state, year, (y) => ({
      ...y,
      coauthors: coauthors.map((value, i) => i === index - 1 ? name.slice(0, LIMITS.author) : value),
    })),
  };
}

export function deleteParticipant(state: ArchiveState, year: number, index: number): Result {
  const current = getYear(state, year);
  if (!current) return { ok: false, error: "해당 연도를 찾을 수 없어요." };
  const names = [current.author, ...(current.coauthors ?? [])];
  if (names.length === 1) return { ok: false, error: "참여자는 최소 한 명이 필요해요." };
  if (!Number.isInteger(index) || index < 0 || index >= names.length)
    return { ok: false, error: "참여자를 찾을 수 없어요." };
  const [author = "", ...coauthors] = names.filter((_, i) => i !== index);
  return { ok: true, state: mapYear(state, year, (y) => ({ ...y, author, coauthors })) };
}

export function setTheme(state: ArchiveState, theme: ThemeId): Result {
  return { ok: true, state: { ...state, theme } };
}

export function addCategory(
  state: ArchiveState,
  year: number,
  name?: string,
): { ok: true; state: ArchiveState; id: string } | { ok: false; error: string } {
  const y = getYear(state, year);
  if (!y) return { ok: false, error: "해당 연도를 찾을 수 없어요." };
  if (y.categories.length >= LIMITS.categories)
    return { ok: false, error: `참여 인원은 최대 ${LIMITS.categories}명까지 추가할 수 있어요.` };
  const cat = createCategory(name?.trim() ?? "", colorAt(y.categories.length));
  return {
    ok: true,
    id: cat.id,
    state: mapYear(state, year, (yy) => ({ ...yy, categories: [...yy.categories, cat] })),
  };
}

export function updateCategory(
  state: ArchiveState,
  year: number,
  categoryId: string,
  patch: Partial<Pick<Category, "name" | "quote" | "color" | "coverImageId" | "badgeMode">>,
): Result {
  if (!findCategory(state, year, categoryId)) return { ok: false, error: "참여자를 찾을 수 없어요." };
  return { ok: true, state: mapCategory(state, year, categoryId, (c) => ({ ...c, ...patch })) };
}

export function deleteCategory(state: ArchiveState, year: number, categoryId: string): Result {
  if (!findCategory(state, year, categoryId)) return { ok: false, error: "참여자를 찾을 수 없어요." };
  if (getYear(state, year)?.categories.length === 1)
    return { ok: false, error: "참여자는 최소 한 명이 필요해요." };
  return {
    ok: true,
    state: mapYear(state, year, (y) => ({
      ...y,
      categories: y.categories.filter((c) => c.id !== categoryId),
    })),
  };
}

export function moveCategory(
  state: ArchiveState,
  year: number,
  categoryId: string,
  direction: -1 | 1,
): Result {
  const y = getYear(state, year);
  if (!y) return { ok: false, error: "해당 연도를 찾을 수 없어요." };
  const idx = y.categories.findIndex((c) => c.id === categoryId);
  if (idx < 0) return { ok: false, error: "참여자를 찾을 수 없어요." };
  const target = idx + direction;
  if (target < 0 || target >= y.categories.length)
    return { ok: false, error: direction < 0 ? "이미 맨 위예요." : "이미 맨 아래예요." };
  const cats = [...y.categories];
  const [moved] = cats.splice(idx, 1);
  cats.splice(target, 0, moved!);
  return { ok: true, state: mapYear(state, year, (yy) => ({ ...yy, categories: cats })) };
}

export function updatePick(
  state: ArchiveState,
  year: number,
  categoryId: string,
  month: number,
  patch: Partial<MonthPick>,
): Result {
  if (!validMonth(month)) return { ok: false, error: "1月부터 12月까지만 있어요." };
  if (!findCategory(state, year, categoryId)) return { ok: false, error: "참여자를 찾을 수 없어요." };
  return {
    ok: true,
    state: mapCategory(state, year, categoryId, (c) => ({
      ...c,
      months: c.months.map((p, i) => (i === month ? { ...p, ...patch } : p)),
    })),
  };
}

export function clearPick(state: ArchiveState, year: number, categoryId: string, month: number): Result {
  return updatePick(state, year, categoryId, month, emptyPick());
}

export function copyFromPreviousMonth(
  state: ArchiveState,
  year: number,
  categoryId: string,
  month: number,
): Result {
  if (!validMonth(month)) return { ok: false, error: "1月부터 12月까지만 있어요." };
  if (month === 0) return { ok: false, error: "1月은 지난달이 없어요." };
  const cat = findCategory(state, year, categoryId);
  if (!cat) return { ok: false, error: "참여자를 찾을 수 없어요." };
  const prev = cat.months[month - 1];
  if (isPickEmpty(prev)) return { ok: false, error: `${monthLabel(month - 1)}이 비어 있어서 복사할 게 없어요.` };
  return updatePick(state, year, categoryId, month, { ...prev! });
}

export function monthRange(start: number, end: number): number[] {
  const a = Math.max(0, Math.min(start, end));
  const b = Math.min(MONTH_COUNT - 1, Math.max(start, end));
  const out: number[] = [];
  for (let m = a; m <= b; m++) out.push(m);
  return out;
}

/** Paste one month's pick (name, photo, caption, sticker colour) into several months. */
export function pastePickToMonths(
  state: ArchiveState,
  year: number,
  categoryId: string,
  sourceMonth: number,
  targets: number[],
): Result {
  if (!validMonth(sourceMonth)) return { ok: false, error: "1月부터 12月까지만 있어요." };
  const cat = findCategory(state, year, categoryId);
  if (!cat) return { ok: false, error: "참여자를 찾을 수 없어요." };
  const src = cat.months[sourceMonth];
  if (isPickEmpty(src)) return { ok: false, error: "붙여넣을 내용이 없어요. 먼저 이 달을 채워 주세요." };
  const set = new Set(targets.filter((m) => validMonth(m) && m !== sourceMonth));
  if (set.size === 0) return { ok: false, error: "붙여넣을 달을 골라 주세요." };
  return {
    ok: true,
    state: mapCategory(state, year, categoryId, (c) => ({
      ...c,
      months: c.months.map((p, i) => (set.has(i) ? { ...src! } : p)),
    })),
  };
}

export function collectImageIds(state: ArchiveState): Set<string> {
  const ids = new Set<string>();
  for (const y of state.years) {
    for (const c of y.categories) {
      if (c.coverImageId) ids.add(c.coverImageId);
      for (const p of c.months) if (p.imageId) ids.add(p.imageId);
    }
  }
  return ids;
}

// ---------- tolerant parsing of saved / imported data ----------

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function idOrNull(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 && v.length < 200 ? v : null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function normalizePick(raw: unknown): MonthPick {
  const r = asRecord(raw);
  if (!r) return emptyPick();
  return {
    name: str(r["name"], LIMITS.pickName),
    caption: str(r["caption"], LIMITS.caption),
    imageId: idOrNull(r["imageId"]),
    stickerColor: isHexColor(r["stickerColor"]) ? r["stickerColor"] : null,
  };
}

function normalizeCategory(raw: unknown, i: number): Category | null {
  const r = asRecord(raw);
  if (!r) return null;
  const months = Array.isArray(r["months"]) ? r["months"] : [];
  const badgeMode: BadgeMode = r["badgeMode"] === "category" ? "category" : "rainbow";
  return {
    id: typeof r["id"] === "string" && r["id"] ? r["id"] : uid(),
    name: str(r["name"], LIMITS.categoryName),
    quote: str(r["quote"], LIMITS.quote),
    color: isHexColor(r["color"]) ? r["color"] : colorAt(i),
    coverImageId: idOrNull(r["coverImageId"]),
    badgeMode,
    months: Array.from({ length: MONTH_COUNT }, (_, m) => normalizePick(months[m])),
  };
}

export function normalizeState(raw: unknown): ArchiveState | null {
  const r = asRecord(raw);
  if (!r || !Array.isArray(r["years"])) return null;
  const seen = new Set<number>();
  const years: YearData[] = [];
  for (const yr of r["years"]) {
    const y = asRecord(yr);
    if (!y) continue;
    const year = Number(y["year"]);
    if (!isValidYear(year) || seen.has(year)) continue;
    seen.add(year);
    const cats = Array.isArray(y["categories"]) ? y["categories"] : [];
    const ids = new Set<string>();
    const categories: Category[] = [];
    cats.slice(0, LEGACY_CATEGORY_LIMIT).forEach((c, i) => {
      const n = normalizeCategory(c, i);
      if (!n) return;
      if (ids.has(n.id)) n.id = uid();
      ids.add(n.id);
      categories.push(n);
    });
    const coauthors = Array.isArray(y["coauthors"])
      ? y["coauthors"].map((name) => str(name, LIMITS.author))
      : [];
    const font = y["font"] ? normalizePosterFont(y["font"]) : undefined;
    const customFontCss =
      typeof y["customFontCss"] === "string"
        ? sanitizeCustomFontCss(y["customFontCss"].slice(0, MAX_CUSTOM_FONT_CSS))
        : "";
    const bgColor = isHexColor(y["bgColor"]) ? y["bgColor"].toUpperCase() : undefined;
    const bgPattern = y["bgPattern"] === "dots" ? "dots" : undefined;
    const bgDotColor = isHexColor(y["bgDotColor"]) ? y["bgDotColor"].toUpperCase() : undefined;
    years.push({
      year,
      title: str(y["title"], LIMITS.title),
      author: str(y["author"], LIMITS.author),
      ...(coauthors.length ? { coauthors } : {}),
      ...(font && font !== "default" ? { font } : {}),
      ...(customFontCss ? { customFontCss } : {}),
      ...(bgColor ? { bgColor } : {}),
      ...(bgPattern ? { bgPattern } : {}),
      ...(bgDotColor ? { bgDotColor } : {}),
      categories,
    });
  }
  if (years.length === 0) return null;
  const sorted = sortYears(years);
  const cy = Number(r["currentYear"]);
  const theme: ThemeId = r["theme"] === "editorial" ? "editorial" : "kitsch";
  return {
    version: 1,
    theme,
    currentYear: seen.has(cy) ? cy : sorted[sorted.length - 1]!.year,
    years: sorted,
  };
}
