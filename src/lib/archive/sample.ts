import { createCategory } from "./model";
import type { YearData } from "./types";

/** Demo poster for the landing page (names only, no photos). Built lazily, never at module scope. */
export function buildSampleYear(year: number): YearData {
  const a = createCategory("최애 그룹", "#FFB3D1");
  a.quote = "올해도 너희 덕분에 버텼다!";
  ["루미", "루미", "하늘", "", "하늘", "하늘", "빛나", "빛나", "", "루미", "루미", "모두"].forEach((n, i) => {
    a.months[i]!.name = n;
  });
  a.months[6]!.stickerColor = "#FFF07A";
  a.months[11]!.stickerColor = "#9FEBC9";
  const b = createCategory("올해의 노래", "#A9D4FF");
  b.quote = "출근길 무한반복 플리";
  b.badgeMode = "category";
  ["봄바람", "", "Signal", "Signal", "여름밤", "파도", "", "Neon", "가을편지", "", "첫눈", "Last Dance"].forEach(
    (n, i) => {
      b.months[i]!.name = n;
    },
  );
  return { year, title: "", author: "@my_favorites", categories: [a, b] };
}
