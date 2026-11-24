import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Download, Images, Layers, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { Wordmark, Starburst } from "@/components/archive/Logo";
import { PosterPreview } from "@/components/archive/PosterPreview";
import { SiteFooter } from "@/components/archive/SiteFooter";
import { buttonVariants } from "@/components/ui/button";
import { buildSampleYear } from "@/lib/archive/sample";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "최애 아카이브 · 월별 최애 연말결산 메이커" },
      {
        name: "description",
        content:
          "열두 달의 최애를 한 장에. 카테고리별로 달마다 최애 사진을 채우면 연말결산 취향표 이미지가 완성돼요. 로그인 없이 무료로.",
      },
      { property: "og:title", content: "최애 아카이브 · 월별 최애 연말결산 메이커" },
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

const STEPS = [
  { icon: Layers, title: "카테고리 만들기", body: "그룹, 배우, 노래… 표지 사진과 말풍선 한마디까지", color: "bg-pink" },
  { icon: Images, title: "달마다 최애 채우기", body: "1월부터 12월까지 사진과 이름. 같은 최애는 한 번에 붙여넣기", color: "bg-mint" },
  { icon: Download, title: "PNG로 저장·공유", body: "고화질 이미지 한 장으로 저장하고 바로 공유", color: "bg-sky" },
];

function Landing() {
  const [sample] = useState(() => buildSampleYear(new Date().getFullYear()));
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Wordmark />
        <Link to="/make/" className={buttonVariants({ variant: "outline", size: "sm" })}>
          만들기
        </Link>
      </header>

      <main>
        <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-6 sm:pt-12 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-12 lg:pb-20">
          <Starburst
            className="pointer-events-none absolute -left-6 top-24 h-16 w-16 animate-spin-slow opacity-90 sm:h-20 sm:w-20"
            fillClassName="fill-lemon"
            dotted
          />
          <div className="relative text-center lg:text-left">
            <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-lemon px-3 py-1 text-[12px] font-black tracking-wide shadow-pop">
              ★ 연말결산 제작소
            </p>
            <h1 className="mt-5 text-[2.6rem] font-black leading-[1.08] tracking-tight sm:text-6xl">
              열두 달의 최애를
              <br />
              <span className="relative inline-block">
                <span className="absolute inset-x-[-0.15em] bottom-[0.08em] h-[0.38em] -rotate-1 rounded-md bg-pink" aria-hidden="true" />
                <span className="relative">한 장에 아카이브</span>
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-[16px] font-medium leading-relaxed text-muted-foreground lg:mx-0">
              카테고리마다, 달마다 최애 사진을 채우면 나만의 연말결산 취향표가 완성돼요. 로그인 없이 바로 시작!
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/make/" className={cn(buttonVariants({ variant: "pop", size: "xl" }), "w-full sm:w-auto")}>
                내 취향표 만들기
                <ArrowRight aria-hidden="true" />
              </Link>
              <p className="inline-flex items-center gap-1.5 text-[13px] font-bold text-muted-foreground">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                사진은 내 기기에만 저장돼요
              </p>
            </div>
          </div>

          <div className="relative mt-10 lg:mt-0">
            <div className="absolute -right-3 -top-4 z-10 rotate-6 rounded-full border-2 border-ink bg-mint px-3 py-1 text-[12px] font-black shadow-pop">
              예시 미리보기
            </div>
            <div className="rotate-[-1.5deg] rounded-3xl border-2 border-ink bg-card p-2 shadow-pop-lg sm:p-3">
              <PosterPreview
                year={sample}
                theme="kitsch"
                images={{}}
                className="overflow-hidden rounded-2xl"
                label="최애 아카이브 예시 포스터"
              />
            </div>
          </div>
        </section>

        <section aria-labelledby="how" className="border-y-2 border-ink bg-paper-deep">
          <div className="paper-dots mx-auto max-w-6xl px-5 py-12">
            <h2 id="how" className="text-center text-2xl font-black sm:text-3xl">
              3단계면 끝
            </h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="rounded-3xl border-2 border-ink bg-card p-5 shadow-pop">
                  <div className="flex items-center gap-3">
                    <span className={cn("grid h-11 w-11 place-items-center rounded-full border-2 border-ink", s.color)}>
                      <s.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="text-[12px] font-black tracking-[0.16em] text-muted-foreground">STEP {i + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-black">{s.title}</h3>
                  <p className="mt-1 text-[14px] font-medium leading-relaxed text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="mt-10 text-center">
              <Link to="/make/" className={buttonVariants({ variant: "popInk", size: "lg" })}>
                지금 만들러 가기
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
