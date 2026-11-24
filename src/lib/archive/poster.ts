/**
 * The poster renderer. The live preview and the PNG export both call drawPoster(),
 * so what you see is exactly what you download.
 */
import { FONT_SANS, FONT_SERIF } from "./fonts";
import { RAINBOW, isDarkColor, tint } from "./palette";
import type { Category, MonthPick, ThemeId, YearData } from "./types";

export const POSTER_W = 1400;
const PAD_X = 72;
const COVER = 232;
const GRID_X = PAD_X + COVER + 52;
const GRID_W = POSTER_W - PAD_X - GRID_X;
const GAP = 20;
export const CELL = (GRID_W - GAP * 5) / 6;
const BADGE_OVER = 18;
const ROW_SPACING = 76;

type Ctx = CanvasRenderingContext2D;
export type ImageGetter = (id: string) => CanvasImageSource | null;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface CellLayout {
  month: number;
  rect: Rect;
}
export interface CategoryLayout {
  id: string;
  top: number;
  bottom: number;
  cover: Rect;
  name: Rect;
  nameText: string;
  nameSize: number;
  bubble: Rect | null;
  quoteLines: string[];
  cells: CellLayout[];
  hasCaption: boolean;
}
export interface PosterLayout {
  width: number;
  height: number;
  kickerY: number;
  title: string;
  titleY: number;
  titleSize: number;
  authorY: number;
  authorLines: string[];
  categories: CategoryLayout[];
  emptyY: number | null;
  footerY: number;
}

interface Style {
  paper: string;
  ink: string;
  muted: string;
  display: string;
  coverRadius: number;
  cardRadius: number;
  stroke: number;
}

const INK = "#1B1A22";
const STYLES: Record<ThemeId, Style> = {
  kitsch: {
    paper: "#fafafa",
    ink: INK,
    muted: "#77717F",
    display: FONT_SANS,
    coverRadius: 30,
    cardRadius: 22,
    stroke: 3,
  },
  editorial: {
    paper: "#f2f2f2",
    ink: INK,
    muted: "#6d6d6d",
    display: FONT_SERIF,
    coverRadius: 6,
    cardRadius: 4,
    stroke: 1.5,
  },
};

const font = (weight: number, size: number, family = FONT_SANS) => `${weight} ${size}px ${family}`;

export function defaultTitle(year: YearData): string {
  return year.title.trim() || `${year.year} 최애 연말결산`;
}

function participantNames(year: YearData): string {
  return [year.author, ...(year.coauthors ?? [])].map((name) => name.trim()).filter(Boolean).join(", ");
}

export function collectPosterText(year: YearData): string {
  const parts = [defaultTitle(year), participantNames(year), String(year.year), "@mieryint"];
  for (const c of year.categories) {
    parts.push(c.name, c.quote);
    for (const p of c.months) parts.push(p.name, p.caption);
  }
  return parts.join("");
}

// ---------- text helpers ----------

function ellipsize(ctx: Ctx, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  const chars = Array.from(text);
  while (chars.length > 0 && ctx.measureText(`${chars.join("")}…`).width > maxW) chars.pop();
  return `${chars.join("")}…`;
}

export function wrapText(ctx: Ctx, text: string, maxW: number, maxLines: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split(/\n/);
  outer: for (const para of paragraphs) {
    const words = para.split(/(\s+)/).filter((w) => w.length > 0);
    let line = "";
    for (const word of words) {
      const candidate = line + word;
      if (ctx.measureText(candidate).width <= maxW) {
        line = candidate;
        continue;
      }
      if (line.trim()) {
        lines.push(line.trim());
        if (lines.length >= maxLines) break outer;
        line = "";
      }
      if (/^\s+$/.test(word)) continue;
      // break long words (Korean has no spaces in long phrases) character by character
      let chunk = "";
      for (const ch of Array.from(word)) {
        if (ctx.measureText(chunk + ch).width > maxW && chunk) {
          lines.push(chunk);
          if (lines.length >= maxLines) break outer;
          chunk = ch;
        } else chunk += ch;
      }
      line = chunk;
    }
    if (line.trim()) lines.push(line.trim());
    if (lines.length >= maxLines) break;
  }
  const consumed = lines.join("").replace(/\s/g, "").length;
  const total = text.replace(/\s/g, "").length;
  if (lines.length > 0 && consumed < total) {
    const last = lines.length - 1;
    lines[last] = ellipsize(ctx, `${lines[last]}…`, maxW);
  }
  return lines.slice(0, maxLines);
}

