import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  Copy,
  Download,
  Eye,
  Link2,
  Loader2,
  LogOut,
  Maximize2,
  Minimize2,
  PencilLine,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { getConfiguredDbUrl } from "@/lib/archive/firebase-room";
import { getYear, LIMITS, parseYearInput } from "@/lib/archive/model";
import { cn } from "@/lib/utils";
import { useArchive } from "./ArchiveProvider";
import { CategoryPanel } from "./CategoryPanel";
import { ConfirmProvider } from "./ConfirmProvider";
import { ExportDialog } from "./ExportDialog";
import { Wordmark } from "./Logo";
import { MonthPanel } from "./MonthPanel";
import { FieldLabel, inputClass, Panel } from "./Panel";
import { PosterPreview } from "./PosterPreview";
import { RoomProvider, useRoomMeta } from "./RoomProvider";
import { SiteFooter } from "./SiteFooter";
import { TogetherLobby } from "./TogetherLobby";

function RoomLoadingSkeleton() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background" role="status">
      <p className="flex items-center gap-2 text-[15px] font-bold text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        함께 만들기 방에 들어가는 중…
      </p>
    </div>
  );
}

function RoomErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b-2 border-ink bg-paper/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="최애 아카이브 처음 화면">
            <Wordmark />
          </Link>
          <Link to="/make/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            혼자 만들기
          </Link>
        </div>
      </header>
      <main className="grid flex-1 place-items-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border-2 border-ink bg-card p-6 text-center shadow-pop-lg">
          <p className="text-lg font-black">방을 열지 못했어요</p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button variant="popInk" onClick={onBack}>
              함께 만들기 홈으로
            </Button>
            <Link to="/make/" className={buttonVariants({ variant: "outline" })}>
              혼자 만들기로 이동
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function SyncBadge() {
  const { saveStatus } = useArchive();
  const { connectionStatus } = useRoomMeta();

  if (connectionStatus === "error" || saveStatus === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-destructive">
        <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
        연결 확인 필요
      </span>
    );
  }
  if (saveStatus === "saving" || connectionStatus === "reconnecting") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-muted-foreground" aria-live="polite">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        {saveStatus === "saving" ? "동기화 중…" : "다시 연결 중…"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-emerald-700 dark:text-emerald-400" aria-live="polite">
      <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
      실시간 연결됨
    </span>
  );
}

function getInviteUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.search = `?room=${encodeURIComponent(roomId)}`;
  url.hash = "";
  return url.toString();
}

function RoomInfoPanel({ roomId, onLeave }: { roomId: string; onLeave: () => void }) {
  const { state, apply } = useArchive();
  const current = getYear(state) ?? state.years[0]!;
  const [copied, setCopied] = useState(false);
  const [yearDraft, setYearDraft] = useState(String(current.year));
  const ids = { title: useId(), year: useId() };

  useEffect(() => {
    setYearDraft(String(current.year));
  }, [current.year]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(roomId));
      setCopied(true);
      toast.success("초대 링크를 복사했어요", {
        description: "친구에게 보내면 로그인 없이 바로 함께 채울 수 있어요.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했어요. 주소창의 링크를 직접 복사해 주세요.");
    }
  };

  const applyYear = () => {
    const parsed = parseYearInput(yearDraft);
    if (!parsed.ok) {
      toast.error(parsed.error);
      setYearDraft(String(current.year));
      return;
    }
    if (parsed.year === current.year) return;
    apply((s) => ({
      ...s,
      currentYear: parsed.year,
      years: s.years.map((y, idx) => (idx === 0 ? { ...y, year: parsed.year } : y)),
    }));
  };

  return (
    <Panel
      step="STEP 1"
      title="공유방 · 기본 정보"
      icon={Users}
      accentClassName="bg-sky"
      action={
        <span className="rounded-full border-2 border-ink bg-lemon px-2.5 py-0.5 text-[12px] font-black tracking-wider">
          {roomId}
        </span>
      }
    >
      <div className="rounded-2xl border-2 border-ink bg-paper-deep p-3">
        <p className="text-[13px] font-bold">친구 초대하기</p>
        <p className="mt-0.5 text-[12px] font-medium text-muted-foreground">
          링크만 있으면 로그인 없이 바로 들어와 자기 칸을 채울 수 있어요.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button variant="pop" size="sm" className="flex-1" onClick={copyInvite}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "복사됨!" : "초대 링크 복사"}
          </Button>
          <Button variant="outline" size="sm" onClick={onLeave}>
            <LogOut aria-hidden="true" />
            방 나가기
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[110px_1fr]">
        <div>
          <FieldLabel htmlFor={ids.year}>연도</FieldLabel>
          <input
            id={ids.year}
            value={yearDraft}
            inputMode="numeric"
            maxLength={4}
            onChange={(e) => setYearDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            onBlur={applyYear}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyYear();
            }}
            className={cn(inputClass, "h-11 tabular-nums")}
          />
        </div>
        <div>
          <FieldLabel htmlFor={ids.title} hint={`${current.title.length}/${LIMITS.title}`}>
            포스터 제목
          </FieldLabel>
          <input
            id={ids.title}
            value={current.title}
            maxLength={LIMITS.title}
            onChange={(e) =>
              apply((s) => ({
                ...s,
                years: s.years.map((y, idx) => (idx === 0 ? { ...y, title: e.target.value } : y)),
              }))
            }
            placeholder={`${current.year} 함께 만드는 최애 연말결산`}
            className={cn(inputClass, "h-11")}
          />
        </div>
      </div>
    </Panel>
  );
}

