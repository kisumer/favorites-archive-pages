import { ArrowDown, ArrowUp, Layers, Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  addCategory,
  deleteCategory,
  isPickEmpty,
  LIMITS,
  moveCategory,
  updateCategory,
} from "@/lib/archive/model";
import { CATEGORY_COLORS } from "@/lib/archive/palette";
import type { Category, YearData } from "@/lib/archive/types";
import { cn } from "@/lib/utils";
import { useArchive } from "./ArchiveProvider";
import { ColorSwatches } from "./ColorSwatches";
import { useConfirm } from "./ConfirmProvider";
import { Starburst } from "./Logo";
import { FieldLabel, inputClass, Panel } from "./Panel";
import { PhotoField } from "./PhotoField";

export function CategoryPanel({
  year,
  category,
  onSelect,
}: {
  year: YearData;
  category: Category | null;
  onSelect: (id: string | null) => void;
}) {
  const { apply } = useArchive();
  const confirm = useConfirm();
  const ids = { name: useId(), quote: useId(), badge: useId() };
  const index = category ? year.categories.findIndex((c) => c.id === category.id) : -1;

  const add = () => {
    const created: { id: string | null } = { id: null };
    const ok = apply((s) => {
      const r = addCategory(s, year.year);
      if (!r.ok) return r;
      created.id = r.id;
      return { ok: true, state: r.state };
    });
    if (ok && created.id) {
      onSelect(created.id);
      toast.success("참여자를 추가했어요", { description: "이름과 표지 사진을 정해 주세요." });
      requestAnimationFrame(() => document.getElementById(ids.name)?.focus());
    }
  };

  const remove = async () => {
    if (!category) return;
    const filled = category.months.filter((p) => !isPickEmpty(p)).length;
    const ok = await confirm({
      title: `‘${category.name || "이름 없음"}’ 참여자를 지울까요?`,
      description:
        filled > 0
          ? `채워 둔 ${filled}개월의 최애도 함께 지워지고 되돌릴 수 없어요.`
          : "이 참여자가 포스터에서 사라져요.",
      confirmText: "지우기",
      destructive: true,
    });
    if (!ok) return;
    const nextSel = year.categories[index + 1]?.id ?? year.categories[index - 1]?.id ?? null;
    if (apply((s) => deleteCategory(s, year.year, category.id))) {
      onSelect(nextSel);
      toast.success("참여자를 지웠어요");
    }
  };

  return (
    <Panel
      step="STEP 2"
      title="참여 인원"
      icon={Layers}
      accentClassName="bg-pink"
      action={
        <Button variant="pop" size="sm" onClick={add} aria-label="인원 추가">
          <Plus aria-hidden="true" />
          인원 추가
        </Button>
      }
    >
      {year.categories.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-input px-4 py-8 text-center">
          <Starburst className="h-16 w-16 animate-float" fillClassName="fill-lemon" dotted />
          <p className="mt-3 text-base font-black">아직 참여자가 없어요</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            참여자를 추가하고 월별 최애를 채워 보세요.
          </p>
          <Button variant="popInk" size="lg" className="mt-4" onClick={add}>
            <Plus aria-hidden="true" />첫 참여자 추가
          </Button>
        </div>
      ) : (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="group" aria-label="참여자 목록">
            {year.categories.map((c) => {
              const active = c.id === category?.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-2 rounded-full border-2 pl-1.5 pr-4 text-[14px] font-bold transition-colors touch-manipulation",
                    active ? "border-ink bg-ink text-paper shadow-pop" : "border-input bg-card hover:border-ink",
                  )}
                >
                  <span
                    className="h-6 w-6 rounded-full border-2 border-ink"
                    style={{ backgroundColor: c.color }}
                    aria-hidden="true"
                  />
                  <span className="max-w-[9rem] truncate">{c.name || "이름 없음"}</span>
                </button>
              );
            })}
          </div>

          {category ? (
            <div className="mt-3 space-y-4">
              <PhotoField
                label={`${category.name || "참여자"} 표지`}
                emptyHint="표지 사진"
                imageId={category.coverImageId}
                onChange={(id) => apply((s) => updateCategory(s, year.year, category.id, { coverImageId: id }))}
              />
              <div>
                <FieldLabel htmlFor={ids.name} hint={`${category.name.length}/${LIMITS.categoryName}`}>
                  참여자 이름
                </FieldLabel>
                <input
                  id={ids.name}
                  value={category.name}
                  maxLength={LIMITS.categoryName}
                  onChange={(e) => apply((s) => updateCategory(s, year.year, category.id, { name: e.target.value }))}
                  placeholder="예: 수양"
                  className={cn(inputClass, "h-11")}
                />
              </div>
              <div>
                <FieldLabel htmlFor={ids.quote} hint={`${category.quote.length}/${LIMITS.quote}`}>
                  말풍선 한마디
                </FieldLabel>
                <textarea
                  id={ids.quote}
                  value={category.quote}
                  maxLength={LIMITS.quote}
                  rows={2}
                  onChange={(e) => apply((s) => updateCategory(s, year.year, category.id, { quote: e.target.value }))}
                  placeholder="예: 올해도 너 덕분에 행복했다!"
                  className={cn(inputClass, "resize-none py-2.5 leading-snug")}
                />
              </div>
              <div>
                <p className="mb-2 text-[13px] font-bold">참여자 색</p>
                <ColorSwatches
                  label="참여자 색"
                  value={category.color}
                  options={CATEGORY_COLORS}
                  onChange={(hex) => hex && apply((s) => updateCategory(s, year.year, category.id, { color: hex }))}
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-paper-deep px-3 py-2.5">
                <label htmlFor={ids.badge} className="text-[13px] font-bold leading-snug">
                  월 동그라미를 참여자 색으로
                  <span className="block text-[12px] font-medium text-muted-foreground">끄면 달마다 무지개색</span>
                </label>
                <Switch
                  id={ids.badge}
                  checked={category.badgeMode === "category"}
                  onCheckedChange={(v) =>
                    apply((s) =>
                      updateCategory(s, year.year, category.id, { badgeMode: v ? "category" : "rainbow" }),
                    )
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t-2 border-dashed border-border pt-3">
                <span className="mr-auto text-[12px] font-bold text-muted-foreground">
                  순서 {index + 1} / {year.categories.length}
                </span>
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => apply((s) => moveCategory(s, year.year, category.id, -1))}
                  disabled={index <= 0}
                  aria-label="위로 옮기기"
                  title="위로 옮기기"
                >
                  <ArrowUp aria-hidden="true" />
                </Button>
                <Button
                  variant="outline"
                  size="iconSm"
                  onClick={() => apply((s) => moveCategory(s, year.year, category.id, 1))}
                  disabled={index >= year.categories.length - 1}
                  aria-label="아래로 옮기기"
                  title="아래로 옮기기"
                >
                  <ArrowDown aria-hidden="true" />
                </Button>
                <Button variant="ghostDanger" size="sm" disabled={year.categories.length <= 1} onClick={remove}>
                  <Trash2 aria-hidden="true" />
                  삭제
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </Panel>
  );
}
