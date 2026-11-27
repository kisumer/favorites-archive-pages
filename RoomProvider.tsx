import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  fetchRoom,
  ROOM_TTL_MS,
  saveRecentRoom,
  subscribeRoom,
  syncYearDiff,
  uploadRoomImage,
} from "@/lib/archive/firebase-room";
import { compressImage, type PhotoCrop } from "@/lib/archive/image";
import { uid } from "@/lib/archive/model";
import type { ArchiveState, Result, YearData } from "@/lib/archive/types";
import { ArchiveContext, type SaveStatus, type Updater } from "./ArchiveProvider";

export type RoomConnectionStatus = "connecting" | "connected" | "reconnecting" | "error";

interface RoomMetaContextValue {
  roomId: string;
  dbUrl: string;
  connectionStatus: RoomConnectionStatus;
  updatedAt: number;
  expiresAt: number;
}

const RoomMetaContext = createContext<RoomMetaContextValue | null>(null);

export function useRoomMeta(): RoomMetaContextValue {
  const ctx = useContext(RoomMetaContext);
  if (!ctx) throw new Error("useRoomMeta must be used inside RoomProvider");
  return ctx;
}

function isResult(v: Result | ArchiveState): v is Result {
  return "ok" in v;
}

export function RoomProvider({
  roomId,
  dbUrl,
  children,
  loading,
  notFound,
}: {
  roomId: string;
  dbUrl: string;
  children: ReactNode;
  loading: ReactNode;
  notFound: (message: string) => ReactNode;
}) {
  const [state, setState] = useState<ArchiveState | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [connectionStatus, setConnectionStatus] = useState<RoomConnectionStatus>("connecting");
  const [updatedAt, setUpdatedAt] = useState<number>(() => Date.now());
  const [loadError, setLoadError] = useState<string | null>(null);

  const stateRef = useRef<ArchiveState | null>(null);
  const pendingPrevYearRef = useRef<YearData | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    setState(null);
    setImages({});
    setLoadError(null);
    setConnectionStatus("connecting");

    (async () => {
      try {
        const initial = await fetchRoom(dbUrl, roomId);
        if (cancelled) return;
        if (!initial) {
          setLoadError("존재하지 않거나 삭제된 방이에요.");
          setConnectionStatus("error");
          return;
        }
        const initialState: ArchiveState = {
          version: 1,
          theme: "kitsch",
          currentYear: initial.yearData.year,
          years: [initial.yearData],
        };
        stateRef.current = initialState;
        setState(initialState);
        setImages(initial.images);
        setUpdatedAt(initial.updatedAt);
        setConnectionStatus("connected");

        saveRecentRoom({
          roomId,
          title: initial.yearData.title || `${initial.yearData.year} 최애 연말결산`,
          year: initial.yearData.year,
          visitedAt: Date.now(),
        });

        unsubscribe = subscribeRoom(
          dbUrl,
          roomId,
          (incoming) => {
            if (cancelled) return;
            setImages((prevImgs) => ({ ...prevImgs, ...incoming.images }));
            // Preserve local pending/in-flight edits so slow mobile networks don't overwrite them
            if (syncTimerRef.current !== null || inFlightRef.current > 0) return;
            const nextState: ArchiveState = {
              version: 1,
              theme: "kitsch",
              currentYear: incoming.yearData.year,
              years: [incoming.yearData],
            };
            stateRef.current = nextState;
            setState(nextState);
            setUpdatedAt(incoming.updatedAt);
            saveRecentRoom({
              roomId,
              title: incoming.yearData.title || `${incoming.yearData.year} 최애 연말결산`,
              year: incoming.yearData.year,
              visitedAt: Date.now(),
            });
          },
          (status) => {
            if (!cancelled) setConnectionStatus(status);
          },
        );
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : "방을 불러오지 못했어요.");
        setConnectionStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };
  }, [dbUrl, roomId]);

  const flushSync = useCallback(
    async (prevYear: YearData, nextYear: YearData) => {
      inFlightRef.current += 1;
      setSaveStatus("saving");
      try {
        await syncYearDiff(dbUrl, roomId, prevYear, nextYear);
        setUpdatedAt(Date.now());
        setSaveStatus("saved");
        saveRecentRoom({
          roomId,
          title: nextYear.title || `${nextYear.year} 최애 연말결산`,
          year: nextYear.year,
          visitedAt: Date.now(),
        });
      } catch (e) {
        setSaveStatus("error");
        toast.error(e instanceof Error ? e.message : "변경 사항을 서버에 저장하지 못했어요.");
      } finally {
        inFlightRef.current = Math.max(0, inFlightRef.current - 1);
      }
    },
    [dbUrl, roomId],
  );

  const apply = useCallback(
    (fn: Updater, opts?: { silent?: boolean }) => {
      const current = stateRef.current;
      if (!current) return false;
      const out = fn(current);
      let next: ArchiveState;
      if (isResult(out)) {
        if (!out.ok) {
          if (!opts?.silent) toast.error(out.error);
          return false;
        }
        next = out.state;
      } else {
        next = out;
      }

      const prevYear = current.years[0];
      const nextYear = next.years[0];
      stateRef.current = next;
      setState(next);

      if (prevYear && nextYear) {
        if (!pendingPrevYearRef.current) {
          pendingPrevYearRef.current = prevYear;
        }
        if (syncTimerRef.current !== null) {
          window.clearTimeout(syncTimerRef.current);
        }
        setSaveStatus("saving");
        syncTimerRef.current = window.setTimeout(() => {
          syncTimerRef.current = null;
          const basePrev = pendingPrevYearRef.current ?? prevYear;
          pendingPrevYearRef.current = null;
          const latestNext = stateRef.current?.years[0] ?? nextYear;
          void flushSync(basePrev, latestNext);
        }, 280);
      }

      return true;
    },
    [flushSync],
  );

  const addImageFromFile = useCallback(
    async (file: File, crop: PhotoCrop) => {
      let data: string;
      try {
        data = await compressImage(file, crop, { maxSize: 512, quality: 0.78 });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "사진을 처리하지 못했어요.");
        return null;
      }
      const id = uid();
      setImages((prev) => ({ ...prev, [id]: data }));
      inFlightRef.current += 1;
      setSaveStatus("saving");
      try {
        await uploadRoomImage(dbUrl, roomId, id, data);
        setUpdatedAt(Date.now());
        setSaveStatus("saved");
        return id;
      } catch (e) {
        setSaveStatus("error");
        toast.error(e instanceof Error ? e.message : "사진을 공유 방에 업로드하지 못했어요.");
        return null;
      } finally {
        inFlightRef.current = Math.max(0, inFlightRef.current - 1);
      }
    },
    [dbUrl, roomId],
  );

  const replaceAll = useCallback(async () => {
    toast.error("함께 만들기 방에서는 전체 백업 덮어쓰기를 지원하지 않아요.");
    return false;
  }, []);

  const resetAll = useCallback(async () => {
    toast.error("함께 만들기 방에서는 전체 초기화를 할 수 없어요.");
  }, []);

  if (loadError) return <>{notFound(loadError)}</>;
  if (!state) return <>{loading}</>;

  return (
    <RoomMetaContext.Provider
      value={{ roomId, dbUrl, connectionStatus, updatedAt, expiresAt: updatedAt + ROOM_TTL_MS }}
    >
      <ArchiveContext.Provider
        value={{
          state,
          images,
          storeKind: "indexeddb",
          saveStatus,
          apply,
          addImageFromFile,
          replaceAll,
          resetAll,
        }}
      >
        {children}
      </ArchiveContext.Provider>
    </RoomMetaContext.Provider>
  );
}
