import { Check } from "lucide-react";

import type { Swatch } from "@/lib/archive/palette";
import { isDarkColor } from "@/lib/archive/palette";
import { cn } from "@/lib/utils";

export function ColorSwatches({
  label,
  value,
  options,
  onChange,
  allowNone,
  noneLabel = "기본",
}: {
  label: string;
  value: string | null;
  options: Swatch[];
  onChange: (hex: string | null) => void;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {allowNone ? (
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          onClick={() => onChange(null)}
          className={cn(
            "h-9 rounded-full border-2 px-3 text-xs font-bold transition-transform touch-manipulation",
            value === null ? "border-ink bg-ink text-paper" : "border-input bg-card hover:border-ink",
          )}
        >
          {noneLabel}
        </button>
      ) : null}
      {options.map((s) => {
        const selected = value?.toLowerCase() === s.hex.toLowerCase();
        return (
          <button
            key={s.hex}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={s.label}
            title={s.label}
            onClick={() => onChange(s.hex)}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border-2 border-ink transition-transform touch-manipulation",
              selected ? "scale-110 shadow-pop" : "hover:scale-105",
            )}
            style={{ backgroundColor: s.hex }}
          >
            {selected ? (
              <Check
                className={cn("h-4 w-4", isDarkColor(s.hex) ? "text-paper" : "text-ink")}
                strokeWidth={3}
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