// ---------- shape helpers ----------

function roundRectPath(ctx: Ctx, r: Rect, radius: number) {
  const rad = Math.max(0, Math.min(radius, r.w / 2, r.h / 2));
  ctx.beginPath();
  ctx.moveTo(r.x + rad, r.y);
  ctx.lineTo(r.x + r.w - rad, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + rad, rad);
  ctx.lineTo(r.x + r.w, r.y + r.h - rad);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x + r.w - rad, r.y + r.h, rad);
  ctx.lineTo(r.x + rad, r.y + r.h);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y + r.h - rad, rad);
  ctx.lineTo(r.x, r.y + rad);
  ctx.arcTo(r.x, r.y, r.x + rad, r.y, rad);
  ctx.closePath();
}

function bubblePath(ctx: Ctx, r: Rect, radius: number, tailX: number, tailH: number) {
  const tw = 26;
  ctx.beginPath();
  ctx.moveTo(r.x + radius, r.y);
  ctx.lineTo(tailX - tw / 2, r.y);
  ctx.lineTo(tailX + 4, r.y - tailH);
  ctx.lineTo(tailX + tw / 2, r.y);
  ctx.lineTo(r.x + r.w - radius, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + radius, radius);
  ctx.lineTo(r.x + r.w, r.y + r.h - radius);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x + r.w - radius, r.y + r.h, radius);
  ctx.lineTo(r.x + radius, r.y + r.h);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y + r.h - radius, radius);
  ctx.lineTo(r.x, r.y + radius);
  ctx.arcTo(r.x, r.y, r.x + radius, r.y, radius);
  ctx.closePath();
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let a = seed || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function starburstPath(
  ctx: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  points: number,
  depth: number,
  seed: number,
) {
  const rand = seeded(seed);
  const n = points * 2;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2 + (rand() - 0.5) * 0.08;
    const outer = i % 2 === 0;
    const j = 1 + (rand() - 0.5) * (outer ? 0.14 : 0.06);
    const kx = (outer ? rx : Math.max(4, rx - depth)) * j;
    const ky = (outer ? ry : Math.max(4, ry - depth)) * j;
    const px = cx + Math.cos(a) * kx;
    const py = cy + Math.sin(a) * ky;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function sizeOf(img: CanvasImageSource): { w: number; h: number } {
  if (typeof HTMLImageElement !== "undefined" && img instanceof HTMLImageElement)
    return { w: img.naturalWidth, h: img.naturalHeight };
  const any = img as { width?: number | SVGAnimatedLength; height?: number | SVGAnimatedLength };
  return {
    w: typeof any.width === "number" ? any.width : 0,
    h: typeof any.height === "number" ? any.height : 0,
  };
}

function drawImageCover(ctx: Ctx, img: CanvasImageSource, r: Rect) {
  const { w, h } = sizeOf(img);
  if (!w || !h) return;
  const scale = Math.max(r.w / w, r.h / h);
  const sw = r.w / scale;
  const sh = r.h / scale;
  ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh, r.x, r.y, r.w, r.h);
}

function dotted(ctx: Ctx, width: number) {
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([0.01, width * 1.9]);
}

function solid(ctx: Ctx, width: number) {
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
}

// ---------- layout ----------

