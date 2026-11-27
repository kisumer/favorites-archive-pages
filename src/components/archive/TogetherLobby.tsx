import { Link } from "@tanstack/react-router";
import { ArrowRight, Link2, Loader2, Plus, Settings, Users } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  clearSavedDbUrl,
  createRoom,
  extractRoomId,
  getEnvDbUrl,
  loadRecentRooms,
  saveDbUrl,
  type RecentRoom,
} from "@/lib/archive/firebase-room";
import { cn } from "@/lib/utils";
import { Starburst, Wordmark } from "./Logo";
import { FieldLabel, inputClass } from "./Panel";
import { SiteFooter } from "./SiteFooter";

export function TogetherLobby({
  dbUrl,
  onDbUrlChange,
  onEnterRoom,
}: {
  dbUrl: string | null;
  onDbUrlChange: (next: string | null) => void;
  onEnterRoom: (roomId: string) => void;
}) {
  const [urlInput, setUrlInput] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [recentRooms] = useState<RecentRoom[]>(() => loadRecentRooms());
  const hasEnvUrl = Boolean(getEnvDbUrl());
  const ids = { db: useId(), join: useId() };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveDbUrl(urlInput);
    if (!saved) {
      toast.error("올바른 Firebase Realtime Database URL을 입력해 주세요.");
      return;
    }
    onDbUrlChange(saved);
    setUrlInput("");
    setShowSettings(false);
    toast.success("Firebase 데이터베이스를 연결했어요");
  };

  const handleCreateRoom = async () => {
    if (!dbUrl) return;
    setCreating(true);
    try {
      const { roomId } = await createRoom(dbUrl);
      toast.success("새 함께 만들기 방을 열었어요!");
      onEnterRoom(roomId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "방을 만들지 못했어요.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractRoomId(joinInput);
    if (!id) {
      toast.error("방 코드나 초대 링크를 정확히 입력해 주세요.");
      return;
    }
    onEnterRoom(id);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b-2 border-ink bg-paper/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/" aria-label="최애 아카이브 처음 화면">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/make/" className={buttonVariants({ variant: "outline", size: "sm" })}>
              혼자 만들기
            </Link>
            {dbUrl && !hasEnvUrl ? (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setShowSettings((v) => !v)}
                aria-label="데이터베이스 설정"
                title="데이터베이스 설정"
              >
                <Settings aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <div className="text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mint px-3 py-1 text-[12px] font-black shadow-pop">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            함께 만들기
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            친구들과 한 장의 최애표 완성하기
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] font-medium text-muted-foreground">
            공유 링크만 보내면 로그인 없이 누구나 자기 칸에 사진과 최애를 채울 수 있어요.
          </p>
        </div>

        {!dbUrl || showSettings ? (
          <div className="mt-8 rounded-3xl border-2 border-ink bg-card p-6 shadow-pop-lg">
            <div className="flex items-center gap-2">
              <Starburst className="h-8 w-8 shrink-0" fillClassName="fill-lemon" dotted />
              <div>
                <h2 className="text-lg font-black">Firebase 실시간 데이터베이스 연결</h2>
                <p className="text-[13px] font-medium text-muted-foreground">
                  GitHub Pages에서 실시간 협업을 쓰려면 무료 Firebase Realtime Database URL이 필요해요.
                </p>
              </div>
            </div>

            <ol className="mt-4 space-y-2 rounded-2xl bg-paper-deep p-4 text-[13px] font-medium leading-relaxed">
              <li>
                <span className="font-black">1.</span> Firebase 콘솔에서 프로젝트를 만들고{" "}
                <span className="font-bold">Realtime Database</span>를 생성하세요.
              </li>
              <li>
                <span className="font-black">2.</span> 생성된 데이터베이스의 주소를 복사해 아래에 붙여넣으세요.
              </li>
              <li>
                <span className="font-black">3.</span> GitHub 저장소 Actions 변수에{" "}
                <code className="rounded bg-card px-1.5 py-0.5 text-[12px] font-bold">VITE_FIREBASE_DB_URL</code>을
                등록하면 링크를 받은 친구들도 별도 설정 없이 바로 접속돼요.
              </li>
            </ol>

            <form onSubmit={handleSaveUrl} className="mt-4 space-y-2">
              <FieldLabel htmlFor={ids.db}>Firebase Realtime Database URL</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id={ids.db}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Firebase Realtime Database 주소를 붙여넣으세요"
                  className={cn(inputClass, "h-11 flex-1")}
                />
                <Button type="submit" variant="popInk" className="h-11 shrink-0">
                  연결하기
                </Button>
              </div>
            </form>

            {dbUrl ? (
              <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-border pt-3 text-[12px]">
                <span className="truncate font-medium text-muted-foreground">현재 연결됨: {dbUrl}</span>
                <Button
                  variant="ghostDanger"
                  size="sm"
                  onClick={() => {
                    clearSavedDbUrl();
                    onDbUrlChange(null);
                    setShowSettings(false);
                  }}
                >
                  연결 해제
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col justify-between rounded-3xl border-2 border-ink bg-card p-6 shadow-pop">
              <div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-ink bg-pink">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-xl font-black">새 방 만들기</h2>
                <p className="mt-1.5 text-[14px] font-medium text-muted-foreground">
                  공유용 취향표 방을 하나 열고 친구들에게 초대 링크를 보내 보세요.
                </p>
              </div>
              <Button
                variant="pop"
                size="lg"
                className="mt-6 w-full"
                onClick={handleCreateRoom}
                disabled={creating}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
                {creating ? "방 만드는 중…" : "새 함께 만들기 방 열기"}
              </Button>
            </div>

            <form
              onSubmit={handleJoinRoom}
              className="flex flex-col justify-between rounded-3xl border-2 border-ink bg-card p-6 shadow-pop"
            >
              <div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-ink bg-sky">
                  <Link2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-xl font-black">초대받은 방 들어가기</h2>
                <p className="mt-1.5 text-[14px] font-medium text-muted-foreground">
                  친구에게 받은 초대 링크나 6자리 방 코드를 입력하세요.
                </p>
                <div className="mt-4">
                  <FieldLabel htmlFor={ids.join}>방 코드 또는 초대 링크</FieldLabel>
                  <input
                    id={ids.join}
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    placeholder="예: k7m2p9 또는 초대 링크"
                    className={cn(inputClass, "h-11")}
                  />
                </div>
              </div>
              <Button type="submit" variant="popInk" size="lg" className="mt-4 w-full">
                들어가기
                <ArrowRight aria-hidden="true" />
              </Button>
            </form>
          </div>
        )}

        {recentRooms.length > 0 && dbUrl ? (
          <div className="mt-8 rounded-3xl border-2 border-ink bg-card p-5 shadow-pop">
            <h2 className="text-base font-black">최근 방문한 방</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recentRooms.map((r) => (
                <button
                  key={r.roomId}
                  type="button"
                  onClick={() => onEnterRoom(r.roomId)}
                  className="flex items-center justify-between rounded-2xl border-2 border-input bg-paper px-4 py-3 text-left transition-colors hover:border-ink"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold">{r.title}</p>
                    <p className="text-[12px] font-medium text-muted-foreground">
                      {r.year}년 · 코드 {r.roomId}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