function TogetherRoomEditor({ roomId, onLeave }: { roomId: string; onLeave: () => void }) {
  const { state, images } = useArchive();
  const year = getYear(state) ?? state.years[0]!;
  const posterYear = useMemo(() => ({ ...year, author: "", coauthors: [] }), [year]);
  const [catId, setCatId] = useState<string | null>(year.categories[0]?.id ?? null);
  const [month, setMonth] = useState(0);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [exportOpen, setExportOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const monthRef = useRef<HTMLElement>(null);
  const category = year.categories.find((c) => c.id === catId) ?? year.categories[0] ?? null;

  useEffect(() => {
    if (!year.categories.some((c) => c.id === catId)) {
      setCatId(year.categories[0]?.id ?? null);
    }
  }, [year, catId]);

  const onPick = (categoryId: string, m: number | null) => {
    setCatId(categoryId);
    if (m !== null) setMonth(m);
    setTab("edit");
    requestAnimationFrame(() => {
      monthRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(getInviteUrl(roomId));
      setCopied(true);
      toast.success("초대 링크를 복사했어요");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("링크를 복사하지 못했어요.");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 lg:px-8">
          <Link to="/" aria-label="최애 아카이브 처음 화면" className="shrink-0">
            <Wordmark />
          </Link>
          <span className="hidden rounded-full border-2 border-ink bg-mint px-2.5 py-0.5 text-[11px] font-black sm:inline-flex">
            함께 만들기
          </span>
          <div className="hidden sm:block">
            <SyncBadge />
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Link to="/make/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              혼자 만들기
            </Link>
            <Button variant="outline" size="sm" onClick={copyInvite}>
              {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
              <span className="hidden sm:inline">{copied ? "복사됨" : "초대 링크"}</span>
            </Button>
            <Button variant="popInk" size="sm" onClick={() => setExportOpen(true)} className="hidden lg:inline-flex">
              <Download aria-hidden="true" />
              이미지 저장
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pt-4 lg:grid lg:grid-cols-[minmax(380px,460px)_1fr] lg:gap-8 lg:px-8 lg:pt-6">
        <div className={cn("space-y-5 pb-28 lg:block lg:pb-10", tab !== "edit" && "hidden")}>
          <div className="flex items-center justify-between sm:hidden">
            <SyncBadge />
            <span className="text-[12px] font-bold text-muted-foreground">방 코드 {roomId}</span>
          </div>
          <RoomInfoPanel roomId={roomId} onLeave={onLeave} />
          <CategoryPanel year={year} category={category} onSelect={setCatId} />
          <MonthPanel ref={monthRef} year={year} category={category} month={month} onMonth={setMonth} />
        </div>

        <div className={cn("pb-28 lg:block lg:pb-10", tab !== "preview" && "hidden")}>
          <div className="lg:sticky lg:top-[5.5rem]">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="mr-auto text-lg font-black">
                실시간 미리보기 <span className="text-[13px] font-bold text-muted-foreground">· {year.year}</span>
              </h2>
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
                <PosterPreview year={posterYear} theme="kitsch" images={images} onPick={onPick} />
              </div>
            </div>
            <p className="mt-2 text-center text-[12px] font-semibold text-muted-foreground">
              다른 사람이 수정하면 화면에 자동으로 반영돼요 · 카드를 누르면 바로 편집해요
            </p>
            <Button variant="popInk" size="lg" className="mt-3 hidden w-full lg:inline-flex" onClick={() => setExportOpen(true)}>
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
          <Button variant="pop" className="h-12 flex-col gap-0.5 text-[12px]" onClick={() => setExportOpen(true)}>
            <Download aria-hidden="true" />
            저장
          </Button>
        </div>
      </nav>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} year={posterYear} theme="kitsch" />
    </div>
  );
}

export function TogetherApp({ roomId }: { roomId?: string | undefined }) {
  const navigate = useNavigate();
  const [dbUrl, setDbUrl] = useState<string | null>(() => getConfiguredDbUrl());

  const goRoom = (id: string) => {
    void navigate({ to: "/together", search: { room: id } });
  };

  const leaveRoom = () => {
    void navigate({ to: "/together", search: {} });
  };

  if (roomId && dbUrl) {
    return (
      <ConfirmProvider>
        <RoomProvider
          roomId={roomId}
          dbUrl={dbUrl}
          loading={<RoomLoadingSkeleton />}
          notFound={(msg) => <RoomErrorScreen message={msg} onBack={leaveRoom} />}
        >
          <TogetherRoomEditor roomId={roomId} onLeave={leaveRoom} />
        </RoomProvider>
      </ConfirmProvider>
    );
  }

  return <TogetherLobby dbUrl={dbUrl} onDbUrlChange={setDbUrl} onEnterRoom={goRoom} />;
}
