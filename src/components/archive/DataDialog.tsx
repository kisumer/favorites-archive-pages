import { Download, HardDrive, RotateCcw, Upload } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { backupFilename, buildBackup, parseBackupText } from "@/lib/archive/backup";
import { downloadBlob } from "@/lib/archive/download";
import { collectImageIds } from "@/lib/archive/model";
import { estimateStorage, formatBytes } from "@/lib/archive/storage";
import { cn } from "@/lib/utils";
import { useArchive } from "./ArchiveProvider";
import { useConfirm } from "./ConfirmProvider";

const KIND_LABEL = {
  indexeddb: "이 브라우저의 IndexedDB",
  localstorage: "이 브라우저의 localStorage (용량이 작아요)",
  memory: "임시 메모리 (창을 닫으면 사라져요)",
} as const;

export function DataDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, images, storeKind, replaceAll, resetAll } = useArchive();
  const confirm = useConfirm();
  const inputId = useId();
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const photoCount = collectImageIds(state).size;
  const catCount = state.years.reduce((n, y) => n + y.categories.length, 0);

  useEffect(() => {
    if (open) void estimateStorage().then(setUsage);
  }, [open, images]);

  const onExport = () => {
    downloadBlob(buildBackup(state, images), backupFilename());
    toast.success("백업 파일을 내보냈어요", { description: "다른 기기에서 ‘백업 불러오기’로 이어서 만들 수 있어요." });
  };

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    let parsed: ReturnType<typeof parseBackupText>;
    try {
      parsed = parseBackupText(await file.text());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "백업 파일을 읽지 못했어요.");
      return;
    }
    const years = parsed.state.years.map((y) => y.year).join(", ");
    const ok = await confirm({
      title: "백업으로 바꿀까요?",
      description: `지금 이 기기의 데이터가 백업(${years}년, 사진 ${Object.keys(parsed.images).length}장)으로 바뀌어요. 지금 데이터가 필요하면 먼저 내보내 주세요.`,
      confirmText: "불러오기",
    });
    if (!ok) return;
    if (await replaceAll(parsed.state, parsed.images)) {
      toast.success("백업을 불러왔어요");
      onOpenChange(false);
    }
  };

  const onReset = async () => {
    const ok = await confirm({
      title: "모든 데이터를 지울까요?",
      description: "모든 연도, 카테고리, 사진이 이 기기에서 지워지고 되돌릴 수 없어요.",
      confirmText: "모두 지우기",
      destructive: true,
    });
    if (!ok) return;
    await resetAll();
    toast.success("처음 상태로 돌아갔어요");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border-2 border-ink p-5 shadow-pop-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">내 데이터</DialogTitle>
          <DialogDescription className="leading-relaxed">
            로그인이 없어서 모든 데이터는 <b className="text-foreground">이 기기, 이 브라우저에만</b> 저장돼요.
            사진은 어디에도 업로드되지 않아요. 브라우저 기록을 지우거나 기기를 바꾸면 사라질 수 있으니 백업해 두세요.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl bg-paper-deep p-3 text-[13px] font-semibold">
          <p className="flex items-center gap-2 font-black">
            <HardDrive className="h-4 w-4" aria-hidden="true" />
            {KIND_LABEL[storeKind]}
          </p>
          <p className="mt-1 text-muted-foreground">
            연도 {state.years.length}개 · 카테고리 {catCount}개 · 사진 {photoCount}장
            {usage ? ` · 사용 ${formatBytes(usage.usage)} / 가능 ${formatBytes(usage.quota)}` : ""}
          </p>
        </div>

        <div className="grid gap-2">
          <Button variant="popInk" size="lg" onClick={onExport}>
            <Download aria-hidden="true" />
            백업 파일 내보내기 (.json)
          </Button>
          <div className="relative focus-within:rounded-2xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <label htmlFor={inputId} className={cn(buttonVariants({ variant: "paper", size: "lg" }), "w-full cursor-pointer")}>
              <Upload aria-hidden="true" />
              백업 불러오기
            </label>
            <input
              id={inputId}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={onImport}
              aria-label="백업 파일 불러오기"
            />
          </div>
          <Button variant="ghostDanger" size="lg" onClick={onReset} className="mt-2">
            <RotateCcw aria-hidden="true" />
            모두 초기화
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
