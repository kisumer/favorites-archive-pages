export type ThemeId = "kitsch" | "editorial";
export type BadgeMode = "rainbow" | "category";
export type PosterFontId = "default" | "serif" | "sans" | "pixel" | "custom";
export type PosterBgPattern = "solid" | "dots";

export interface MonthPick {
  name: string;
  caption: string;
  imageId: string | null;
  stickerColor: string | null;
}

export interface Category {
  id: string;
  name: string;
  quote: string;
  color: string;
  coverImageId: string | null;
  badgeMode: BadgeMode;
  months: MonthPick[];
}

export interface YearData {
  year: number;
  title: string;
  author: string;
  coauthors?: string[];
  font?: PosterFontId;
  customFontCss?: string;
  bgColor?: string;
  bgPattern?: PosterBgPattern;
  /** Dot colour for the "dots" pattern. Undefined = automatic (derived from bgColor). */
  bgDotColor?: string | undefined;
  categories: Category[];
}

export interface ArchiveState {
  version: 1;
  currentYear: number;
  theme: ThemeId;
  years: YearData[];
}

export type Result = { ok: true; state: ArchiveState } | { ok: false; error: string };
