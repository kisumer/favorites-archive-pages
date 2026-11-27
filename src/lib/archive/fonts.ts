import "./poster-title-font.css";
import type { PosterFontId } from "./types";

export const FONT_SANS =
  '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
export const FONT_SERIF = '"Noto Serif KR", "Nanum Myeongjo", AppleMyungjo, "Batang", serif';

export const FONT_PIXEL = '"Galmuri11", "Pretendard Variable", sans-serif';

const TITLE_FAMILY = "Cafe24 PRO Slim Fit";
export const FONT_POSTER_TITLE = `"${TITLE_FAMILY}", ${FONT_SANS}`;

export const MAX_CUSTOM_FONT_CSS = 1500;

export interface PosterFontOption {
  id: PosterFontId;
  label: string;
  displayFamily: string;
  bodyFamily: string;
  titleWeight: number;
  loadSpecs: string[];
}

export const POSTER_FONTS: readonly PosterFontOption[] = [
  {
    id: "default",
    label: "슬림핏",
    displayFamily: FONT_POSTER_TITLE,
    bodyFamily: FONT_SANS,
    titleWeight: 400,
    loadSpecs: [`400 40px "${TITLE_FAMILY}"`],
  },
  {
    id: "serif",
    label: "감성명조",
    displayFamily: FONT_SERIF,
    bodyFamily: FONT_SERIF,
    titleWeight: 900,
    loadSpecs: [`900 40px "Noto Serif KR"`, `700 40px "Noto Serif KR"`],
  },
  {
    id: "sans",
    label: "깔끔고딕",
    displayFamily: FONT_SANS,
    bodyFamily: FONT_SANS,
    titleWeight: 900,
    loadSpecs: [`900 40px "Pretendard Variable"`, `700 40px "Pretendard Variable"`],
  },
  {
    id: "pixel",
    label: "갈무리11",
    displayFamily: FONT_PIXEL,
    bodyFamily: FONT_PIXEL,
    titleWeight: 700,
    loadSpecs: [`700 40px "Galmuri11"`, `400 40px "Galmuri11"`],
  },
] as const;

const PRESET_MAP = new Map<PosterFontId, PosterFontOption>(POSTER_FONTS.map((f) => [f.id, f]));

export function normalizePosterFont(raw: unknown): PosterFontId {
  if (raw === "custom") return "custom";
  return typeof raw === "string" && PRESET_MAP.has(raw as PosterFontId)
    ? (raw as PosterFontId)
    : "default";
}

/** Extract only safe @font-face blocks from user-pasted CSS (e.g. Noonnu). */
export function sanitizeCustomFontCss(raw: string): string {
  const cleaned = raw.replace(/<\/?style[^>]*>/gi, "").trim();
  const blocks = cleaned.match(/@font-face\s*\{[^}]+\}/gi);
  if (!blocks || blocks.length === 0) return "";
  return blocks.join("\n").slice(0, MAX_CUSTOM_FONT_CSS);
}

/** Extract the first font-family name from a @font-face CSS block. */
export function parseCustomFontFamily(css: string): string | null {
  const match = css.match(/font-family\s*:\s*(?:'([^']+)'|"([^"]+)"|([^;}\n]+))/i);
  const name = (match?.[1] ?? match?.[2] ?? match?.[3] ?? "").trim();
  if (!name || name.length > 80) return null;
  return name.replace(/["'\\]/g, "");
}

const CUSTOM_STYLE_ID = "choiae-custom-poster-font";
let lastInjectedCss = "";

export function injectCustomFontCss(css: string): string | null {
  const safe = sanitizeCustomFontCss(css);
  if (!safe) return null;
  const family = parseCustomFontFamily(safe);
  if (!family) return null;
  if (typeof document !== "undefined" && safe !== lastInjectedCss) {
    let el = document.getElementById(CUSTOM_STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = CUSTOM_STYLE_ID;
      document.head.appendChild(el);
    }
    el.textContent = safe;
    lastInjectedCss = safe;
  }
  return family;
}

export function getPosterFont(id?: PosterFontId, customFontCss?: string): PosterFontOption {
  if (id === "custom" && customFontCss) {
    const family = parseCustomFontFamily(sanitizeCustomFontCss(customFontCss));
    if (family) {
      const quoted = `"${family}", ${FONT_SANS}`;
      return {
        id: "custom",
        label: family,
        displayFamily: quoted,
        bodyFamily: quoted,
        titleWeight: 700,
        loadSpecs: [`400 40px "${family}"`, `700 40px "${family}"`],
      };
    }
  }
  return PRESET_MAP.get(id ?? "default") ?? POSTER_FONTS[0]!;
}

const loaded = new Set<string>();

/**
 * Canvas only draws web fonts that are already loaded. Ask the browser to load
 * exactly the glyph subsets this poster uses before drawing.
 * Returns true when it actually loaded something new (caller may redraw).
 */
export async function ensurePosterFonts(
  text: string,
  fontId: PosterFontId = "default",
  customFontCss?: string,
): Promise<boolean> {
  if (typeof document === "undefined" || !("fonts" in document)) return false;
  if (fontId === "custom" && customFontCss) {
    injectCustomFontCss(customFontCss);
  }
  const opt = getPosterFont(fontId, customFontCss);
  const chars = Array.from(new Set(`${text}0123456789月월년최애아카이브연말결산 ★·byMYFAVORITESARCHIVE`))
    .sort()
    .join("");
  const cacheKey = `${opt.id}:${opt.label}:${chars}`;
  if (loaded.has(cacheKey)) return false;
  const specs = [
    ...opt.loadSpecs,
    `900 40px "Pretendard Variable"`,
    `800 40px "Pretendard Variable"`,
    `700 40px "Pretendard Variable"`,
    `600 40px "Pretendard Variable"`,
    `900 40px "Noto Serif KR"`,
    `700 40px "Noto Serif KR"`,
  ];
  try {
    await Promise.race([
      Promise.all(specs.map((s) => document.fonts.load(s, chars).catch(() => []))),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
  } catch {
    // fall back to system fonts
  }
  loaded.add(cacheKey);
  return true;
}
