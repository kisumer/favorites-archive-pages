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
            "h-9 rounded-full border px-3 text-xs font-bold transition-transform touch-manipulation active:scale-95",
            value === null
              ? "border-[var(--ink-black)] bg-[var(--ink-black)] text-white"
              : "border-[var(--border-soft)] bg-card text-ink hover:border-[var(--ink-black)]",
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
              "grid h-9 w-9 place-items-center rounded-full border border-[var(--border-soft)] transition-transform touch-manipulation active:scale-95",
              selected && "ring-[1.5px] ring-[var(--ink-black)] ring-offset-2 ring-offset-white",
            )}
            style={{ backgroundColor: s.hex }}
          >
            {selected ? (
              <Check
                className={cn("h-4 w-4", isDarkColor(s.hex) ? "text-white" : "text-ink")}
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
