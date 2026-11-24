import { describe, expect, it } from "vitest";

import { buildBackupJson, parseBackupText } from "./backup";
import {
  addCategory,
  addParticipant,
  addYear,
  copyFromPreviousMonth,
  createDefaultState,
  deleteCategory,
  deleteParticipant,
  deleteYear,
  getYear,
  monthRange,
  moveCategory,
  normalizeState,
  parseYearInput,
  pastePickToMonths,
  updateCategory,
  updatePick,
  updateParticipant,
} from "./model";
import type { ArchiveState, Result } from "./types";

function ok(r: Result): ArchiveState {
  if (!r.ok) throw new Error(r.error);
  return r.state;
}

describe("years", () => {
  it("starts on 2026 with one empty participant row of exactly 12 months", () => {
    const s = createDefaultState(2026);
    expect(s.currentYear).toBe(2026);
    const y = getYear(s)!;
    expect(y.categories).toHaveLength(1);
    for (const c of y.categories) {
      expect(c.months).toHaveLength(12);
      expect(c.months.every((p) => !p.name && !p.imageId)).toBe(true);
    }
  });

  it("accepts only 4-digit years", () => {
    expect(parseYearInput("2027")).toEqual({ ok: true, year: 2027 });
    expect(parseYearInput("1999").ok).toBe(true);
    expect(parseYearInput("27").ok).toBe(false);
    expect(parseYearInput("20270").ok).toBe(false);
    expect(parseYearInput("abcd").ok).toBe(false);
  });

  it("rejects a duplicate year", () => {
    const s = createDefaultState(2026);
    expect(addYear(s, 2026).ok).toBe(false);
  });

  it("new year copies category metadata but leaves monthly picks empty", () => {
    let s = createDefaultState(2026);
    const cat = getYear(s)!.categories[0]!;
    s = ok(updateCategory(s, 2026, cat.id, { name: "최애 그룹", quote: "사랑해", coverImageId: "img-cover" }));
    s = ok(updatePick(s, 2026, cat.id, 3, { name: "카리나", imageId: "img-1" }));
    s = ok(addYear(s, 2027, { copyFrom: 2026 }));
    expect(s.currentYear).toBe(2027);
    const copied = getYear(s, 2027)!.categories[0]!;
    expect(copied.name).toBe("최애 그룹");
    expect(copied.quote).toBe("사랑해");
    expect(copied.coverImageId).toBe("img-cover");
    expect(copied.id).not.toBe(cat.id);
    expect(copied.months).toHaveLength(12);
    expect(copied.months.every((p) => p.name === "" && p.imageId === null)).toBe(true);
    // the original year keeps its pick
    expect(getYear(s, 2026)!.categories[0]!.months[3]!.name).toBe("카리나");
  });

  it("supports past years and keeps years sorted", () => {
    let s = createDefaultState(2026);
    s = ok(addYear(s, 2019, { copyFrom: null }));
    expect(s.years.map((y) => y.year)).toEqual([2019, 2026]);
  });

  it("cannot delete the last remaining year", () => {
    const s = createDefaultState(2026);
    expect(deleteYear(s, 2026).ok).toBe(false);
  });
});

describe("categories", () => {
  it("allows six participants and preserves larger legacy years", () => {
    let state = createDefaultState(2026);
    for (let i = 1; i < 6; i++) state = ok(addCategory(state, 2026));
    expect(getYear(state)?.categories).toHaveLength(6);
    expect(addCategory(state, 2026).ok).toBe(false);

    const oldYear = getYear(state)!;
    oldYear.categories.push({ ...oldYear.categories[0]!, id: "legacy-seventh" });
    const restored = normalizeState(state)!;
    expect(getYear(restored)?.categories.at(-1)?.id).toBe("legacy-seventh");
    const next = ok(addYear(restored, 2027, { copyFrom: 2026 }));
    expect(getYear(next, 2026)?.categories).toHaveLength(7);
    expect(getYear(next, 2027)?.categories).toHaveLength(6);
  });

  it("adds, reorders and deletes", () => {
    let s = createDefaultState(2026);
    const r = addCategory(s, 2026, "올해의 노래");
    if (!r.ok) throw new Error(r.error);
    s = r.state;
    let cats = getYear(s)!.categories;
    expect(cats).toHaveLength(2);
    expect(cats[1]!.name).toBe("올해의 노래");
    s = ok(moveCategory(s, 2026, r.id, -1));
    cats = getYear(s)!.categories;
    expect(cats[0]!.id).toBe(r.id);
    expect(moveCategory(s, 2026, cats[0]!.id, -1).ok).toBe(false);
    s = ok(deleteCategory(s, 2026, r.id));
    expect(getYear(s)!.categories).toHaveLength(1);
  });
});

