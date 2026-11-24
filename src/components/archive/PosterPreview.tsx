import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { ensurePosterFonts } from "@/lib/archive/fonts";
import { collectPosterText, drawPoster, hitTest, type PosterLayout } from "@/lib/archive/poster";
import { getPreviewImage, measureLayout } from "@/lib/archive/render";
import type { ThemeId, YearData } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

interface Props {
  year: YearData;
  theme: ThemeId;
  images: Record<string, string>;
  onPick?: (categoryId: string, month: number | null) => void;
  className?: string;
  label?: string;
}

/** Live poster preview — draws with the exact same renderer as the PNG export. */
export function PosterPreview({ year, theme, images, onPick, className, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<PosterLayout | null>(null);
  const [width, setWidth] = useState(0);
  const [tick, setTick] = useState(0);
  const [cssHeight, setCssHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWidth(Math.floor(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const text = collectPosterText(year);
  useEffect(() => {
    let alive = true;
    void ensurePosterFonts(text).then((changed) => {
      if (alive && changed) setTick((t) => t + 1);
    });
    return () => {
      alive = false;
    };
  }, [text]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0) return;
    const raf = requestAnimationFrame(() => {
      const layout = measureLayout(year, theme);
      layoutRef.current = layout;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      let pxW = Math.round(width * dpr);
      let pxH = Math.round((layout.height * pxW) / layout.width);
      const maxArea = 12_000_000;
      if (pxW * pxH > maxArea) {
        const k = Math.sqrt(maxArea / (pxW * pxH));
        pxW = Math.round(pxW * k);
        pxH = Math.round(pxH * k);
      }
      if (canvas.width !== pxW) canvas.width = pxW;
      if (canvas.height !== pxH) canvas.height = pxH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const s = pxW / layout.width;
      ctx.setTransform(s, 0, 0, s, 0, 0);
      ctx.imageSmoothingQuality = "high";
      drawPoster(ctx, layout, year, theme, (id) =>
        getPreviewImage(id, images, () => setTick((t) => t + 1)),
      );
      setCssHeight((layout.height * width) / layout.width);
    });
    return () => cancelAnimationFrame(raf);
  }, [year, theme, images, width, tick]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const L = layoutRef.current;
    const canvas = canvasRef.current;
    if (!onPick || !L || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * L.width;
    const y = ((e.clientY - rect.top) / rect.height) * L.height;
    const hit = hitTest(L, x, y);
    if (hit) onPick(hit.categoryId, hit.month);
  };

  return (
    <div ref={wrapRef} className={cn("w-full", className)}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        role="img"
        aria-label={label ?? `${year.year}년 최애 취향표 미리보기`}
        className={cn("block w-full", onPick && "cursor-pointer")}
        style={cssHeight ? { height: cssHeight } : { aspectRatio: "1400 / 1000" }}
      />
    </div>
  );
}
