import { Link } from "@tanstack/react-router";
import { Check, CircleHelp, CloudOff, Database, Download, Eye, Loader2, Maximize2, Minimize2, PencilLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { getYear } from "@/lib/archive/model";
import { cn } from "@/lib/utils";
import { ArchiveProvider, useArchive } from "./ArchiveProvider";
import { CategoryPanel } from "./CategoryPanel";
import { ConfirmProvider } from "./ConfirmProvider";
import { DataDialog } from "./DataDialog";
import { ExportDialog } from "./ExportDialog";
import { Wordmark } from "./Logo";
import { MonthPanel } from "./MonthPanel";
import { Onboarding, ONBOARDED_KEY } from "./Onboarding";
import { PosterPreview } from "./PosterPreview";
import { SiteFooter } from "./SiteFooter";
import { ThemeToggle } from "./ThemeToggle";
import { YearPanel } from "./YearPanel";

export function EditorSkeleton() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background" role="status">
      <p className="flex items-center gap-2 text-[15px] font-bold text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        내 취향표 불러오는 중…
      </p>
    </div>
  );
}

export function EditorApp() {
  return (
    <ConfirmProvider>
      <ArchiveProvider loading={<EditorSkeleton />}>
        <Editor />
      </ArchiveProvider>
    </ConfirmProvider>
  );
}

function SaveBadge() {
  const { saveStatus, storeKind } = useArchive();
  if (storeKind === "memory")
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-destructive">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
        저장 안 됨
      </span>
    );
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[12px] font-bold",
        saveStatus === "error" ? "text-destructive" : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      {saveStatus === "saving" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : saveStatus === "error" ? (
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {saveStatus === "saving" ? "저장 중" : saveStatus === "error" ? "저장 실패" : "이 기기에 저장됨"}
    </span>
  );
}

function Editor() {
  const { state, images } = useArchive();
  const year = getYear(state) ?? state.years[0]!;
  const [catId, setCatId] = useState<string | null>(year.categories[0]?.id ?? null);
  const [month, setMonth] = useState(0);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [exportOpen, setExportOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const monthRef = useRef<HTMLElement>(null);
  const category = year.categories.find((c) => c.id === catId) ?? year.categories[0] ?? null;

  // keep selection valid when year changes or a category disappears
  useEffect(() => {
    if (!year.categories.some((c) => c.id === catId)) setCatId(year.categories[0]?.id ?? null);
  }, [year, catId]);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(ONBOARDED_KEY)) setHelpOpen(true);
    } catch {
      // storage blocked: skip onboarding
    }
  }, []);

  const onPick = (categoryId: string, m: number | null) => {
    setCatId(categoryId);
    if (m !== null) setMonth(m);
    setTab("edit");
    requestAnimationFrame(() => {
      monthRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openExport = () => setExportOpen(true);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 lg:px-8">
          <Link to="/" aria-label="최애 아카이브 처음 화면" className="shrink-0">
            <Wordmark />
          </Link>
          <div className="hidden sm:block">
            <SaveBadge />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setHelpOpen(true)} aria-label="사용 방법" title="사용 방법">
              <CircleHelp aria-hidden="true" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDataOpen(true)} aria-label="내 데이터 · 백업">
              <Database aria-hidden="true" />
              <span className="hidden sm:inline">내 데이터</span>
            </Button>
            <Button variant="popInk" size="sm" onClick={openExport} className="hidden lg:inline-flex">
              <Download aria-hidden="true" />
              이미지 저장
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-4 lg:grid lg:grid-cols-[minmax(380px,460px)_1fr] lg:gap-8 lg:px-8 lg:pt-6">
        <div className={cn("space-y-5 pb-28 lg:block lg:pb-10", tab !== "edit" && "hidden")}>
          <div className="flex items-center justify-between sm:hidden">
            <SaveBadge />
            <span className="text-[12px] font-bold text-muted-foreground">{year.year}년 편집 중</span>
          </div>
          <YearPanel />
          <CategoryPanel year={year} category={category} onSelect={setCatId} />
          <MonthPanel ref={monthRef} year={year} category={category} month={month} onMonth={setMonth} />
        </div>

        <div className={cn("pb-28 lg:block lg:pb-10", tab !== "preview" && "hidden")}>
          <div className="lg:sticky lg:top-[5.5rem]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-lg font-black">
                미리보기 <span className="text-[13px] font-bold text-muted-foreground">· {year.year}</span>
              </h2>
              <ThemeToggle />
              <Button
                variant="outline"
                size="iconSm"
                className="lg:hidden"
                onClick={() => setZoom((z) => !z)}
                aria-pressed={zoom}
                aria-label={zoom ? "화면에 맞추기" : "크게 보기"}
              >
                {zoom ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
              </Button>
            </div>
            <div className="paper-dots overflow-auto rounded-3xl border-2 border-ink bg-paper-deep p-2 shadow-pop sm:p-4 lg:max-h-[calc(100dvh-10rem)]">
              <div className={cn("overflow-hidden rounded-xl shadow-soft", zoom && "w-[960px] max-w-none lg:w-auto")}>
                <PosterPreview year={year} theme={state.theme} images={images} onPick={onPick} />
              </div>
            </div>
            <p className="mt-2 text-center text-[12px] font-semibold text-muted-foreground">
              카드를 누르면 그 달을 바로 편집할 수 있어요
            </p>
            <Button variant="popInk" size="lg" className="mt-3 hidden w-full lg:inline-flex" onClick={openExport}>
              <Download aria-hidden="true" />
              고화질 PNG로 저장하기
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter className="mb-20 border-t-2 border-dashed border-border lg:mb-0" />

      <nav
        aria-label="편집 화면 전환"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper/95 px-3 pt-2 backdrop-blur lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Button
            variant={tab === "edit" ? "popInk" : "ghost"}
            className="h-12 flex-col gap-0.5 text-[12px]"
            onClick={() => setTab("edit")}
            aria-pressed={tab === "edit"}
          >
            <PencilLine aria-hidden="true" />
            편집
          </Button>
          <Button
            variant={tab === "preview" ? "popInk" : "ghost"}
            className="h-12 flex-col gap-0.5 text-[12px]"
            onClick={() => {
              setTab("preview");
              window.scrollTo({ top: 0 });
            }}
            aria-pressed={tab === "preview"}
          >
            <Eye aria-hidden="true" />
            미리보기
          </Button>
          <Button variant="pop" className="h-12 flex-col gap-0.5 text-[12px]" onClick={openExport}>
            <Download aria-hidden="true" />
            저장
          </Button>
        </div>
      </nav>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} year={year} theme={state.theme} />
      <DataDialog open={dataOpen} onOpenChange={setDataOpen} />
      <Onboarding open={helpOpen} onOpenChange={setHelpOpen} year={year} />
    </div>
  );
}
