import { collectPosterText, drawPoster, layoutPoster, safeScale, type PosterLayout } from "./poster";
import { ensurePosterFonts } from "./fonts";
import type { ThemeId, YearData } from "./types";

interface Entry {
  src: string;
  img: HTMLImageElement;
  ready: boolean;
  promise: Promise<HTMLImageElement | null>;
}
const cache = new Map<string, Entry>();

function entryFor(id: string, src: string): Entry {
  const existing = cache.get(id);
  if (existing && existing.src === src) return existing;
  const img = new Image();
  if (/^https?:\/\//i.test(src)) img.crossOrigin = "anonymous";
  const entry: Entry = {
    src,
    img,
    ready: false,
    promise: Promise.resolve(null),
  };
  entry.promise = new Promise((resolve) => {
    img.onload = () => {
      entry.ready = true;
      resolve(img);
    };
    img.onerror = () => resolve(null);
  });
  img.src = src;
  cache.set(id, entry);
  return entry;
}

/** Synchronous lookup for the live preview; calls onLoad once a pending image becomes drawable. */
export function getPreviewImage(
  id: string,
  images: Record<string, string>,
  onLoad: () => void,
): HTMLImageElement | null {
  const src = images[id];
  if (!src) return null;
  const e = entryFor(id, src);
  if (e.ready) return e.img;
  void e.promise.then((r) => r && onLoad());
  return null;
}

export function imageIdsForYear(year: YearData): string[] {
  const ids = new Set<string>();
  for (const c of year.categories) {
    if (c.coverImageId) ids.add(c.coverImageId);
    for (const p of c.months) if (p.imageId) ids.add(p.imageId);
  }
  return [...ids];
}

let measureCanvas: HTMLCanvasElement | null = null;
export function measureLayout(year: YearData, theme: ThemeId): PosterLayout {
  measureCanvas ??= document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");
  return layoutPoster(ctx, year, theme);
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), "image/png");
    } catch {
      resolve(null);
    }
  });
}

async function dataUrlToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  try {
    const url = canvas.toDataURL("image/png");
    const res = await fetch(url);
    return await res.blob();
  } catch {
    return null;
  }
}

export async function renderPosterBlob(
  year: YearData,
  theme: ThemeId,
  images: Record<string, string>,
): Promise<{ blob: Blob; width: number; height: number }> {
  await ensurePosterFonts(collectPosterText(year), year.font ?? "default", year.customFontCss);
  const loaded = new Map<string, HTMLImageElement>();
  await Promise.all(
    imageIdsForYear(year).map(async (id) => {
      const src = images[id];
      if (!src) return;
      const img = await entryFor(id, src).promise;
      if (img) loaded.set(id, img);
    }),
  );
  const layout = measureLayout(year, theme);
  // Try high resolution first, then step down if the device runs out of canvas memory.
  for (const desired of [2.4, 1.6, 1]) {
    const scale = safeScale(layout.width, layout.height, desired);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(layout.width * scale);
    canvas.height = Math.round(layout.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.scale(scale, scale);
    ctx.imageSmoothingQuality = "high";
    drawPoster(ctx, layout, year, theme, (id) => loaded.get(id) ?? null);
    const blob = (await toBlob(canvas)) ?? (await dataUrlToBlob(canvas));
    // release canvas memory early (Safari)
    const w = canvas.width;
    const h = canvas.height;
    canvas.width = 0;
    canvas.height = 0;
    if (blob && blob.size > 0) return { blob, width: w, height: h };
  }
  throw new Error("이미지를 만들지 못했어요. 사진 수를 줄이거나 다른 브라우저에서 시도해 주세요.");
}