describe("monthly picks", () => {
  it("copies the previous month", () => {
    let s = createDefaultState(2026);
    const id = getYear(s)!.categories[0]!.id;
    expect(copyFromPreviousMonth(s, 2026, id, 0).ok).toBe(false);
    expect(copyFromPreviousMonth(s, 2026, id, 1).ok).toBe(false); // January empty
    s = ok(updatePick(s, 2026, id, 0, { name: "윈터", imageId: "a" }));
    s = ok(copyFromPreviousMonth(s, 2026, id, 1));
    expect(getYear(s)!.categories[0]!.months[1]).toMatchObject({ name: "윈터", imageId: "a" });
  });

  it("pastes a month across a range without touching the source", () => {
    let s = createDefaultState(2026);
    const id = getYear(s)!.categories[0]!.id;
    s = ok(updatePick(s, 2026, id, 2, { name: "해찬", imageId: "x" }));
    s = ok(pastePickToMonths(s, 2026, id, 2, monthRange(2, 5)));
    const months = getYear(s)!.categories[0]!.months;
    expect(months.slice(2, 6).every((p) => p.name === "해찬" && p.imageId === "x")).toBe(true);
    expect(months[6]!.name).toBe("");
    expect(months[1]!.name).toBe("");
  });

  it("rejects months outside 1-12", () => {
    const s = createDefaultState(2026);
    const id = getYear(s)!.categories[0]!.id;
    expect(updatePick(s, 2026, id, 12, { name: "x" }).ok).toBe(false);
  });
});

describe("persistence", () => {
  it("normalizes corrupted data back to 12 months", () => {
    const n = normalizeState({
      currentYear: 2025,
      years: [{ year: 2025, categories: [{ name: "a", months: [{ name: "b" }] }] }],
    });
    expect(n?.years[0]?.categories[0]?.months).toHaveLength(12);
    expect(normalizeState({ nope: true })).toBeNull();
  });

  it("round-trips a backup with only used photos", async () => {
    let s = createDefaultState(2026);
    const id = getYear(s)!.categories[0]!.id;
    s = ok(updatePick(s, 2026, id, 0, { name: "a", imageId: "used" }));
    const json = buildBackupJson(s, { used: "data:image/jpeg;base64,AAA", unused: "data:image/jpeg;base64,BBB" });
    const parsed = parseBackupText(json);
    expect(Object.keys(parsed.images)).toEqual(["used"]);
    expect(getYear(parsed.state)!.categories[0]!.months[0]!.name).toBe("a");
    expect(() => parseBackupText("{}")).toThrow();
  });
});

describe("participants", () => {
  it("loads an existing author and retains new participants through a backup round trip", () => {
    let state = createDefaultState(2026);
    state.years[0]!.author = "기존 작성자";
    state = parseBackupText(buildBackupJson(state, {})).state;
    expect(getYear(state)?.coauthors ?? []).toEqual([]);
    expect(deleteParticipant(state, 2026, 0).ok).toBe(false);

    state = ok(addParticipant(state, 2026));
    state = ok(updateParticipant(state, 2026, 1, "두 번째 참여자"));
    state = parseBackupText(buildBackupJson(state, {})).state;
    expect(getYear(state)).toMatchObject({ author: "기존 작성자", coauthors: ["두 번째 참여자"] });

    state = ok(deleteParticipant(state, 2026, 0));
    expect(getYear(state)).toMatchObject({ author: "두 번째 참여자", coauthors: [] });
  });
});
