import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { addYear, deleteYear, LIMITS, parseYearInput, setCurrentYear, updateYearMeta } from "@/lib/archive/model";
import { cn } from "@/lib/utils";
import { useArchive } from "./ArchiveProvider";
import { useConfirm } from "./ConfirmProvider";
import { FieldLabel, inputClass, Panel } from "./Panel";

export function YearPanel() {
  const { state, apply } = useArchive();
  const confirm = useConfirm();
  const current = state.years.find((y) => y.year === state.currentYear);
  const [draft, setDraft] = useState("");
  const [copy, setCopy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ids = { input: useId(), copy: useId(), title: useId(), err: useId() };
  const maxYear = Math.max(...state.years.map((y) => y.year));
  const suggestion = maxYear + 1 <= 9999 ? maxYear + 1 : null;

  const create = (raw: string) => {
    const parsed = parseYearInput(raw);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const ok = apply((s) => addYear(s, parsed.year, { copyFrom: copy ? s.currentYear : null }), {
      silent: true,
    });
    if (!ok) {
      setError(
        state.years.some((y) => y.year === parsed.year)
          ? `${parsed.year}년은 이미 있어요. 위에서 골라 주세요.`
          : "연도를 만들지 못했어요.",
      );
      return;
    }
    setError(null);
    setDraft("");
    toast.success(`${parsed.year}년 취향표를 만들었어요`, {
      description: copy ? "참여자 이름·사진은 가져오고 월별 최애는 비워 뒀어요." : undefined,
    });
  };

  const onDelete = async () => {
    if (!current) return;
    if (state.years.length <= 1) {
      toast.error("연도는 최소 하나는 남아 있어야 해요.");
      return;
    }
    const ok = await confirm({
      title: `${current.year}년을 지울까요?`,
      description: "이 연도의 참여자와 월별 최애가 모두 사라지고 되돌릴 수 없어요.",
      confirmText: "지우기",
      destructive: true,
    });
    if (ok && apply((s) => deleteYear(s, current.year))) toast.success(`${current.year}년을 지웠어요`);
  };

  return (
    <Panel step="STEP 1" title="연도 고르기" icon={CalendarDays} accentClassName="bg-sky">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label="연도 목록">
        {state.years.map((y) => {
          const active = y.year === state.currentYear;
          return (
            <button
              key={y.year}
              type="button"
              aria-pressed={active}
              onClick={() => apply((s) => setCurrentYear(s, y.year))}
              className={cn(
                "h-10 shrink-0 rounded-full border-2 px-4 text-[15px] font-black tabular-nums transition-colors touch-manipulation",
                active ? "border-ink bg-ink text-paper shadow-pop" : "border-input bg-card hover:border-ink",
              )}
            >
              {y.year}
            </button>
          );
        })}
      </div>

      <form
        className="mt-4 rounded-2xl bg-paper-deep p-3"
        onSubmit={(e) => {
          e.preventDefault();
          create(draft);
        }}
        noValidate
      >
        <FieldLabel htmlFor={ids.input}>새 연도 추가</FieldLabel>
        <div className="flex gap-2">
          <input
            id={ids.input}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 4));
              if (error) setError(null);
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={4}
            placeholder={suggestion ? `예: ${suggestion}` : "예: 2027"}
            aria-invalid={!!error}
            aria-describedby={error ? ids.err : undefined}
            className={cn(inputClass, "h-11 min-w-0 flex-1 tabular-nums")}
          />
          <Button type="submit" variant="popInk" className="h-11 shrink-0">
            <Plus aria-hidden="true" />
            추가
          </Button>
        </div>
        {error ? (
          <p id={ids.err} role="alert" className="mt-2 text-[13px] font-bold text-destructive">
            {error}
          </p>
        ) : null}
        <div className="mt-3 flex items-center gap-2">
          <Checkbox
            id={ids.copy}
            checked={copy}
            onCheckedChange={(v) => setCopy(v === true)}
            className="h-5 w-5 rounded-md border-2 border-ink"
          />
          <label htmlFor={ids.copy} className="text-[13px] font-semibold leading-snug">
            지금 연도({state.currentYear})의 참여자 이름·한마디·사진 가져오기
          </label>
        </div>
        {suggestion && !state.years.some((y) => y.year === suggestion) ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 px-2 text-[13px]"
            onClick={() => create(String(suggestion))}
          >
            <Plus aria-hidden="true" />
            {suggestion}년 바로 만들기
          </Button>
        ) : null}
      </form>

      {current ? (
        <div className="mt-4">
          <div>
            <FieldLabel htmlFor={ids.title} hint={`${current.title.length}/${LIMITS.title}`}>
              포스터 제목
            </FieldLabel>
            <input
              id={ids.title}
              value={current.title}
              maxLength={LIMITS.title}
              onChange={(e) => apply((s) => updateYearMeta(s, current.year, { title: e.target.value }))}
              placeholder={`${current.year} 최애 연말결산`}
              className={cn(inputClass, "h-11")}
            />
          </div>
        </div>
      ) : null}

      {state.years.length > 1 ? (
        <Button variant="ghostDanger" size="sm" className="mt-3 px-2" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          {state.currentYear}년 지우기
        </Button>
      ) : null}
    </Panel>
  );
}