export function layoutPoster(ctx: Ctx, year: YearData, theme: ThemeId): PosterLayout {
  const st = STYLES[theme];
  let y = 76;
  const kickerY = y;
  if (theme === "editorial") y += 34 + 30;
  const title = defaultTitle(year);
  let titleSize = theme === "kitsch" ? 112 : 88;
  ctx.font = font(900, titleSize, st.display);
  while (ctx.measureText(title).width > POSTER_W - PAD_X * 2 - 32 && titleSize > 40) {
    titleSize -= 4;
    ctx.font = font(900, titleSize, st.display);
  }
  const titleY = y + titleSize / 2;
  y += titleSize + 20;
  const authorY = y + 14;
  const names = participantNames(year);
  ctx.font = font(600, 20);
  const authorLines = names ? wrapText(ctx, `by ${names}`, POSTER_W - PAD_X * 2, Infinity) : [];
  if (authorLines.length) y += 44 + (authorLines.length - 1) * 26;
  y += 64;

  const categories: CategoryLayout[] = [];
  for (const c of year.categories) {
    const top = y;
    const cover: Rect = { x: PAD_X, y: top + BADGE_OVER, w: COVER, h: COVER };
    const nameText = c.name.trim() || "이름 없음";
    let nameSize = theme === "kitsch" ? 24 : 26;
    const nameFamily = theme === "kitsch" ? FONT_SANS : FONT_SERIF;
    ctx.font = font(900, nameSize, nameFamily);
    const maxNameW = theme === "kitsch" ? COVER + 20 - 44 : COVER;
    while (ctx.measureText(nameText).width > maxNameW && nameSize > 15) {
      nameSize -= 1;
      ctx.font = font(900, nameSize, nameFamily);
    }
    let name: Rect;
    if (theme === "kitsch") {
      const w = Math.min(COVER + 20, ctx.measureText(nameText).width + 44);
      name = { x: cover.x + COVER / 2 - w / 2, y: cover.y + COVER - 22, w, h: 46 };
    } else {
      name = { x: PAD_X, y: cover.y + COVER + 14, w: COVER, h: 36 };
    }
    let leftBottom = name.y + name.h;
    let bubble: Rect | null = null;
    let quoteLines: string[] = [];
    if (c.quote.trim()) {
      ctx.font = theme === "kitsch" ? font(700, 17) : font(500, 16);
      quoteLines = wrapText(ctx, c.quote.trim(), COVER - 40, 4);
      const gap = theme === "kitsch" ? 24 : 12;
      bubble = { x: PAD_X, y: leftBottom + gap, w: COVER, h: quoteLines.length * 26 + 28 };
      leftBottom = bubble.y + bubble.h;
    }
    const hasCaption = c.months.some((p) => p.caption.trim().length > 0);
    const capH = hasCaption ? 28 : 0;
    const row0 = top + BADGE_OVER;
    const row1 = row0 + CELL + 36 + capH;
    const cells: CellLayout[] = [];
    for (let m = 0; m < 12; m++) {
      const r = Math.floor(m / 6);
      const col = m % 6;
      cells.push({
        month: m,
        rect: { x: GRID_X + col * (CELL + GAP), y: r === 0 ? row0 : row1, w: CELL, h: CELL },
      });
    }
    const gridBottom = row1 + CELL + 26 + capH;
    const bottom = Math.max(leftBottom, gridBottom);
    categories.push({
      id: c.id,
      top,
      bottom,
      cover,
      name,
      nameText,
      nameSize,
      bubble,
      quoteLines,
      cells,
      hasCaption,
    });
    y = bottom + ROW_SPACING;
  }
  let emptyY: number | null = null;
  if (categories.length === 0) {
    emptyY = y;
    y += 240 + ROW_SPACING;
  }
  const footerY = y - ROW_SPACING / 2 + 14;
  return {
    width: POSTER_W,
    height: Math.ceil(footerY + 64),
    kickerY,
    title,
    titleY,
    titleSize,
    authorY,
    authorLines,
    categories,
    emptyY,
    footerY,
  };
}

// ---------- drawing ----------

