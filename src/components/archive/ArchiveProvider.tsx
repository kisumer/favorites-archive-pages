import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { compressImage, type PhotoCrop } from "@/lib/archive/image";
import { collectImageIds, createDefaultState, normalizeState, uid } from "@/lib/archive/model";
import {
  isQuotaError,
  openStore,
  StorageQuotaError,
  type ArchiveStore,
  type StoreKind,
} from "@/lib/archive/storage";
import type { ArchiveState, Result } from "@/lib/archive/types";

export type SaveStatus = "saved" | "saving" | "error";

export type Updater = (s: ArchiveState) => Result | ArchiveState;

export interface ArchiveContextValue {
  state: ArchiveState;
  images: Record<string, string>;
  storeKind: StoreKind;
  saveStatus: SaveStatus;
  /** Apply a pure update. Shows the error as a toast and returns false when it fails. */
  apply: (fn: Updater, opts?: { silent?: boolean }) => boolean;
  addImageFromFile: (file: File, crop: PhotoCrop) => Promise<string | null>;
  replaceAll: (state: ArchiveState, images: Record<string, string>) => Promise<boolean>;
  resetAll: () => Promise<void>;
}

export const ArchiveContext = createContext<ArchiveContextValue | null>(null);

export function useArchive(): ArchiveContextValue {
  const ctx = useContext(ArchiveContext);
  if (!ctx) throw new Error("useArchive must be used inside ArchiveProvider");
  return ctx;
}

function isResult(v: Result | ArchiveState): v is Result {
  return "ok" in v;
}

export function ArchiveProvider({
  children,
  loading,
}: {
  children: ReactNode;
  loading: ReactNode;
}) {
  const [state, setState] = useState<ArchiveState | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [storeKind, setStoreKind] = useState<StoreKind>("indexeddb");
  const stateRef = useRef<ArchiveState | null>(null);
  const storeRef = useRef<ArchiveStore | null>(null);
  const skipSave = useRef(true);
  const quotaWarned = useRef(false);

  // load once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const store = await openStore();
      storeRef.current = store;
      let loadedState: ArchiveState | null = null;
      let imgs: Record<string, string> = {};
      try {
        const raw = await store.loadState();
        loadedState = raw ? normalizeState(raw) : null;
        if (raw && !loadedState) toast.error("저장된 데이터를 읽지 못해 새로 시작해요.");
        imgs = await store.loadImages();
      } catch {
        toast.error("저장된 데이터를 불러오지 못했어요. 새로 시작해요.");
      }
      const s = loadedState ?? createDefaultState();
      // remove photos no longer used anywhere
      const used = collectImageIds(s);
      const orphans = Object.keys(imgs).filter((id) => !used.has(id));
      if (orphans.length > 0) {
        void store.deleteImages(orphans).catch(() => undefined);
        for (const id of orphans) delete imgs[id];
      }
      if (cancelled) return;
      stateRef.current = s;
      skipSave.current = !loadedState ? false : true;
      setStoreKind(store.kind);
      setImages(imgs);
      setState(s);
      if (store.kind === "memory") {
        toast.warning("이 브라우저에서는 저장이 안 돼요. 창을 닫기 전에 이미지를 저장해 주세요.", {
          duration: 8000,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // debounced autosave
  useEffect(() => {
    if (!state || !storeRef.current) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    setSaveStatus("saving");
    const store = storeRef.current;
    const t = setTimeout(() => {
      store
        .saveState(state)
        .then(() => {
          setSaveStatus("saved");
          quotaWarned.current = false;
        })
        .catch((e: unknown) => {
          setSaveStatus("error");
          if (!quotaWarned.current) {
            quotaWarned.current = true;
            toast.error(
              isQuotaError(e)
                ? new StorageQuotaError().message
                : "자동 저장에 실패했어요. 백업 파일을 내보내 두세요.",
            );
          }
        });
    }, 350);
    return () => clearTimeout(t);
  }, [state]);

  // flush on tab hide (mobile Safari kills background tabs)
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden" && stateRef.current && storeRef.current) {
        void storeRef.current.saveState(stateRef.current).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  const apply = useCallback((fn: Updater, opts?: { silent?: boolean }) => {
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
    } else next = out;
    stateRef.current = next;
    setState(next);
    return true;
  }, []);

  const addImageFromFile = useCallback(async (file: File, crop: PhotoCrop) => {
    const store = storeRef.current;
    if (!store) return null;
    let data: string;
    try {
      data = await compressImage(file, crop);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "사진을 처리하지 못했어요.");
      return null;
    }
    const id = uid();
    try {
      await store.putImage(id, data);
    } catch (e) {
      toast.error(isQuotaError(e) ? new StorageQuotaError().message : "사진을 저장하지 못했어요.");
      return null;
    }
    setImages((prev) => ({ ...prev, [id]: data }));
    return id;
  }, []);

  const replaceAll = useCallback(async (next: ArchiveState, imgs: Record<string, string>) => {
    const store = storeRef.current;
    if (!store) return false;
    try {
      await store.clearAll();
      for (const [id, data] of Object.entries(imgs)) await store.putImage(id, data);
      await store.saveState(next);
    } catch (e) {
      toast.error(isQuotaError(e) ? new StorageQuotaError().message : "백업을 불러오는 중 문제가 생겼어요.");
      return false;
    }
    skipSave.current = true;
    stateRef.current = next;
    setImages(imgs);
    setState(next);
    setSaveStatus("saved");
    return true;
  }, []);

  const resetAll = useCallback(async () => {
    const store = storeRef.current;
    const fresh = createDefaultState();
    try {
      await store?.clearAll();
      await store?.saveState(fresh);
    } catch {
      toast.error("초기화 중 문제가 생겼어요. 다시 시도해 주세요.");
      return;
    }
    skipSave.current = true;
    stateRef.current = fresh;
    setImages({});
    setState(fresh);
    setSaveStatus("saved");
  }, []);

  if (!state) return <>{loading}</>;

  return (
    <ArchiveContext.Provider
      value={{ state, images, storeKind, saveStatus, apply, addImageFromFile, replaceAll, resetAll }}
    >
      {children}
    </ArchiveContext.Provider>
  );
}
