export type ThemeId = "kitsch" | "editorial";
export type BadgeMode = "rainbow" | "category";

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
  categories: Category[];
}

export interface ArchiveState {
  version: 1;
  currentYear: number;
  theme: ThemeId;
  years: YearData[];
}

export type Result = { ok: true; state: ArchiveState } | { ok: false; error: string };
