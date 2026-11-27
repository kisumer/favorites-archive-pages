import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Link2, Loader2, Plus, Settings, Users } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
    <div className="flex min-h-dvh flex-col bg-[var(--bg-page)] text-[var(--ink-black)]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[var(--bg-page)]/80 px-5 pb-2 pt-3 backdrop-blur-sm">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center justify-between rounded-full border border-[#E2E2DC] bg-white/95 px-3.5 shadow-[0_4px_16px_rgba(20,20,20,0.045)]">
          <Link to="/" aria-label="최애 아카이브 처음 화면" className="shrink-0 pl-0.5">
            <Wordmark suffix="TOGETHER" />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link
              to="/make/"
              className="inline-flex h-8 items-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-page)] px-3.5 text-[12.5px] font-bold text-[var(--ink-black)] transition-colors hover:border-[var(--ink-black)] hover:bg-white"
            >
              혼자 만들기
            </Link>
            {dbUrl && !hasEnvUrl ? (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setShowSettings((v) => !v)}
                aria-label="데이터베이스 설정"
                title="데이터베이스 설정"
                className="rounded-full"
              >
                <Settings aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        {/* Hero */}
        <div className="text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--yellow-soft)] px-3.5 py-1.5 text-[12px] font-extrabold text-[var(--ink-black)]">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            함께 만들기
          </p>
          <h1 className="mt-4 text-[1.85rem] font-black leading-tight tracking-[-0.03em] text-[var(--ink-black)] sm:text-[2.35rem]">
            친구들과 한 장의 최애표 완성하기
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] font-medium leading-relaxed text-[var(--ink-muted)]">
            공유 링크만 보내면 로그인 없이 누구나 자기 칸에 사진과 최애를 채울 수 있어요.
          </p>
          <p className="mx-auto mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--bg-card)] px-3.5 py-1 text-[12px] font-semibold text-[var(--ink-muted)]">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--ink-black)]" aria-hidden="true" />
            <span>생성 후 6시간 뒤 자동 삭제돼요 · 완성 후 꼭 저장해 주세요</span>
          </p>
        </div>

        {/* DB Settings OR Main Action Cards */}
        {!dbUrl || showSettings ? (
          <div className="mt-9 rounded-[24px] border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3">
              <Starburst className="h-8 w-8 shrink-0" fillClassName="fill-[var(--yellow-main)]" dotted />
              <div>
                <h2 className="text-lg font-black text-[var(--ink-black)]">Firebase 실시간 데이터베이스 연결</h2>
                <p className="text-[13px] font-medium text-[var(--ink-muted)]">
                  GitHub Pages에서 실시간 협업을 쓰려면 무료 Firebase Realtime Database URL이 필요해요.
                </p>
              </div>
            </div>

            <ol className="mt-4 space-y-2 rounded-[16px] bg-[var(--bg-input)] p-4 text-[13px] font-medium leading-relaxed text-[var(--ink-black)]">
              <li>
                <span className="font-black">1.</span> Firebase 콘솔에서 프로젝트를 만들고{" "}
                <span className="font-bold">Realtime Database</span>를 생성하세요.
              </li>
              <li>
                <span className="font-black">2.</span> 생성된 데이터베이스의 주소를 복사해 아래에 붙여넣으세요.
              </li>
              <li>
                <span className="font-black">3.</span> GitHub 저장소 Actions 변수에{" "}
                <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[12px] font-bold">
                  VITE_FIREBASE_DB_URL
                </code>
                을 등록하면 링크를 받은 친구들도 별도 설정 없이 바로 접속돼요.
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
                <Button type="submit" variant="popInk" className="h-11 shrink-0 rounded-[14px]">
                  연결하기
                </Button>
              </div>
            </form>

            {dbUrl ? (
              <div className="mt-4 flex items-center justify-between border-t border-dashed border-[var(--border-soft)] pt-3 text-[12px]">
                <span className="truncate font-medium text-[var(--ink-muted)]">현재 연결됨: {dbUrl}</span>
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
          <div className="mt-9 grid gap-4 sm:grid-cols-2 sm:gap-5">
            {/* Card 1: 새 방 만들기 */}
            <div className="flex flex-col justify-between rounded-[24px] border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--yellow-soft)] text-[var(--ink-black)]">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-[var(--ink-muted)]">
                    NEW ROOM
                  </span>
                </div>
                <h2 className="mt-5 text-[20px] font-black tracking-[-0.02em] text-[var(--ink-black)]">
                  새 방 만들기
                </h2>
                <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-[var(--ink-muted)]">
                  공유용 취향표 방을 하나 열고 친구들에게 초대 링크를 보내 보세요.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={creating}
                className="mt-7 flex h-[52px] w-full items-center justify-between rounded-[16px] bg-[var(--yellow-main)] px-5 text-left text-[15px] font-black text-[var(--ink-black)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                <span>{creating ? "방 만드는 중…" : "새 함께 만들기 방 열기"}</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink-black)] text-white">
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  )}
                </span>
              </button>
            </div>

            {/* Card 2: 초대받은 방 들어가기 */}
            <form
              onSubmit={handleJoinRoom}
              className="flex flex-col justify-between rounded-[24px] border border-[var(--border-soft)] bg-[var(--bg-card)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg-input)] text-[var(--ink-black)]">
                    <Link2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[10.5px] font-bold tracking-[0.12em] text-[var(--ink-muted)]">
                    JOIN ROOM
                  </span>
                </div>
                <h2 className="mt-5 text-[20px] font-black tracking-[-0.02em] text-[var(--ink-black)]">
                  초대받은 방 들어가기
                </h2>
                <p className="mt-1.5 text-[14px] font-medium leading-relaxed text-[var(--ink-muted)]">
                  친구에게 받은 초대 링크나 6자리 방 코드를 입력하세요.
                </p>
                <div className="mt-4">
                  <FieldLabel htmlFor={ids.join}>방 코드 또는 초대 링크</FieldLabel>
                  <input
                    id={ids.join}
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    placeholder="예: k7m2p9 또는 초대 링크"
                    className={cn(inputClass, "h-11 text-[14px]")}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-5 flex h-[52px] w-full items-center justify-between rounded-[16px] bg-[var(--ink-black)] px-5 text-left text-[15px] font-extrabold text-white transition-transform duration-150 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>들어가기</span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.12] text-[var(--yellow-main)]">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </form>
          </div>
        )}

        {/* Recent Rooms */}
        {recentRooms.length > 0 && dbUrl ? (
          <section className="mt-6 rounded-[24px] border border-[var(--border-soft)] bg-[var(--bg-card)] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-black tracking-[-0.015em] text-[var(--ink-black)]">최근 방문한 방</h2>
              <span className="font-mono text-[11px] font-semibold text-[var(--ink-muted)]">
                RECENT · {recentRooms.length}
              </span>
            </div>
            <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
              {recentRooms.map((r) => (
                <button
                  key={r.roomId}
                  type="button"
                  onClick={() => onEnterRoom(r.roomId)}
                  className="group flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border-soft)] bg-[var(--bg-page)]/60 px-4 py-3 text-left transition-all hover:border-[var(--ink-black)] hover:bg-white active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-[var(--ink-black)]">{r.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-muted)]">
                      <span>{r.year}년</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-[11.5px] font-semibold">{r.roomId}</span>
                    </p>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[var(--ink-muted)] transition-colors group-hover:bg-[var(--ink-black)] group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
