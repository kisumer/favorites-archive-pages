import type { LucideIcon } from "lucide-react";
import { forwardRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const Panel = forwardRef<
  HTMLElement,
  {
    step: string;
    title: string;
    icon: LucideIcon;
    accentClassName?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
  }
>(function Panel({ step, title, icon: Icon, action, children, className }, ref) {
  return (
    <section
      ref={ref}
      aria-label={title}
      className={cn(
        "scroll-mt-24 rounded-[24px] border border-[var(--border-soft)] bg-[var(--bg-card)] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] sm:p-5",
        className,
      )}
    >
      <header className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-none bg-[var(--yellow-soft)] text-[var(--ink-black)]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.14em] text-[var(--ink-muted)]">{step}</p>
          <h2 className="truncate text-lg font-black leading-tight text-[var(--ink-black)]">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
});

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[13px] font-bold text-[var(--ink-black)]">
        {children}
      </label>
      {hint ? <span className="text-[11px] font-semibold text-[var(--ink-muted)]">{hint}</span> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-transparent bg-[var(--bg-input)] px-3.5 py-3 text-[16px] font-semibold text-[var(--ink-black)] placeholder:font-medium placeholder:text-[var(--ink-muted)]/75 transition-[background-color,border-color] duration-150 focus:border-[var(--ink-black)] focus:bg-white focus:outline-none";