function drawHeader(ctx: Ctx, L: PosterLayout, year: YearData, theme: ThemeId) {
  const st = STYLES[theme];
  const cx = POSTER_W / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (theme === "kitsch") {
    ctx.font = font(900, L.titleSize, st.display);
    const tw = ctx.measureText(L.title).width;
    // highlighter swipe behind title
    ctx.save();
    ctx.fillStyle = "#FFB3D1";
    ctx.globalAlpha = 0.55;
    roundRectPath(
      ctx,
      { x: cx - tw / 2 - 14, y: L.titleY + L.titleSize * 0.08, w: tw + 28, h: L.titleSize * 0.36 },
      10,
    );
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = st.ink;
    ctx.fillText(L.title, cx, L.titleY);
  } else {
    ctx.strokeStyle = st.ink;
    solid(ctx, 1.5);
    ctx.beginPath();
    ctx.moveTo(PAD_X, L.kickerY + 4);
    ctx.lineTo(POSTER_W - PAD_X, L.kickerY + 4);
    ctx.stroke();
    ctx.font = font(700, 14);
    ctx.fillStyle = st.muted;
    ctx.fillText(`THE FAVORITES ARCHIVE  —  VOL. ${year.year}`, cx, L.kickerY + 30);
    ctx.font = font(900, L.titleSize, st.display);
    ctx.fillStyle = st.ink;
    ctx.fillText(L.title, cx, L.titleY);
  }
  if (L.authorLines.length) {
    ctx.font = font(600, 20);
    ctx.fillStyle = st.muted;
    L.authorLines.forEach((line, i) => ctx.fillText(line, cx, L.authorY + i * 26));
  }
}

