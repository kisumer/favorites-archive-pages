import { ChevronLeft, ChevronRight, ClipboardPaste, CopyPlus, Eraser, Sparkles } from "lucide-react";
import { forwardRef, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  clearPick,
  copyFromPreviousMonth,
  isPickEmpty,
  LIMITS,
  monthLabel,
  monthRange,
  pastePickToMonths,
  updatePick,
} from "@/lib/archive/model";
import { STICKER_COLORS } from "@/lib/archive/palette";
import type { Category, YearData } from "@/lib/archive/types";
import { cn } from "@/lib/utils";
import { useArchive } from "./ArchiveProvider";
import { ColorSwatches } from "./ColorSwatches";
import { useConfirm } from "./ConfirmProvider";
import { FieldLabel, inputClass, Panel } from "./Panel";
import { PhotoField } from "./PhotoField";

const MONTHS = Array.from({ length: 12 }, (_, i) => i);

export const MonthPanel = forwardRef<
  HTMLElement,
  {
    year: YearData;
    category: Category | null;
    month: number;
    onMonth: (m: number) => void;
  }
>(function MonthPanel({ year, category, month, onMonth }, ref) {
  const { apply, images } = useArchive();
  const confirm = useConfirm();
  const ids = { name: useId(), from: useId(), to: useId() };
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState(month + 1);
  const [rangeEnd, setRangeEnd] = useState(11);

  if (!category) {
    return (
      <Panel ref={ref} step="STEP 3" title="월별 최애" icon={Sparkles} accentClassName="bg-mint">
        <p className="rounded-2xl border-2 border-dashed border-input px-4 py-6 text-center text-[14px] font-semibold text-muted-foreground">
          인원을 먼저 추가하면 1월부터 12월까지 채울 수 있어요.
        </p>
      </Panel>
    );
  }

  const pick = category.months[month]!;
  const update = (patch: Partial<typeof pick>) =>
    apply((s) => updatePick(s, year.year, category.id, month, patch));

  const openRange = () => {
    const start = Math.min(11, month + 1);
    setRangeStart(start);
    setRangeEnd(11);
    setRangeOpen((o) => !o);
  };

  const doPaste = async () => {
    const targets = monthRange(rangeStart, rangeEnd).filter((m) => m !== month);
    if (targets.length === 0) {
      toast.error("붙여넣을 달을 골라 주세요.");
      return;
    }
    const overwrite = targets.filter((m) => !isPickEmpty(category.months[m]));
    if (overwrite.length > 0) {
      const ok = await confirm({
        title: "이미 채운 달이 있어요",
        description: `${overwrite.map((m) => monthLabel(m)).join(", ")}의 내용을 ${monthLabel(month)} 내용으로 바꿀까요?`,
        confirmText: "덮어쓰기",
      });
      if (!ok) return;
    }
    if (apply((s) => pastePickToMonths(s, year.year, category.id, month, targets))) {
      toast.success(`${targets.length}개월에 붙여넣었어요`);
      setRangeOpen(false);
    }
  };

  const doCopyPrev = async () => {
    if (!isPickEmpty(pick)) {
      const ok = await confirm({
        title: `${monthLabel(month)} 내용을 바꿀까요?`,
        description: `${monthLabel(month - 1)} 최애로 덮어써요.`,
        confirmText: "가져오기",
      });
      if (!ok) return;
    }
    if (apply((s) => copyFromPreviousMonth(s, year.year, category.id, month)))
      toast.success(`${monthLabel(month - 1)} 최애를 가져왔어요`);
  };

  const doClear = async () => {
    const ok = await confirm({
      title: `${monthLabel(month)}을 비울까요?`,
      description: "이름, 사진, 메모가 지워져요. 포스터에는 빈 칸으로 남아요.",
      confirmText: "비우기",
      destructive: true,
    });
    if (ok && apply((s) => clearPick(s, year.year, category.id, month))) toast.success(`${monthLabel(month)}을 비웠어요`);
  };

  const filled = category.months.filter((p) => !isPickEmpty(p)).length;

  return (
    <Panel
      ref={ref}
      step="STEP 3"
      title={`${category.name || "이름 없음"} · 월별 최애`}
      icon={Sparkles}
      accentClassName="bg-mint"
      action={
        <span className="shrink-0 rounded-full border-2 border-ink bg-lemon px-2.5 py-0.5 text-[12px] font-black tabular-nums">
          {filled}/12
        </span>
      }
    >
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2" role="group" aria-label="달 선택">
        {MONTHS.map((m) => {
          const p = category.months[m]!;
          const src = p.imageId ? images[p.imageId] : undefined;
          const active = m === month;
          const has = !isPickEmpty(p);
          return (
            <button
              key={m}
              type="button"
              aria-pressed={active}
              aria-label={`${monthLabel(m)}${p.name ? ` · ${p.name}` : has ? " · 채움" : " · 비어 있음"}`}
              onClick={() => onMonth(m)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 text-[12px] font-black transition-transform touch-manipulation sm:text-[13px]",
                active ? "border-ink shadow-pop -translate-y-0.5" : "border-input hover:border-ink",
                !src && (has ? "bg-accent" : "bg-paper-deep"),
              )}
            >
              {src ? <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
              <span
                className={cn(
                  "absolute left-1 top-1 rounded-full px-1.5 leading-5",
                  active ? "bg-ink text-paper" : "bg-card/90 text-ink",
                )}
              >
                {m + 1}
              </span>
              {has && !src ? (
                <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-ink" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border-2 border-ink bg-paper p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onMonth(Math.max(0, month - 1))}
            disabled={month === 0}
            aria-label="이전 달"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <p className="text-xl font-black" aria-live="polite">
            {monthLabel(month)}
          </p>
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => onMonth(Math.min(11, month + 1))}
            disabled={month === 11}
            aria-label="다음 달"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>

        <PhotoField
          size="lg"
          label={`${monthLabel(month)} 최애`}
          imageId={pick.imageId}
          onChange={(id) => update({ imageId: id })}
        />

        <div className="mt-4 grid gap-3">
          <div>
            <FieldLabel htmlFor={ids.name} hint={`${pick.name.length}/${LIMITS.pickName}`}>
              최애 이름
            </FieldLabel>
            <input
              id={ids.name}
              value={pick.name}
              maxLength={LIMITS.pickName}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="예: 아노코"
              className={cn(inputClass, "h-11")}
            />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-bold">별 스티커 색</p>
            <ColorSwatches
              label="별 스티커 색"
              value={pick.stickerColor}
              options={STICKER_COLORS}
              allowNone
              onChange={(hex) => update({ stickerColor: hex })}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t-2 border-dashed border-border pt-3">
          <Button variant="outline" size="sm" onClick={doCopyPrev} disabled={month === 0}>
            <CopyPlus aria-hidden="true" />
            지난달 가져오기
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={openRange}
            disabled={isPickEmpty(pick) || month === 11}
            aria-expanded={rangeOpen}
          >
            <ClipboardPaste aria-hidden="true" />
            여러 달에 붙여넣기
          </Button>
          <Button variant="ghostDanger" size="sm" onClick={doClear} disabled={isPickEmpty(pick)}>
            <Eraser aria-hidden="true" />
            비우기
          </Button>
        </div>

        {rangeOpen && !isPickEmpty(pick) ? (
          <div className="mt-3 rounded-xl bg-paper-deep p-3">
            <p className="text-[13px] font-bold">
              {monthLabel(month)} 최애({pick.name || "사진"})를 아래 달에도 똑같이 넣어요
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label htmlFor={ids.from} className="sr-only">
                시작 달
              </label>
              <select
                id={ids.from}
                value={rangeStart}
                onChange={(e) => setRangeStart(Number(e.target.value))}
                className={cn(inputClass, "h-10 w-auto pr-8")}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
              <span className="text-[13px] font-bold">부터</span>
              <label htmlFor={ids.to} className="sr-only">
                끝 달
              </label>
              <select
                id={ids.to}
                value={rangeEnd}
                onChange={(e) => setRangeEnd(Number(e.target.value))}
                className={cn(inputClass, "h-10 w-auto pr-8")}
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
              <span className="text-[13px] font-bold">까지</span>
              <Button variant="popInk" size="sm" onClick={doPaste}>
                붙여넣기
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Panel>
  );
});
