import { ShieldCheck } from "lucide-react";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={className}>
      <div className="mx-auto max-w-5xl px-5 py-10 text-center text-[13px] leading-relaxed text-muted-foreground">
        <p className="inline-flex items-center gap-1.5 font-bold text-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          내 사진은 내 기기에만
        </p>
        <p className="mt-2">
          최애 아카이브는 로그인이 없고, 올린 사진과 글을 어떤 서버에도 보내지 않아요.
          <br className="hidden sm:block" />
          모든 데이터는 지금 쓰는 브라우저 안에만 저장되니, 기기를 바꾸기 전엔 백업 파일을 내보내 주세요.
        </p>
        <p className="mt-4 text-[12px]">© 최애 아카이브 · 팬이 만드는 연말결산</p>
      </div>
    </footer>
  );
}
