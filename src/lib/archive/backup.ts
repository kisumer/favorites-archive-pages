import { collectImageIds, normalizeState } from "./model";
import type { ArchiveState } from "./types";

export const BACKUP_APP = "choiae-archive";

export function buildBackupJson(state: ArchiveState, images: Record<string, string>): string {
  const used = collectImageIds(state);
  const imgs: Record<string, string> = {};
  for (const id of used) {
    const d = images[id];
    if (d) imgs[id] = d;
  }
  const payload = {
    app: BACKUP_APP,
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
    images: imgs,
  };
  return JSON.stringify(payload);
}

export function buildBackup(state: ArchiveState, images: Record<string, string>): Blob {
  return new Blob([buildBackupJson(state, images)], { type: "application/json" });
}

export function backupFilename(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `choiae-archive-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`;
}

export function parseBackupText(text: string): { state: ArchiveState; images: Record<string, string> } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("백업 파일을 읽을 수 없어요. 최애 아카이브에서 내보낸 .json 파일인지 확인해 주세요.");
  }
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r !== "object" || r["app"] !== BACKUP_APP) {
    throw new Error("최애 아카이브 백업 파일이 아니에요.");
  }
  const state = normalizeState(r["state"]);
  if (!state) throw new Error("백업 파일 안에 연도 데이터가 없어요.");
  const images: Record<string, string> = {};
  const rawImages = r["images"];
  if (rawImages && typeof rawImages === "object") {
    for (const [id, v] of Object.entries(rawImages as Record<string, unknown>)) {
      if (typeof v === "string" && v.startsWith("data:image/")) images[id] = v;
    }
  }
  return { state, images };
}
