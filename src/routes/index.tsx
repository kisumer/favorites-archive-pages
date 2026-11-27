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
    <div className="min-h-dvh w-full overflow-x-hidden bg-[#F2F2F2] text-[#141414]">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[460px] flex-col px-5 pb-4 pt-4 lg:max-w-[1160px] lg:justify-between lg:px-10 lg:pb-7 lg:pt-6">
        {/* 1. Top Graphical Expandable Header Pill */}
        <header className="relative z-30 flex shrink-0 items-start justify-center pb-2 lg:justify-between lg:pb-0">
          <div className="w-full max-w-[390px] lg:relative lg:h-[50px] lg:w-[320px]">
            <div className={cn("landing-header-pill w-full lg:absolute lg:left-0 lg:top-0", pillOpen && "is-open")}>
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
          </div>

          {/* Desktop-only subtle editorial status */}
          <div className="hidden h-[50px] items-center gap-5 font-mono text-[11px] font-semibold tracking-[0.04em] text-[#737373] lg:flex">
            <span>FREE · NO LOGIN</span>
            <span className="h-3 w-[1px] bg-[#DCDCD6]" aria-hidden="true" />
            <span className="inline-flex items-center gap-1.5 text-[#141414]">
              <span className="h-2 w-2 rounded-full bg-[#FFD829]" />
              <span>LOCAL AUTO-SAVE</span>
            </span>
          </div>
        </header>

        {/* Main Content: Stacked on Mobile, 2-Column Editorial Grid on PC */}
        <main className="flex flex-1 flex-col lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-6">
          {/* Left Column (PC) / Top + Bottom Flow (Mobile via contents) */}
          <div className="contents lg:flex lg:flex-col lg:justify-center lg:space-y-9">
            {/* 2. Kinetic Split-Text Rolling Hero Typography */}
            <section className="order-1 shrink-0 space-y-3 pt-2 lg:space-y-4 lg:pt-0">
              <div className="flex items-center justify-between border-y border-[#DCDCD6] py-2 font-mono text-[10.5px] font-semibold tracking-[0.04em] text-[#737373] lg:py-2.5 lg:text-[11.5px]">
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
                className="cursor-pointer select-none space-y-1 pt-0.5 focus:outline-none lg:space-y-2 lg:pt-1"
              >
                <div className="flex items-center gap-2.5 overflow-hidden leading-[1.04] lg:gap-3.5">
                  <span className="font-display text-[36px] font-bold tracking-[-0.04em] text-[#141414] sm:text-[42px] lg:text-[56px] xl:text-[64px]">
                    <SplitText text={activeHero.l1} baseDelay={0} exiting={isExiting} exitOffset={0} rollKey={rollKey} />
                  </span>
                  <span
                    style={{ backgroundColor: activeHero.badgeBg }}
                    className="shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold tracking-[0.04em] text-[#141414] transition-colors lg:px-3.5 lg:py-1.5 lg:text-[12px]"
                  >
                    {activeHero.badge}
                  </span>
                </div>

                <div className="flex items-center overflow-hidden leading-[1.04]">
                  <span className="text-[37px] font-black tracking-[-0.045em] text-[#141414] sm:text-[44px] lg:text-[58px] xl:text-[66px]">
                    <SplitText
                      text={activeHero.l2}
                      baseDelay={70}
                      exiting={isExiting}
                      exitOffset={l1Len}
                      rollKey={rollKey}
                    />
                  </span>
                </div>

                <div className="flex items-baseline justify-between overflow-hidden leading-[1.04]">
                  <span className="font-display text-[34px] font-bold tracking-[-0.035em] text-[#141414] sm:text-[40px] lg:text-[52px] xl:text-[60px]">
                    <SplitText
                      text={activeHero.l3}
                      baseDelay={150}
                      exiting={isExiting}
                      exitOffset={l1Len + l2Len}
                      rollKey={rollKey}
                    />
                  </span>
                  <span className="font-mono text-[10px] font-medium text-[#737373] lg:text-[11.5px]">TAP TEXT ↕</span>
                </div>
              </div>
            </section>

            {/* 4. Dual Primary Action Links (Below star on mobile, below headline on PC) */}
            <section className="order-3 shrink-0 space-y-2.5 pt-1 lg:grid lg:max-w-[480px] lg:grid-cols-2 lg:gap-3.5 lg:space-y-0 lg:pt-0">
              <Link
                to="/make/"
                className="flex h-[58px] w-full items-center justify-between rounded-[20px] bg-[#FFD829] px-5 text-left text-[#141414] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97] lg:h-[64px]"
              >
                <span className="text-[16px] font-black leading-tight tracking-[-0.025em] lg:text-[17px]">
                  혼자 만들기
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141414] font-mono text-[15px] font-bold text-white">
                  →
                </span>
              </Link>

              <Link
                to="/together/"
                className="flex h-[58px] w-full items-center justify-between rounded-[20px] bg-[#141414] px-5 text-left text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.97] lg:h-[64px]"
              >
                <span className="inline-flex items-center gap-1.5 text-[16px] font-extrabold leading-tight tracking-[-0.025em] lg:text-[17px]">
                  <span>함께 만들기</span>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#FFD829]" fill="currentColor" aria-hidden="true">
                    <path d="M12 1L14.6 9.4L23 12L14.6 14.6L12 23L9.4 14.6L1 12L9.4 9.4Z" />
                  </svg>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.12] font-mono text-[15px] font-bold text-[#FFD829]">
                  ↗
                </span>
              </Link>
            </section>
          </div>

          {/* 3. Centerpiece: Real Interactive 3D Yellow Star (Middle on Mobile, Right Column on PC) */}
          <section className="order-2 relative flex min-h-[185px] w-full flex-1 select-none items-center justify-center lg:min-h-[420px]">
            <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 space-y-2.5 font-mono text-[9.5px] leading-tight text-[#737373] lg:left-2 lg:space-y-3 lg:text-[11px]">
              <div>
                <div className="font-bold text-[#141414]">01—12</div>
                <div>MONTHLY</div>
              </div>
              <div className="h-[1px] w-3.5 bg-[#DCDCD6] lg:w-5" />
              <div>
                <div className="font-bold text-[#141414]">DRAG</div>
                <div>3D STAR</div>
              </div>
            </div>

            <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 space-y-2.5 text-right font-mono text-[9.5px] leading-tight text-[#737373] lg:right-2 lg:space-y-3 lg:text-[11px]">
              <div>
                <div className="font-bold text-[#141414]">FREE</div>
                <div>NO LOGIN</div>
              </div>
              <div className="ml-auto h-[1px] w-3.5 bg-[#DCDCD6] lg:w-5" />
              <div>
                <div className="font-bold text-[#141414]">{spinCount > 0 ? `SPIN ×${spinCount}` : "TAP ↻"}</div>
                <div>360° SPIN</div>
              </div>
            </div>

            <Star3DStage onSpin={handleSpin} />
          </section>
        </main>

        {/* 5. Minimal Bottom Strip (Interactive 01–12 Month Dots + Caption) */}
        <footer className="mt-3 shrink-0 space-y-2 border-t border-[#DCDCD6] pt-2.5 lg:mt-0 lg:space-y-3 lg:pt-4">
          <div className="grid grid-cols-12 gap-0.5 lg:gap-2">
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
                    "rounded-md py-1 font-mono text-[9.5px] font-bold transition-colors focus:outline-none lg:rounded-lg lg:py-2 lg:text-[12px]",
                    active ? "bg-[#FFD829] text-[#141414]" : "text-[#737373] hover:bg-black/[0.04] hover:text-[#141414]",
                  )}
                >
                  {padded}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10.5px] font-medium text-[#737373] lg:text-[12px]">
            <span>© kisumer</span>
            <span className="font-mono text-[10px] font-semibold text-[#141414] lg:text-[11.5px]">
              {hasPickedMonth ? `${String(activeMonth).padStart(2, "0")}월 PICK` : "01—12"}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
