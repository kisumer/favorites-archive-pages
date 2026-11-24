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

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="h-9 w-9 text-[28px]" />
      <span className="leading-none">
        <span className="block text-[17px] font-black tracking-tight">최애 아카이브</span>
        <span className="block text-[10px] font-bold tracking-[0.18em] text-muted-foreground">
          연말결산 제작소
        </span>
      </span>
    </span>
  );
}
