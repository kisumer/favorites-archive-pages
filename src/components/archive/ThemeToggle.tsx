import { setTheme } from "@/lib/archive/model";
import type { ThemeId } from "@/lib/archive/types";
import { cn } from "@/lib/utils";
import { useArchive } from "./ArchiveProvider";

const OPTIONS: { id: ThemeId; label: string }[] = [
  { id: "kitsch", label: "원본 키치" },
  { id: "editorial", label: "심플 에디토리얼" },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { state, apply } = useArchive();
  return (
    <div
      role="radiogroup"
      aria-label="포스터 디자인"
      className={cn("inline-flex rounded-full border-2 border-ink bg-card p-0.5", className)}
    >
      {OPTIONS.map((o) => {
        const active = state.theme === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => apply((s) => setTheme(s, o.id))}
            className={cn(
              "h-8 rounded-full px-3 text-[12px] font-black transition-colors touch-manipulation",
              active ? "bg-ink text-paper" : "text-ink hover:bg-paper-deep",
              o.id === "editorial" && "font-serif",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
