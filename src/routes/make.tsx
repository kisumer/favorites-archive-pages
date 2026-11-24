import { createFileRoute } from "@tanstack/react-router";

import { EditorApp } from "@/components/archive/Editor";

export const Route = createFileRoute("/make")({
  head: () => ({
    meta: [
      { title: "내 취향표 만들기 · 최애 아카이브" },
      {
        name: "description",
        content: "카테고리와 달마다 최애 사진을 채우고 고화질 PNG 연말결산 이미지로 저장하세요. 로그인 없이, 사진은 내 기기에만.",
      },
      { property: "og:title", content: "내 취향표 만들기 · 최애 아카이브" },
      {
        property: "og:description",
        content: "열두 달의 최애를 채워 한 장의 연말결산 이미지로. 로그인 없이 바로 시작.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorApp,
});
