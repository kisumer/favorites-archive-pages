import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import { buttonVariants, Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_PHOTO_CROP, getPhotoCrop, validatePhoto } from "@/lib/archive/image";
import { cn } from "@/lib/utils";
import { useArchive } from "./ArchiveProvider";

/**
 * Photo picker. Uses a real <label for> + visually-hidden <input type=file>,
 * which is the most reliable way to open the Photos picker on iOS Safari.
 */
export function PhotoField({
  imageId,
  onChange,
  label,
  emptyHint = "사진 넣기",
  size = "md",
}: {
  imageId: string | null;
  onChange: (id: string | null) => void;
  label: string;
  emptyHint?: string;
  size?: "md" | "lg";
}) {
  const { images, addImageFromFile } = useArchive();
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ file: File; url: string } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [crop, setCrop] = useState(DEFAULT_PHOTO_CROP);
  const src = imageId ? images[imageId] : undefined;

  useEffect(() => () => {
    if (pending) URL.revokeObjectURL(pending.url);
  }, [pending]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      validatePhoto(file);
      setDimensions(null);
      setCrop(DEFAULT_PHOTO_CROP);
      setPending({ file, url: URL.createObjectURL(file) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "사진을 열 수 없어요.");
    }
  };

  const saveCrop = async () => {
    if (!pending || !dimensions || busy) return;
    setBusy(true);
    try {
      const id = await addImageFromFile(pending.file, crop);
      if (id) {
        onChange(id);
        setPending(null);
        toast.success("사진을 넣었어요");
      }
    } finally {
      setBusy(false);
    }
  };

  const area = dimensions && getPhotoCrop(dimensions.width, dimensions.height, crop);

  const box = size === "lg" ? "h-36 w-36 sm:h-40 sm:w-40" : "h-24 w-24";

  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor={inputId}
        className={cn(
          "relative grid shrink-0 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-ink bg-paper-deep shadow-pop transition-transform active:translate-x-0.5 active:translate-y-0.5",
          box,
          !src && "border-dashed bg-card",
        )}
      >
        {src ? (
          <img src={src} alt={`${label} 사진`} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1 text-xs font-bold text-muted-foreground">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
            {emptyHint}
          </span>
        )}
        {busy ? (
          <span className="absolute inset-0 grid place-items-center bg-paper/80">
            <Loader2 className="h-6 w-6 animate-spin" aria-label="사진 처리 중" />
          </span>
        ) : null}
        <span className="sr-only">{label} 사진 선택</span>
      </label>
      <div className="flex flex-col gap-2">
        <div className="relative focus-within:rounded-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <label htmlFor={inputId} className={cn(buttonVariants({ variant: "paper", size: "sm" }), "cursor-pointer")}>
            {src ? <RefreshCw aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
            {src ? "사진 바꾸기" : "사진 선택"}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onFile}
            disabled={busy}
            aria-label={`${label} 사진 선택`}
          />
        </div>
        {src ? (
          <Button variant="ghostDanger" size="sm" onClick={() => onChange(null)} disabled={busy}>
            <Trash2 aria-hidden="true" />
            사진 빼기
          </Button>
        ) : (
          <p className="max-w-[11rem] text-[12px] leading-snug text-muted-foreground">
            사진은 작게 줄여서 이 기기에만 저장돼요.
          </p>
        )}
      </div>
      <Dialog open={!!pending} onOpenChange={(open) => !open && !busy && setPending(null)}>
        {pending && (
          <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border-2 border-ink p-5 shadow-pop-lg">
            <DialogHeader className="pr-10">
              <DialogTitle>사진 위치 조정</DialogTitle>
              <DialogDescription>정사각형 안에 들어갈 부분을 골라 주세요.</DialogDescription>
            </DialogHeader>
            <div className="relative mx-auto aspect-square w-full max-w-56 overflow-hidden rounded-2xl border-2 border-ink bg-paper-deep">
              <img
                src={pending.url}
                alt="사진 자르기 미리보기"
                className="absolute max-w-none"
                style={area && dimensions ? {
                  width: `${dimensions.width / area.side * 100}%`,
                  height: `${dimensions.height / area.side * 100}%`,
                  left: `${-area.left / area.side * 100}%`,
                  top: `${-area.top / area.side * 100}%`,
                } : { visibility: "hidden" }}
                onLoad={(e) => setDimensions({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight,
                })}
                onError={() => {
                  setPending(null);
                  toast.error("이 사진을 열 수 없어요. JPG나 PNG 사진으로 다시 시도해 주세요.");
                }}
              />
            </div>
            <div className="grid gap-1" aria-label="사진 조정">
              {([
                ["zoom", "확대", 1, 3],
                ["x", "가로 위치", 0, 1],
                ["y", "세로 위치", 0, 1],
              ] as const).map(([key, title, min, max]) => (
                <label key={key} className="flex min-h-9 items-center gap-3 text-sm font-bold">
                  <span className="w-16 shrink-0">{title}</span>
                  <input
                    type="range"
                    className="min-h-9 min-w-0 flex-1 accent-ink"
                    min={min}
                    max={max}
                    step={0.01}
                    value={crop[key]}
                    onChange={(e) => setCrop((current) => ({ ...current, [key]: e.target.valueAsNumber }))}
                    disabled={!dimensions || busy ||
                      (key === "x" && area?.side === dimensions.width) ||
                      (key === "y" && area?.side === dimensions.height)}
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled={busy} onClick={() => setPending(null)}>취소</Button>
              <Button variant="popInk" className="flex-1" disabled={!dimensions || busy} onClick={() => void saveCrop()}>
                {busy ? "저장 중…" : "이대로 사용"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
