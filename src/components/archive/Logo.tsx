import { cn } from "@/lib/utils";

function starPoints(cx: number, cy: number, outer: number, inner: number, n: number) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Hand-drawn style spiky starburst used as the brand mark and decoration. */
export function Starburst({
  className,
  fillClassName = "fill-lemon",
  points = 12,
  dotted = false,
  children,
}: {
  className?: string;
  fillClassName?: string;
  points?: number;
  dotted?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 100 100" className={cn("overflow-visible", className)} aria-hidden="true">
      <polygon
        points={starPoints(50, 50, 48, 36, points)}
        className={cn(fillClassName, "stroke-ink")}
        strokeWidth={dotted ? 3.5 : 3}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={dotted ? "0.1 6" : undefined}
      />
      {children}
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-grid place-items-center", className)}>
      <Starburst className="absolute inset-0 h-full w-full" fillClassName="fill-pink" points={11} />
      <span className="relative text-[0.5em] font-black leading-none text-ink">최</span>
    </span>
  );
}

export function Wordmark({ className, suffix }: { className?: string; suffix?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--yellow-soft)]">
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5 text-[var(--yellow-main)]"
          fill="currentColor"
          stroke="var(--ink-black)"
          strokeWidth="1.3"
          aria-hidden="true"
        >
          <path d="M12 1.5L14.5 8.2L21.5 6.5L17.4 12L21.5 17.5L14.5 15.8L12 22.5L9.5 15.8L2.5 17.5L6.6 12L2.5 6.5L9.5 8.2Z" />
        </svg>
      </span>
      <span className="truncate text-[14px] font-extrabold leading-none tracking-[-0.025em] text-[var(--ink-black)]">
        최애 아카이브
      </span>
      {suffix ? (
        <span className="hidden font-mono text-[11.5px] font-semibold text-[var(--ink-muted)] sm:inline">
          · {suffix}
        </span>
      ) : null}
    </span>
  );
}
