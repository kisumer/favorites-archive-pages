import { ArrowRight, Check, Plus, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addCategory, deleteCategory, isPickEmpty, LIMITS, updateCategory } from "@/lib/archive/model";
import type { YearData } from "@/lib/archive/types";
import { cn } from "@/lib/utils";
import { useArchive } from "./ArchiveProvider";
import { useConfirm } from "./ConfirmProvider";
import { inputClass } from "./Panel";
import { Starburst } from "./Logo";

export const ONBOARDED_KEY = "choiae:onboarded";

export function Onboarding({
  open,
  onOpenChange,
  year,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  year: YearData;
}) {
  const { apply } = useArchive();
  const confirm = useConfirm();
  const [step, setStep] = useState<1 | 2>(1);

  const remove = async (id: string) => {
    const person = year.categories.find((entry) => entry.id === id);
    if (!person) return;
    const hasContent = person.coverImageId || person.quote.trim() || person.months.some((pick) => !isPickEmpty(pick));
    if (hasContent && !(await confirm({
      title: `‘${person.name || "이름 없음"}’ 참여자를 삭제할까요?`,
      description: "이 참여자의 사진과 월별 최애 기록도 함께 삭제돼요.",
      confirmText: "삭제",
      destructive: true,
    }))) return;
    apply((s) => deleteCategory(s, year.year, id));
  };

  const finish = () => {
    try {
      window.localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      // ignore
    }
    setStep(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : finish())}>
      <DialogContent className="max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border-2 border-ink p-5 shadow-pop-lg">
        <div className="flex items-center gap-2" aria-hidden="true">
          {[1, 2].map((n) => (
            <span
              key={n}
              className={cn("h-2 flex-1 rounded-full border-2 border-ink", n <= step ? "bg-pink" : "bg-card")}
            />
          ))}
        </div>
        {step === 1 ? (
          <>
            <DialogHeader>
              <p className="text-[12px] font-black tracking-[0.16em] text-muted-foreground">1 / 2</p>
              <DialogTitle className="text-2xl font-black leading-tight">어떤 최애를 모을까요?</DialogTitle>
              <DialogDescription>
                참여 인원마다 한 줄씩, 1월부터 12월까지 최애를 채워요. 이름은 나중에도 바꿀 수 있어요.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              {year.categories.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink text-sm font-black"
                    style={{ backgroundColor: c.color }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <label htmlFor={`onb-${c.id}`} className="sr-only">
                    참여자 {i + 1} 이름
                  </label>
                  <div className="relative min-w-0 flex-1">
                    <input
                      id={`onb-${c.id}`}
                      value={c.name}
                      maxLength={LIMITS.categoryName}
                      onChange={(e) => apply((s) => updateCategory(s, year.year, c.id, { name: e.target.value }))}
                      placeholder={`참여자 ${i + 1} 이름`}
                      className={cn(inputClass, "h-11 min-w-0 pr-10")}
                    />
                    {year.categories.length > 1 && (
                      <Button
                        variant="ghost"
                        size="iconSm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        aria-label={`참여자 ${i + 1} 삭제`}
                        onClick={() => void remove(c.id)}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {year.categories.length < LIMITS.categories ? (
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => apply((s) => addCategory(s, year.year))}>
                  <Plus aria-hidden="true" /> 인원 추가
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="lg" onClick={finish}>
                건너뛰기
              </Button>
              <Button variant="popInk" size="lg" className="flex-1" onClick={() => setStep(2)}>
                다음
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <p className="text-[12px] font-black tracking-[0.16em] text-muted-foreground">2 / 2</p>
              <DialogTitle className="text-2xl font-black leading-tight">달마다 채우고, 한 장으로 저장!</DialogTitle>
              <DialogDescription>이렇게 만들어요</DialogDescription>
            </DialogHeader>
            <ol className="grid gap-3 text-[14px] font-semibold">
              {[
                ["표지 사진과 말풍선 한마디를 정해요", "fill-pink"],
                ["달을 골라 최애 사진과 이름을 넣어요. 같은 사진이 이어지면 ‘여러 달에 붙여넣기’", "fill-mint"],
                ["오른쪽(모바일은 미리보기 탭)에서 바로 확인하고 PNG로 저장·공유해요", "fill-sky"],
              ].map(([t, c], i) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center">
                    <Starburst className="absolute inset-0 h-full w-full" fillClassName={c ?? "fill-lemon"} />
                    <span className="relative text-[13px] font-black">{i + 1}</span>
                  </span>
                  <span className="pt-1.5 leading-snug">{t}</span>
                </li>
              ))}
            </ol>
            <p className="rounded-2xl bg-paper-deep p-3 text-[13px] font-semibold leading-relaxed text-muted-foreground">
              사진은 업로드되지 않고 이 기기 브라우저에만 저장돼요. 자동 저장되니 언제든 이어서 만들 수 있어요.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="lg" onClick={() => setStep(1)}>
                이전
              </Button>
              <Button variant="pop" size="lg" className="flex-1" onClick={finish}>
                <Check aria-hidden="true" />
                시작하기
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
