import type { LucideIcon } from "lucide-react";
import { forwardRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const Panel = forwardRef<
  HTMLElement,
  {
    step: string;
    title: string;
    icon: LucideIcon;
    accentClassName: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
  }
>(function Panel({ step, title, icon: Icon, accentClassName, action, children, className }, ref) {
  return (
    <section
      ref={ref}
      aria-label={title}
      className={cn(
        "scroll-mt-24 rounded-3xl border-2 border-ink bg-card p-4 shadow-pop sm:p-5",
        className,
      )}
    >
      <header className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink",
            accentClassName,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black tracking-[0.16em] text-muted-foreground">{step}</p>
          <h2 className="truncate text-lg font-black leading-tight">{title}</h2>
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
      <label htmlFor={htmlFor} className="text-[13px] font-bold">
        {children}
      </label>
      {hint ? <span className="text-[11px] font-semibold text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border-2 border-input bg-card px-3.5 text-[16px] font-semibold placeholder:font-medium placeholder:text-muted-foreground/70 transition-colors focus:border-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-lemon";
