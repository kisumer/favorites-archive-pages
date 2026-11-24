import { Download, Loader2, Share2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { canShareFile, downloadBlob, shareFile } from "@/lib/archive/download";
import { renderPosterBlob } from "@/lib/archive/render";
import type { ThemeId, YearData } from "@/lib/archive/types";
import { useArchive } from "./ArchiveProvider";

interface Ready {
  blob: Blob;
  url: string;
  file: File;
  width: number;
  height: number;
  shareable: boolean;
}

export function ExportDialog({
  open,
  onOpenChange,
  year,
  theme,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  year: YearData;
  theme: ThemeId;
}) {
  const { images } = useArchive();
  const [status, setStatus] = useState<"working" | "ready" | "error">("working");
  const [error, setError] = useState("");
  const [ready, setReady] = useState<Ready | null>(null);
  const filename = `최애아카이브-${year.year}.png`;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    let url: string | null = null;
    setStatus("working");
    setReady(null);
    // Generate first; the save/share buttons then run synchronously on tap (needed on iOS).
    renderPosterBlob(year, theme, images)
      .then((r) => {
        if (!alive) return;
        url = URL.createObjectURL(r.blob);
        const file = new File([r.blob], filename, { type: "image/png" });
        setReady({ ...r, url, file, shareable: canShareFile(file) });
        setStatus("ready");
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "이미지를 만들지 못했어요.");
        setStatus("error");
      });
    return () => {
      alive = false;
      if (url) {
        const u = url;
        setTimeout(() => URL.revokeObjectURL(u), 30_000);
      }
    };
    // Snapshot the poster when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onDownload = () => {
    if (!ready) return;
    downloadBlob(ready.blob, filename);
    toast.success("PNG 파일을 저장했어요");
  };

  const onShare = async () => {
    if (!ready) return;
    const r = await shareFile(ready.file, `${year.year} 최애 연말결산`);
    if (r === "failed") {
      toast.error("공유하지 못해서 파일로 저장할게요.");
      downloadBlob(ready.blob, filename);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-3xl border-2 border-ink p-5 shadow-pop-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">이미지로 저장하기</DialogTitle>
          <DialogDescription>
            고화질 PNG로 만들었어요. 미리보기와 똑같은 디자인이에요.
          </DialogDescription>
        </DialogHeader>

        <div className="paper-dots grid min-h-48 place-items-center overflow-hidden rounded-2xl border-2 border-ink bg-paper-deep p-3">
          {status === "working" ? (
            <p className="flex items-center gap-2 text-[15px] font-bold" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              포스터를 그리는 중…
            </p>
          ) : status === "error" ? (
            <p className="flex items-start gap-2 text-[14px] font-bold text-destructive" role="alert">
              <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : ready ? (
            <img
              src={ready.url}
              alt={`${year.year} 최애 연말결산 완성 이미지`}
              className="max-h-[48dvh] w-auto rounded-lg shadow-soft"
            />
          ) : null}
        </div>

        {ready ? (
          <p className="text-center text-[12px] font-semibold text-muted-foreground">
            {ready.width} × {ready.height}px · {(ready.blob.size / 1024 / 1024).toFixed(1)}MB
            <br />
            아이폰은 위 이미지를 길게 눌러 ‘사진 앱에 저장’도 할 수 있어요.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          {ready?.shareable ? (
            <Button variant="popPink" size="lg" className="flex-1" onClick={onShare}>
              <Share2 aria-hidden="true" />
              공유하기
            </Button>
          ) : null}
          <Button
            variant="popInk"
            size="lg"
            className="flex-1"
            onClick={onDownload}
            disabled={status !== "ready"}
          >
            <Download aria-hidden="true" />
            PNG 다운로드
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
