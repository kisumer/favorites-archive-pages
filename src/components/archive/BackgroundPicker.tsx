import { Check, Highlighter, Palette, Plus } from "lucide-react";
import { useId, type ReactNode } from "react";

import {
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_POSTER_BG,
  HIGHLIGHT_COLORS,
  isDarkColor,
  POSTER_BG_COLORS,
  POSTER_DOT_COLORS,
  type Swatch,
} from "@/lib/archive/palette";
import type { PosterBgPattern } from "@/lib/archive/types";
import { cn } from "@/lib/utils";

export interface BackgroundPatch {
  bgColor?: string;
  bgPattern?: PosterBgPattern;
  bgDotColor?: string | undefined;
  titleHighlightColor?: string | undefined;
}

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

const swatchClass =
  "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--border-soft)] transition-transform touch-manipulation active:scale-95";
const selectedRing = "ring-[1.5px] ring-[var(--ink-black)] ring-offset-2 ring-offset-white";

/** Row of preset swatches + a custom colour picker. `active` undefined = nothing selected. */
function ColorRow({
  swatches,
  active,
  onPick,
  groupLabel,
  itemLabel,
  leading,
}: {
  swatches: Swatch[];
  active: string | undefined;
  onPick: (hex: string) => void;
  groupLabel: string;
  itemLabel: string;
  leading?: ReactNode;
}) {
  const inputId = useId();
  const isCustom = active !== undefined && !swatches.some((c) => c.hex.toUpperCase() === active);
  return (
    <div className="flex items-center justify-between gap-1.5" role="group" aria-label={groupLabel}>
      {leading}
      {swatches.map((swatch) => {
        const selected = active === swatch.hex.toUpperCase();
        return (
          <button
            key={swatch.hex}
            type="button"
            title={swatch.label}
            aria-label={`${itemLabel} ${swatch.label}`}
            aria-pressed={selected}
            onClick={() => onPick(swatch.hex)}
            style={{ backgroundColor: swatch.hex }}
            className={cn(swatchClass, selected && selectedRing)}
          >
            {selected ? (
              <Check
                className={cn("h-4 w-4 stroke-[3]", isDarkColor(swatch.hex) ? "text-white" : "text-ink")}
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}

      <label
        htmlFor={inputId}
        title={`직접 ${itemLabel} 고르기`}
        aria-label={`직접 ${itemLabel} 고르기`}
        style={{
          background: isCustom
            ? active
            : "conic-gradient(from 0deg, #ff7eb3, #ffe066, #7bed9f, #70a1ff, #c5a3ff, #ff7eb3)",
        }}
        className={cn(swatchClass, "cursor-pointer", isCustom && selectedRing)}
      >
        <input
          id={inputId}
          type="color"
          value={active ?? "#FFFFFF"}
          onChange={(e) => onPick(e.target.value.toUpperCase())}
          className="sr-only"
        />
        {isCustom ? (
          <Check
            className={cn("h-4 w-4 stroke-[3]", isDarkColor(active ?? "#FFFFFF") ? "text-white" : "text-ink")}
            aria-hidden="true"
          />
        ) : null}
        <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--ink-black)] shadow-xs">
          <Plus className="h-2.5 w-2.5 stroke-[2.5]" aria-hidden="true" />
        </span>
      </label>
    </div>
  );
}

export function BackgroundPicker({
  bgColor,
  bgPattern,
  bgDotColor,
  titleHighlightColor,
  onChange,
}: {
  bgColor?: string | undefined;
  bgPattern?: PosterBgPattern | undefined;
  bgDotColor?: string | undefined;
  titleHighlightColor?: string | undefined;
  onChange: (patch: BackgroundPatch) => void;
}) {
  const activeColor = (bgColor ?? DEFAULT_POSTER_BG).toUpperCase();
  const activePattern: PosterBgPattern = bgPattern === "dots" ? "dots" : "solid";
  const activeDot = bgDotColor ? bgDotColor.toUpperCase() : undefined;
  const isHighlightNone = titleHighlightColor === "none";
  const activeHighlight = isHighlightNone
    ? undefined
    : (titleHighlightColor ?? DEFAULT_HIGHLIGHT_COLOR).toUpperCase();
  const isCustomColor = !POSTER_BG_COLORS.some((c) => c.hex.toUpperCase() === activeColor);
  const isCustomDot = activeDot !== undefined && !POSTER_DOT_COLORS.some((c) => c.hex.toUpperCase() === activeDot);
  const isCustomHighlight =
    activeHighlight !== undefined && !HIGHLIGHT_COLORS.some((c) => c.hex.toUpperCase() === activeHighlight);

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[13px] font-bold">
          <Palette className="h-3.5 w-3.5" aria-hidden="true" />
          포스터 배경
        </span>
        {isCustomColor ? (
          <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{activeColor}</span>
        ) : null}
      </div>

      {/* Row 1: background colour */}
      <ColorRow
        swatches={POSTER_BG_COLORS}
        active={activeColor}
        onPick={(hex) => onChange({ bgColor: hex })}
        groupLabel="포스터 배경색 선택"
        itemLabel="배경색"
      />

      {/* Row 2: Solid / Dots segmented toggle */}
      <div
        className="mt-2.5 grid grid-cols-2 rounded-full border border-[var(--border-soft)] bg-[var(--bg-input)] p-1"
        role="group"
        aria-label="배경 패턴 선택"
      >
        <button
          type="button"
          aria-pressed={activePattern === "solid"}
          onClick={() => onChange({ bgPattern: "solid" })}
          className={cn(
            "h-8 rounded-full text-[13px] font-bold transition-colors touch-manipulation",
            activePattern === "solid"
              ? "bg-[var(--ink-black)] text-white"
              : "text-[var(--ink-muted)] hover:text-[var(--ink-black)]",
          )}
        >
          단색
        </button>
        <button
          type="button"
          aria-pressed={activePattern === "dots"}
          onClick={() => onChange({ bgPattern: "dots" })}
          className={cn(
            "inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-[13px] font-bold transition-colors touch-manipulation",
            activePattern === "dots"
              ? "bg-[var(--ink-black)] text-white"
              : "text-[var(--ink-muted)] hover:text-[var(--ink-black)]",
          )}
        >
          도트
          <DotsIcon />
        </button>
      </div>

      {/* Row 3: dot colour (only for the dots pattern) */}
      {activePattern === "dots" ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[13px] font-bold">
              <DotsIcon />
              도트 색
            </span>
            {isCustomDot ? (
              <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{activeDot}</span>
            ) : null}
          </div>
          <ColorRow
            swatches={POSTER_DOT_COLORS}
            active={activeDot}
            onPick={(hex) => onChange({ bgDotColor: hex })}
            groupLabel="도트 색 선택"
            itemLabel="도트 색"
            leading={
              <button
                type="button"
                title="배경색에 맞춰 자동"
                aria-label="도트 색 자동"
                aria-pressed={activeDot === undefined}
                onClick={() => onChange({ bgDotColor: undefined })}
                className={cn(
                  swatchClass,
                  "bg-card text-[10px] font-black text-ink",
                  activeDot === undefined && selectedRing,
                )}
              >
                자동
              </button>
            }
          />
        </div>
      ) : null}

      {/* Row 4: title highlighter colour */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[13px] font-bold">
            <Highlighter className="h-3.5 w-3.5" aria-hidden="true" />
            제목 형광펜 색
          </span>
          {isCustomHighlight ? (
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{activeHighlight}</span>
          ) : null}
        </div>
        <ColorRow
          swatches={HIGHLIGHT_COLORS}
          active={activeHighlight}
          onPick={(hex) => onChange({ titleHighlightColor: hex })}
          groupLabel="제목 형광펜 색 선택"
          itemLabel="형광펜 색"
          leading={
            <button
              type="button"
              title="형광펜 없음"
              aria-label="형광펜 없음"
              aria-pressed={isHighlightNone}
              onClick={() => onChange({ titleHighlightColor: "none" })}
              className={cn(
                swatchClass,
                "bg-card text-[10px] font-black text-ink",
                isHighlightNone && selectedRing,
              )}
            >
              없음
            </button>
          }
        />
      </div>
    </div>
  );
}