function drawCover(
  ctx: Ctx,
  c: Category,
  CL: CategoryLayout,
  theme: ThemeId,
  getImage: ImageGetter,
) {
  const st = STYLES[theme];
  const r = CL.cover;
  if (theme === "kitsch") {
    roundRectPath(ctx, { ...r, x: r.x + 8, y: r.y + 8 }, st.coverRadius);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.strokeStyle = st.ink;
    solid(ctx, st.stroke);
    ctx.stroke();
  }
  const img = c.coverImageId ? getImage(c.coverImageId) : null;
  ctx.save();
  roundRectPath(ctx, r, st.coverRadius);
  ctx.fillStyle = theme === "kitsch" ? tint(c.color, 0.55) : "#e8e8e8";
  ctx.fill();
  ctx.clip();
  if (img) {
    drawImageCover(ctx, img, r);
  } else {
    const ccx = r.x + r.w / 2;
    const ccy = r.y + r.h / 2 - 10;
    if (theme === "kitsch") {
      starburstPath(ctx, ccx, ccy, 64, 64, 14, 16, hashString(c.id));
      ctx.fillStyle = c.color;
      ctx.fill();
      ctx.strokeStyle = st.ink;
      dotted(ctx, 3);
      ctx.stroke();
    }
    ctx.fillStyle = st.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(900, 54, theme === "kitsch" ? FONT_SANS : FONT_SERIF);
    ctx.fillText(Array.from(CL.nameText)[0] ?? "★", ccx, ccy + 2);
  }
  ctx.restore();
  roundRectPath(ctx, r, st.coverRadius);
  ctx.strokeStyle = st.ink;
  solid(ctx, theme === "kitsch" ? 3.5 : st.stroke);
  ctx.stroke();

  // name
  ctx.textBaseline = "middle";
  if (theme === "kitsch") {
    roundRectPath(ctx, CL.name, CL.name.h / 2);
    ctx.fillStyle = c.color;
    ctx.fill();
    ctx.strokeStyle = st.ink;
    solid(ctx, 3);
    ctx.stroke();
    ctx.fillStyle = isDarkColor(c.color) ? "#FFFFFF" : st.ink;
    ctx.textAlign = "center";
    ctx.font = font(900, CL.nameSize);
    ctx.fillText(CL.nameText, CL.name.x + CL.name.w / 2, CL.name.y + CL.name.h / 2 + 1);
  } else {
    ctx.fillStyle = st.ink;
    ctx.textAlign = "left";
    ctx.font = font(900, CL.nameSize, FONT_SERIF);
    ctx.fillText(CL.nameText, CL.name.x, CL.name.y + CL.name.h / 2);
  }

  // quote bubble
  if (CL.bubble) {
    const b = CL.bubble;
    if (theme === "kitsch") {
      bubblePath(ctx, b, 20, b.x + b.w / 2 - 20, 20);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = st.ink;
      solid(ctx, 2.5);
      ctx.setLineDash([9, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = st.ink;
      ctx.textAlign = "center";
      ctx.font = font(700, 17);
      CL.quoteLines.forEach((line, i) => {
        ctx.fillText(line, b.x + b.w / 2, b.y + 14 + 13 + i * 26);
      });
    } else {
      ctx.strokeStyle = st.ink;
      solid(ctx, 2);
      ctx.beginPath();
      ctx.moveTo(b.x + 1, b.y + 8);
      ctx.lineTo(b.x + 1, b.y + b.h - 8);
      ctx.stroke();
      ctx.fillStyle = st.muted;
      ctx.textAlign = "left";
      ctx.font = font(500, 16);
      CL.quoteLines.forEach((line, i) => {
        const text = `${i === 0 ? "“" : ""}${line}${i === CL.quoteLines.length - 1 ? "”" : ""}`;
        ctx.fillText(text, b.x + 16, b.y + 14 + 13 + i * 26);
      });
    }
  }
}

function drawCell(
  ctx: Ctx,
  c: Category,
  pick: MonthPick,
  cell: CellLayout,
  theme: ThemeId,
  getImage: ImageGetter,
) {
  const st = STYLES[theme];
  const r = cell.rect;
  const m = cell.month;
  const img = pick.imageId ? getImage(pick.imageId) : null;
  const named = pick.name.trim().length > 0;

  ctx.save();
  roundRectPath(ctx, r, st.cardRadius);
  if (theme === "kitsch") ctx.fillStyle = named ? tint(c.color, 0.45) : "#f1f1f1";
  else ctx.fillStyle = named ? "#e8e8e8" : "#eeeeee";
  ctx.fill();
  ctx.clip();
  if (img) {
    drawImageCover(ctx, img, r);
  } else {
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = st.ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(900, 64, theme === "kitsch" ? FONT_SANS : FONT_SERIF);
    ctx.fillText(String(m + 1).padStart(2, "0"), r.x + r.w / 2, r.y + r.h / 2 + 2);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  roundRectPath(ctx, r, st.cardRadius);
  ctx.strokeStyle = st.ink;
  solid(ctx, st.stroke);
  ctx.stroke();

  // month badge
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (theme === "kitsch") {
    const badge = c.badgeMode === "category" ? c.color : (RAINBOW[m] ?? c.color);
    ctx.beginPath();
    ctx.arc(r.x + 10, r.y + 10, 25, 0, Math.PI * 2);
    ctx.fillStyle = badge;
    ctx.fill();
    ctx.strokeStyle = st.ink;
    solid(ctx, 2.5);
    ctx.stroke();
    ctx.fillStyle = st.ink;
    ctx.font = font(900, 15);
    ctx.fillText(`${m + 1}월`, r.x + 10, r.y + 11);
  } else {
    ctx.beginPath();
    ctx.arc(r.x + 8, r.y + 8, 18, 0, Math.PI * 2);
    ctx.fillStyle = st.ink;
    ctx.fill();
    ctx.fillStyle = st.paper;
    ctx.font = font(700, 13);
    ctx.fillText(String(m + 1).padStart(2, "0"), r.x + 8, r.y + 9);
  }

  // name label
  if (named) {
    const color = pick.stickerColor ?? (theme === "kitsch" ? "#FFFFFF" : INK);
    const textColor = isDarkColor(color) ? "#FFFFFF" : st.ink;
    let size = theme === "kitsch" ? 16 : 14;
    const maxW = CELL * 1.02;
    ctx.font = font(800, size);
    let text = pick.name.trim();
    while (ctx.measureText(text).width > maxW - 40 && size > 11) {
      size -= 1;
      ctx.font = font(800, size);
    }
    text = ellipsize(ctx, text, maxW - 40);
    const tw = ctx.measureText(text).width;
    if (theme === "kitsch") {
      const w = Math.max(80, Math.min(maxW, tw + 44));
      const h = 52;
      const cx = r.x + r.w - w / 2 + 16;
      const cy = r.y + r.h - 2;
      const seed = hashString(`${c.id}-${m}`);
      const rot = ((seed % 100) / 100 - 0.5) * 0.14;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      starburstPath(ctx, 0, 0, w / 2, h / 2, Math.max(11, Math.round(w / 9)), 8, seed);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = st.ink;
      dotted(ctx, 2.6);
      ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.fillText(text, 0, 1);
      ctx.restore();
    } else {
      const w = tw + 22;
      const h = 28;
      const lr: Rect = { x: r.x + r.w - w + 8, y: r.y + r.h - h / 2 - 2, w, h };
      roundRectPath(ctx, lr, 2);
      ctx.fillStyle = color;
      ctx.fill();
      if (!isDarkColor(color)) {
        ctx.strokeStyle = st.ink;
        solid(ctx, 1.5);
        ctx.stroke();
      }
      ctx.fillStyle = textColor;
      ctx.fillText(text, lr.x + w / 2, lr.y + h / 2 + 1);
    }
  }

  if (pick.caption.trim()) {
    ctx.font = font(600, 13);
    ctx.fillStyle = st.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ellipsize(ctx, pick.caption.trim(), CELL + 10), r.x + r.w / 2, r.y + r.h + 40);
  }
}

export function drawPoster(
  ctx: Ctx,
  L: PosterLayout,
  year: YearData,
  theme: ThemeId,
  getImage: ImageGetter,
) {
  const st = STYLES[theme];
  ctx.fillStyle = "#fbfbfb";
  ctx.fillRect(0, 0, L.width, L.height);
  drawHeader(ctx, L, year, theme);

  L.categories.forEach((CL, i) => {
    const c = year.categories.find((cc) => cc.id === CL.id);
    if (!c) return;
    if (i > 0) {
      const dy = CL.top - ROW_SPACING / 2;
      ctx.strokeStyle = st.ink;
      ctx.globalAlpha = theme === "kitsch" ? 0.3 : 0.2;
      if (theme === "kitsch") dotted(ctx, 3);
      else solid(ctx, 1);
      ctx.beginPath();
      ctx.moveTo(PAD_X, dy);
      ctx.lineTo(POSTER_W - PAD_X, dy);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }
    drawCover(ctx, c, CL, theme, getImage);
    for (const cell of CL.cells) {
      const pick = c.months[cell.month];
      if (pick) drawCell(ctx, c, pick, cell, theme, getImage);
    }
  });

  if (L.emptyY != null) {
    const r: Rect = { x: PAD_X, y: L.emptyY, w: POSTER_W - PAD_X * 2, h: 240 };
    roundRectPath(ctx, r, theme === "kitsch" ? 28 : 4);
    ctx.strokeStyle = st.ink;
    ctx.globalAlpha = 0.4;
    solid(ctx, 2.5);
    ctx.setLineDash([10, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = st.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = font(800, 26);
    ctx.fillText("인원을 추가하면 여기에 채워져요", POSTER_W / 2, r.y + r.h / 2);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = font(700, 15);
  ctx.fillStyle = st.muted;
  ctx.fillText("@mieryint", POSTER_W / 2, L.footerY);
}

export function hitTest(
  L: PosterLayout,
  x: number,
  y: number,
): { categoryId: string; month: number | null } | null {
  for (const CL of L.categories) {
    if (y < CL.top - 10 || y > CL.bottom + 10) continue;
    for (const cell of CL.cells) {
      const r = cell.rect;
      if (x >= r.x - 12 && x <= r.x + r.w + 16 && y >= r.y - 12 && y <= r.y + r.h + 24)
        return { categoryId: CL.id, month: cell.month };
    }
    if (x <= PAD_X + COVER + 30) return { categoryId: CL.id, month: null };
  }
  return null;
}

/** Biggest scale that stays within mobile Safari's ~16.7M pixel canvas limit. */
export function safeScale(width: number, height: number, desired: number): number {
  const maxArea = 16_000_000;
  const byArea = Math.sqrt(maxArea / (width * height));
  const byDim = 16_000 / Math.max(width, height);
  return Math.max(0.25, Math.min(desired, byArea, byDim));
}
