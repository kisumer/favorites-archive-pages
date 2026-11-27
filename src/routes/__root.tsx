import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground">페이지를 찾을 수 없어요</h2>
        <p className="mt-2 text-sm text-muted-foreground">주소가 바뀌었거나 없는 페이지예요.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
          >
            처음으로
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">페이지를 불러오지 못했어요</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          잠시 후 다시 시도해 주세요. 저장된 데이터는 이 기기에 그대로 있어요.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground"
          >
            다시 시도
          </button>
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-xl border-2 border-input bg-card px-5 text-sm font-bold text-foreground"
          >
            처음으로
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { title: "최애 아카이브" },
      {
        name: "description",
        content: "열두 달의 최애를 한 장에. 로그인 없이 바로 만드는 월별 최애 취향표·연말결산 이미지 메이커.",
      },
      { name: "author", content: "최애 아카이브" },
      { property: "og:site_name", content: "최애 아카이브" },
      { property: "og:locale", content: "ko_KR" },
      { property: "og:title", content: "최애 아카이브" },
      {
        property: "og:description",
        content: "열두 달의 최애를 한 장에. 로그인 없이 바로 만드는 월별 최애 취향표.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <Outlet />
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
