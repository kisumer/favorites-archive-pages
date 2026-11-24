import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { buttonVariants, Button } from "@/components/ui/button";
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
  const src = imageId ? images[imageId] : undefined;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    const id = await addImageFromFile(file);
    setBusy(false);
    if (id) {
      onChange(id);
      toast.success("사진을 넣었어요");
    }
  };

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
    </div>
  );
}
