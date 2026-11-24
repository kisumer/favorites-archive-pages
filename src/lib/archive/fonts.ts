import "./poster-title-font.css";

export const FONT_SANS =
  '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif';
export const FONT_SERIF = '"Noto Serif KR", "Nanum Myeongjo", AppleMyungjo, "Batang", serif';

const TITLE_FAMILY = "Cafe24 PRO Slim Fit";
export const FONT_POSTER_TITLE = `"${TITLE_FAMILY}", ${FONT_SANS}`;

const loaded = new Set<string>();

/**
 * Canvas only draws web fonts that are already loaded. Ask the browser to load
 * exactly the glyph subsets this poster uses before drawing.
 * Returns true when it actually loaded something new (caller may redraw).
 */
export async function ensurePosterFonts(text: string): Promise<boolean> {
  if (typeof document === "undefined" || !("fonts" in document)) return false;
  const chars = Array.from(new Set(`${text}0123456789月월년최애아카이브연말결산 ★·byMYFAVORITESARCHIVE`))
    .sort()
    .join("");
  if (loaded.has(chars)) return false;
  const specs = [
    `900 40px "Pretendard Variable"`,
    `800 40px "Pretendard Variable"`,
    `700 40px "Pretendard Variable"`,
    `600 40px "Pretendard Variable"`,
    `900 40px "Noto Serif KR"`,
    `700 40px "Noto Serif KR"`,
  ];
  await document.fonts.load(`400 40px "${TITLE_FAMILY}"`, chars).catch(() => []);
  try {
    await Promise.race([
      Promise.all(specs.map((s) => document.fonts.load(s, chars).catch(() => []))),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
  } catch {
    // fall back to system fonts
  }
  loaded.add(chars);
  return true;
}
