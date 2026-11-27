import { createFileRoute } from "@tanstack/react-router";

import { TogetherApp } from "@/components/archive/TogetherEditor";

export const Route = createFileRoute("/together")({
  validateSearch: (search: Record<string, unknown>): { room?: string } => ({
    room: typeof search["room"] === "string" && search["room"].trim() ? search["room"].trim() : undefined,
  }),
  head: () => ({
    meta: [
      { title: "함께 만들기 · 최애 아카이브" },
      {
        name: "description",
        content: "공유 링크 하나로 로그인 없이 친구들과 함께 월별 최애 취향표·연말결산 이미지를 완성하세요.",
      },
      { property: "og:title", content: "함께 만들기 · 최애 아카이브" },
      {
        property: "og:description",
        content: "초대 링크로 친구들과 실시간으로 함께 채우는 월별 최애 연말결산.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TogetherRouteComponent,
});

function TogetherRouteComponent() {
  const { room } = Route.useSearch();
  return <TogetherApp roomId={room} />;
}
