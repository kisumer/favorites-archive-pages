import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { Star3DStage } from "@/components/archive/Star3DStage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "최애 아카이브" },
      {
        name: "description",
        content:
          "열두 달의 최애를 한 장에. 참여자별로 달마다 최애 사진을 채우면 연말결산 취향표 이미지가 완성돼요. 로그인 없이 무료로.",
      },
      { property: "og:title", content: "최애 아카이브" },
      {
        property: "og:description",
        content: "열두 달의 최애를 한 장에. 로그인 없이 바로 만드는 연말결산 취향표.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const YEARS = ["2025", "2026", "2027"] as const;
const MONTHS = Array.from({ length: 12 }, (_, idx) => idx + 1);

interface HeroSet {
  l1: string;
  badge: string;
  badgeBg: string;
  l2: string;
  l3: string;
}

function getHeroSets(year: string): [HeroSet, HeroSet] {
  return [
    {
      l1: year,
      badge: "YEAR-END",
      badgeBg: "#FFD829",
      l2: "최애 연말결산",
      l3: "ARCHIVE",
    },
    {
      l1: "12 MONTHS",
      badge: "MY PICK",
      badgeBg: "#FFF7CC",
      l2: "나의 최애",
      l3: "RECORD",
    },
  ];
}

function SplitText({
  text,
  baseDelay,
  exiting,
  exitOffset,
  rollKey,
}: {
  text: string;
  baseDelay: number;
  exiting: boolean;
  exitOffset: number;
  rollKey: number;
}) {
  return (
    <>
      {Array.from(text).map((ch, idx) => {
        const delay = exiting ? (exitOffset + idx) * 12 : baseDelay + idx * 24;
        return (
          <span key={`${rollKey}-${idx}`} className="relative inline-block overflow-hidden align-top">
            <span
              className={cn(
                "inline-block will-change-transform",
                exiting ? "landing-char-exit" : "landing-char-enter",
              )}
              style={{ animationDelay: `${delay}ms` }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          </span>
        );
      })}
    </>
  );
}

function Landing() {
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [pillOpen, setPillOpen] = useState(false);
  const [heroModeIdx, setHeroModeIdx] = useState<0 | 1>(0);
  const [isExiting, setIsExiting] = useState(false);
  const [rollKey, setRollKey] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [activeMonth, setActiveMonth] = useState<number>(1);
  const [hasPickedMonth, setHasPickedMonth] = useState(false);

  const rollingRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) {
        window.clearTimeout(id);
      }
    };
  }, []);

  const triggerHeadlineRoll = useCallback((nextIdx: 0 | 1) => {
    if (rollingRef.current) return;
    rollingRef.current = true;
    setIsExiting(true);

    const t1 = window.setTimeout(() => {
      setHeroModeIdx(nextIdx);
      setIsExiting(false);
      setRollKey((k) => k + 1);
      const t2 = window.setTimeout(() => {
        rollingRef.current = false;
      }, 380);
      timersRef.current.push(t2);
    }, 240);
    timersRef.current.push(t1);
  }, []);

  const cycleHeadline = useCallback(() => {
    triggerHeadlineRoll(heroModeIdx === 0 ? 1 : 0);
  }, [heroModeIdx, triggerHeadlineRoll]);

  const handleSelectYear = (year: string) => {
    setSelectedYear(year);
    if (heroModeIdx === 0) {
      triggerHeadlineRoll(0);
    }
  };

  const handleSpin = useCallback(() => {
    setSpinCount((c) => c + 1);
  }, []);

  const heroSets = getHeroSets(selectedYear);
  const activeHero = heroSets[heroModeIdx];
  const l1Len = Array.from(activeHero.l1).length;
  const l2Len = Array.from(activeHero.l2).length;

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#F2F2F2] text-[#141414] min-[470px]:bg-[#E4E4DE] min-[470px]:py-[18px]">
      <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#F2F2F2] min-[470px]:h-[min(856px,calc(100dvh-36px))] min-[470px]:rounded-[38px] min-[470px]:border min-[470px]:border-[#D8D8D1] min-[470px]:shadow-[0_24px_64px_rgba(20,20,20,0.08)]">
        {/* 1. Top Graphical Expandable Header Pill */}
        <header className="relative z-30 flex shrink-0 justify-center px-5 pb-2 pt-4">
          <div className={cn("landing-header-pill w-full max-w-[390px]", pillOpen && "is-open")}>
            <button
              type="button"
              aria-expanded={pillOpen}
              onClick={() => setPillOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 focus:outline-none"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFF6CC]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5 text-[#FFD829]"
                    fill="currentColor"
                    stroke="#141414"
                    strokeWidth="1.3"
                    aria-hidden="true"
                  >
                    <path d="M12 1.5L14.5 8.2L21.5 6.5L17.4 12L21.5 17.5L14.5 15.8L12 22.5L9.5 15.8L2.5 17.5L6.6 12L2.5 6.5L9.5 8.2Z" />
                  </svg>
                </span>
                <span className="truncate text-[13.5px] font-extrabold tracking-[-0.025em] text-[#141414]">
                  최애 아카이브
                </span>
                <span className="font-mono text-[11.5px] font-semibold text-[#737373]">· {selectedYear}</span>
              </div>

              <span className="landing-pill-plus flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#E2E2DC] bg-[#F2F2F2] text-[#141414]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>

            <div className="landing-pill-drawer">
              <div className="overflow-hidden">
                <div className="space-y-3 border-t border-[#E2E2DC] px-4 pb-4 pt-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10.5px] font-semibold tracking-wider text-[#737373]">YEAR</span>
                    <div className="flex items-center gap-1.5">
                      {YEARS.map((year) => {
                        const active = year === selectedYear;
                        return (
                          <button
                            key={year}
                            type="button"
                            onClick={() => handleSelectYear(year)}
                            className={cn(
                              "rounded-full px-3 py-1 font-mono text-[11.5px] font-bold transition-colors",
                              active
                                ? "bg-[#141414] text-white"
                                : "bg-[#F2F2F2] text-[#737373] hover:text-[#141414]",
                            )}
                          >
                            {year}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E2E2DC] pt-2.5 text-[11.5px] font-semibold text-[#737373]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#FFD829] ring-2 ring-[#FFF6CC]" />
                      <span>이 기기에 자동 저장됨</span>
                    </span>
                    <span className="font-mono text-[10px]">LOCAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 2. Kinetic Split-Text Rolling Hero Typography */}
        <section className="shrink-0 space-y-3 px-5 pt-2">
          <div className="flex items-center justify-between border-y border-[#DCDCD6] py-2 font-mono text-[10.5px] font-semibold tracking-[0.04em] text-[#737373]">
            <span>VOL. {selectedYear}</span>
            <span>12 MONTHS ARCHIVE</span>
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label={`${selectedYear} 최애 연말결산 ARCHIVE — 탭해서 문구 전환`}
            onClick={cycleHeadline}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                cycleHeadline();
              }
            }}
            className="cursor-pointer select-none space-y-1 pt-0.5 focus:outline-none"
          >
            <div className="flex items-center gap-2.5 overflow-hidden leading-[1.04]">
              <span className="font-display text-[36px] font-bold tracking-[-0.04em] text-[#141414]">
                <SplitText text={activeHero.l1} baseDelay={0} exiting={isExiting} exitOffset={0} rollKey={rollKey} />
              </span>
              <span
                style={{ backgroundColor: activeHero.badgeBg }}
                className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.04em] text-[#141414] transition-colors"
              >
                {activeHero.badge}
              </span>
            </div>

            <div className="flex items-center overflow-hidden leading-[1.04]">
              <span className="text-[37px] font-black tracking-[-0.045em] text-[#141414]">
                <SplitText text={activeHero.l2} baseDelay={70} exiting={isExiting} exitOffset={l1Len} rollKey={rollKey} />
              </span>
            </div>

            <div className="flex items-baseline justify-between overflow-hidden leading-[1.04]">
              <span className="font-display text-[34px] font-bold tracking-[-0.035em] text-[#141414]">
                <SplitText
                  text={activeHero.l3}
                  baseDelay={150}
                  exiting={isExiting}
                  exitOffset={l1Len + l2Len}
                  rollKey={rollKey}
                />
              </span>
              <span className="font-mono text-[10px] font-medium text-[#737373]">TAP TEXT ↕</span>
            </div>
          </div>
        </section>

        {/* 3. Centerpiece: Real Interactive 3D Yellow Star */}
        <section className="relative flex min-h-[185px] w-full flex-1 select-none items-center justify-center">
          <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 space-y-2.5 font-mono text-[9.5px] leading-tight text-[#737373]">
            <div>
              <div className="font-bold text-[#141414]">01—12</div>
              <div>MONTHLY</div>
            </div>
            <div className="h-[1px] w-3.5 bg-[#DCDCD6]" />
            <div>
              <div className="font-bold text-[#141414]">DRAG</div>
              <div>3D STAR</div>
            </div>
          </div>

          <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 space-y-2.5 text-right font-mono text-[9.5px] leading-tight text-[#737373]">
            <div>
              <div className="font-bold text-[#141414]">FREE</div>
              <div>NO LOGIN</div>
            </div>
            <div className="ml-auto h-[1px] w-3.5 bg-[#DCDCD6]" />
            <div>
              <div className="font-bold text-[#141414]">{spinCount > 0 ? `SPIN ×${spinCount}` : "TAP ↻"}</div>
              <div>360° SPIN</div>
            </div>
          </div>

          <Star3DStage onSpin={handleSpin} />
        </section>

        {/* 4. Dual Primary Action Links & Minimal Bottom Strip */}
        <section className="shrink-0 space-y-2.5 px-5 pb-4 pt-1">
          <Link
            to="/make/"
            className="flex h-[58px] w-full items-center justify-between rounded-[20px] bg-[#FFD829] px-5 text-left text-[#141414] transition-transform duration-150 active:scale-[0.97]"
          >
            <span className="text-[16px] font-black leading-tight tracking-[-0.025em]">혼자 만들기</span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141414] font-mono text-[15px] font-bold text-white">
              →
            </span>
          </Link>

          <Link
            to="/together/"
            className="flex h-[58px] w-full items-center justify-between rounded-[20px] bg-[#141414] px-5 text-left text-white transition-transform duration-150 active:scale-[0.97]"
          >
            <span className="inline-flex items-center gap-1.5 text-[16px] font-extrabold leading-tight tracking-[-0.025em]">
              <span>함께 만들기</span>
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#FFD829]" fill="currentColor" aria-hidden="true">
                <path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4Z" />
              </svg>
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.12] font-mono text-[15px] font-bold text-[#FFD829]">
              ↗
            </span>
          </Link>

          {/* 5. Minimal Bottom Strip (Interactive 01–12 Month Dots + Caption) */}
          <div className="mt-1 space-y-2 border-t border-[#DCDCD6] pt-2.5">
            <div className="grid grid-cols-12 gap-0.5">
              {MONTHS.map((m) => {
                const padded = String(m).padStart(2, "0");
                const active = m === activeMonth;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-label={`${m}월 선택`}
                    onClick={() => {
                      setActiveMonth(m);
                      setHasPickedMonth(true);
                    }}
                    className={cn(
                      "rounded-md py-1 font-mono text-[9.5px] font-bold transition-colors focus:outline-none",
                      active ? "bg-[#FFD829] text-[#141414]" : "text-[#737373] hover:text-[#141414]",
                    )}
                  >
                    {padded}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10.5px] font-medium text-[#737373]">
              <span>© kisumer</span>
              <span className="font-mono text-[10px] font-semibold text-[#141414]">
                {hasPickedMonth ? `${String(activeMonth).padStart(2, "0")}월 PICK` : "01—12"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
