export interface Swatch {
  hex: string;
  label: string;
}

/** Category accent colours (stored as hex in user data so the poster canvas can use them). */
export const CATEGORY_COLORS: Swatch[] = [
  { hex: "#FFB3D1", label: "핑크" },
  { hex: "#FF9C82", label: "코랄" },
  { hex: "#FFF07A", label: "레몬" },
  { hex: "#9FEBC9", label: "민트" },
  { hex: "#A9D4FF", label: "스카이" },
  { hex: "#C9B2FF", label: "라일락" },
  { hex: "#FFD3A8", label: "피치" },
  { hex: "#D9F27E", label: "라임" },
];

export const STICKER_COLORS: Swatch[] = [
  { hex: "#FFFFFF", label: "화이트" },
  ...CATEGORY_COLORS,
  { hex: "#1B1A22", label: "블랙" },
];

/** One colour per month for the rainbow month badges. */
export const RAINBOW: string[] = [
  "#FFB3D1",
  "#FF9C82",
  "#FFD3A8",
  "#FFF07A",
  "#D9F27E",
  "#9FEBC9",
  "#8FE3E8",
  "#A9D4FF",
  "#B9C2FF",
  "#C9B2FF",
  "#F0B5FF",
  "#FFC2C2",
];

function parseHex(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return [255, 255, 255];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mix a hex colour with white. amount=0 → original, 1 → white. */
export function tint(hex: string, amount: number): string {
  const [r, g, b] = parseHex(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function isDarkColor(hex: string): boolean {
  const [r, g, b] = parseHex(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b < 110;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}
