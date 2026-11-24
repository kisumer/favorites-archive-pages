/** Downscale + crop uploads to a square JPEG data URL so storage stays small and canvas export never hits CORS. */
const MAX_FILE_BYTES = 40 * 1024 * 1024;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode"));
    img.src = src;
  });
}

export interface PhotoCrop {
  zoom: number;
  x: number;
  y: number;
}

export const DEFAULT_PHOTO_CROP: PhotoCrop = { zoom: 1, x: 0.5, y: 0.5 };

export function getPhotoCrop(width: number, height: number, crop: PhotoCrop) {
  const side = Math.min(width, height) / crop.zoom;
  return { side, left: (width - side) * crop.x, top: (height - side) * crop.y };
}

export function validatePhoto(file: File) {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 올릴 수 있어요.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("사진이 너무 커요. 40MB 이하의 사진을 골라 주세요.");
  }
}

export async function compressImage(file: File, crop: PhotoCrop = DEFAULT_PHOTO_CROP): Promise<string> {
  validatePhoto(file);
  const url = URL.createObjectURL(file);
  try {
    let img: HTMLImageElement;
    try {
      img = await loadImage(url);
    } catch {
      throw new Error("이 사진을 열 수 없어요. JPG나 PNG 사진으로 다시 시도해 주세요.");
    }
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const { side, left, top } = getPhotoCrop(w, h, crop);
    if (!side) throw new Error("사진 크기를 읽을 수 없어요.");
    const out = Math.max(1, Math.min(800, Math.round(side)));
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이 브라우저에서는 사진을 처리할 수 없어요.");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, out, out);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, left, top, side, side, 0, 0, out, out);
    const data = canvas.toDataURL("image/jpeg", 0.84);
    if (!data.startsWith("data:image/")) throw new Error("사진을 변환하지 못했어요.");
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}
