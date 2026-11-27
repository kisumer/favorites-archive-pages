import { Check, Palette, Plus } from "lucide-react";
import { useId } from "react";

import { DEFAULT_POSTER_BG, isDarkColor, POSTER_BG_COLORS } from "@/lib/archive/palette";
import type { PosterBgPattern } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

function DotsIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <circle cx="4.5" cy="4.5" r="2" fill="currentColor" />
      <circle cx="11.5" cy="4.5" r="2" fill="currentColor" />
      <circle cx="8" cy="8.5" r="2" fill="currentColor" />
      <circle cx="4.5" cy="12" r="2" fill="currentColor" />
      <circle cx="11.5" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function BackgroundPicker({
  bgColor,
  bgPattern,
  onChange,
}: {
  bgColor?: string | undefined;
  bgPattern?: PosterBgPattern | undefined;
  onChange: (patch: { bgColor?: string; bgPattern?: PosterBgPattern }) => void;
}) {
  const colorId = useId();
  const activeColor = (bgColor ?? DEFAULT_POSTER_BG).toUpperCase();
  const activePattern: PosterBgPattern = bgPattern === "dots" ? "dots" : "solid";
  const isCustomColor = !POSTER_BG_COLORS.some((c) => c.hex.toUpperCase() === activeColor);

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[13px] font-bold">
          <Palette className="h-3.5 w-3.5" aria-hidden="true" />
          포스터 배경
        </span>
        {isCustomColor ? (
          <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
            {activeColor}
          </span>
        ) : null}
      </div>

      {/* Row 1: Swatches + Rainbow Color Picker */}
      <div className="flex items-center justify-between gap-1.5" role="group" aria-label="포스터 배경색 선택">
        {POSTER_BG_COLORS.map((swatch) => {
          const selected = activeColor === swatch.hex.toUpperCase();
          const dark = isDarkColor(swatch.hex);
          return (
            <button
              key={swatch.hex}
              type="button"
              title={swatch.label}
              aria-label={`배경색 ${swatch.label}`}
              aria-pressed={selected}
              onClick={() => onChange({ bgColor: swatch.hex })}
              style={{ backgroundColor: swatch.hex }}
              className={cn(
                "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink transition-transform touch-manipulation active:scale-95",
                selected && "ring-2 ring-ink ring-offset-2 ring-offset-card",
              )}
            >
              {selected ? (
                <Check
                  className={cn("h-4 w-4 stroke-[3]", dark ? "text-white" : "text-ink")}
                  aria-hidden="true"
                />
              ) : null}
            </button>
          );
        })}

        <label
          htmlFor={colorId}
          title="직접 배경색 고르기"
          aria-label="직접 배경색 고르기"
          style={{
            background: isCustomColor
              ? activeColor
              : "conic-gradient(from 0deg, #ff7eb3, #ffe066, #7bed9f, #70a1ff, #c5a3ff, #ff7eb3)",
          }}
          className={cn(
            "relative grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-ink transition-transform touch-manipulation active:scale-95",
            isCustomColor && "ring-2 ring-ink ring-offset-2 ring-offset-card",
          )}
        >
          <input
            id={colorId}
            type="color"
            value={activeColor}
            onChange={(e) => onChange({ bgColor: e.target.value.toUpperCase() })}
            className="sr-only"
          />
          {isCustomColor ? (
            <Check
              className={cn("h-4 w-4 stroke-[3]", isDarkColor(activeColor) ? "text-white" : "text-ink")}
              aria-hidden="true"
            />
          ) : null}
          <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border-[1.5px] border-ink bg-white text-ink">
            <Plus className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
          </span>
        </label>
      </div>

      {/* Row 2: Solid / Dots segmented toggle */}
      <div
        className="mt-2.5 grid grid-cols-2 rounded-full border-2 border-ink bg-card p-0.5"
        role="group"
        aria-label="배경 패턴 선택"
      >
        <button
          type="button"
          aria-pressed={activePattern === "solid"}
          onClick={() => onChange({ bgPattern: "solid" })}
          className={cn(
            "h-9 rounded-full text-[13px] font-black transition-colors touch-manipulation",
            activePattern === "solid" ? "bg-ink text-paper" : "text-ink hover:bg-paper-deep",
          )}
        >
          단색
        </button>
        <button
          type="button"
          aria-pressed={activePattern === "dots"}
          onClick={() => onChange({ bgPattern: "dots" })}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-1.5 rounded-full text-[13px] font-black transition-colors touch-manipulation",
            activePattern === "dots" ? "bg-ink text-paper" : "text-ink hover:bg-paper-deep",
          )}
        >
          도트
          <DotsIcon />
        </button>
      </div>
    </div>
  );
}
