import { Check, Type } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  injectCustomFontCss,
  MAX_CUSTOM_FONT_CSS,
  parseCustomFontFamily,
  POSTER_FONTS,
  sanitizeCustomFontCss,
} from "@/lib/archive/fonts";
import type { PosterFontId } from "@/lib/archive/types";
import { cn } from "@/lib/utils";
import { FieldLabel, inputClass } from "./Panel";

export function FontPicker({
  font,
  customFontCss,
  onChange,
}: {
  font?: PosterFontId | undefined;
  customFontCss?: string | undefined;
  onChange: (nextFont: PosterFontId, nextCustomCss?: string) => void;
}) {
  const active: PosterFontId = font ?? "default";
  const [openCustom, setOpenCustom] = useState(active === "custom");
  const [draftCss, setDraftCss] = useState(customFontCss ?? "");
  const inputId = useId();

  const currentCustomName =
    active === "custom" && customFontCss
      ? parseCustomFontFamily(sanitizeCustomFontCss(customFontCss))
      : null;

  const applyCustom = () => {
    const safe = sanitizeCustomFontCss(draftCss);
    if (!safe) {
      toast.error("눈누 등에서 복사한 @font-face 코드를 붙여넣어 주세요.");
      return;
    }
    const family = injectCustomFontCss(safe);
    if (!family) {
      toast.error("폰트 이름(font-family)을 찾을 수 없어요. @font-face 전체를 붙여넣어 주세요.");
      return;
    }
    onChange("custom", safe);
    toast.success(`‘${family}’ 웹폰트를 적용했어요`);
  };

  return (
    <div className="mt-4">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[13px] font-bold">
          <Type className="h-3.5 w-3.5" aria-hidden="true" />
          포스터 폰트
        </span>
        {currentCustomName ? (
          <span className="max-w-[10rem] truncate text-[11px] font-bold text-muted-foreground">
            적용 중: {currentCustomName}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="포스터 폰트 선택">
        {POSTER_FONTS.map((opt) => {
          const isSelected = active === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                setOpenCustom(false);
                onChange(opt.id);
              }}
              style={{ fontFamily: opt.displayFamily }}
              className={cn(
                "h-9 rounded-full border-2 px-3 text-[13px] font-bold transition-colors touch-manipulation",
                isSelected
                  ? "border-ink bg-ink text-paper shadow-pop"
                  : "border-input bg-card hover:border-ink",
              )}
            >
              {opt.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={active === "custom" || openCustom}
          onClick={() => setOpenCustom((v) => !v)}
          className={cn(
            "h-9 rounded-full border-2 px-3 text-[13px] font-bold transition-colors touch-manipulation",
            active === "custom"
              ? "border-ink bg-lemon text-ink shadow-pop"
              : "border-dashed border-ink/60 bg-card hover:border-ink",
          )}
        >
          직접 웹폰트
        </button>
      </div>

      {openCustom ? (
        <div className="mt-2.5 rounded-2xl border-2 border-ink bg-paper-deep p-3">
          <FieldLabel htmlFor={inputId}>눈누(noonnu) @font-face 코드 붙여넣기</FieldLabel>
          <textarea
            id={inputId}
            value={draftCss}
            maxLength={MAX_CUSTOM_FONT_CSS}
            rows={4}
            onChange={(e) => setDraftCss(e.target.value)}
            placeholder={"@font-face {\n  font-family: '폰트이름';\n  src: url('...') format('woff2');\n}"}
            className={cn(inputClass, "resize-none py-2 font-mono text-[12px] leading-snug")}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              눈누에서 원하는 폰트 ‘웹폰트로 사용’ 복사 → 붙여넣기
            </span>
            <Button type="button" variant="popInk" size="sm" onClick={applyCustom}>
              <Check aria-hidden="true" />
              적용
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
