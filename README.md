# 최애 아카이브

월별 최애를 모아 연말결산 포스터를 만드는 사이트입니다. React 19, TypeScript, TanStack Router, Vite, Tailwind CSS를 사용합니다. Vite가 빌드한 `dist/`를 GitHub Pages에 배포합니다. 사진 편집, 자동 저장, PNG 생성은 모두 브라우저에서 실행됩니다.

## 로컬에서 확인하기

Node.js 24와 npm을 사용합니다.

```sh
npm ci
npm test
npm run typecheck
PAGES_BASE_PATH=/favorites-archive/ npm run build
npm run preview
```

미리보기에서 Vite가 표시하는 주소 뒤에 `/favorites-archive/`를 붙입니다. 개발 서버는 `npm run dev`로 실행합니다. 빌드 결과에는 홈의 `index.html`과 편집 화면의 `make/index.html`이 있어 편집 화면을 바로 열거나 새로고침할 수 있습니다.

## GitHub Pages에 배포하기

`kisumer/favorites-archive-pages` 저장소의 **Settings → Pages → Build and deployment → Source**는 **GitHub Actions**로 설정되어 있습니다. `main`에 푸시하면 자동으로 배포되며 **Actions → Deploy GitHub Pages**에서 실행 상태를 확인할 수 있습니다.

[최애 아카이브](https://kisumer.github.io/favorites-archive-pages/) · [GitHub Pages 게시 소스 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 방문 통계

1. Google 애널리틱스 **관리 → 데이터 스트림**에서 사이트의 웹 스트림을 선택하고 `G-`로 시작하는 측정 ID를 복사합니다.
2. GitHub 저장소 **Settings → Secrets and variables → Actions → Variables**에서 `GA4_MEASUREMENT_ID` 변수에 ID를 넣습니다. 변수가 비어 있으면 분석 태그가 삽입되지 않습니다.
3. **Actions → Deploy GitHub Pages → Run workflow**에서 `main`을 재배포합니다.
4. 배포한 사이트를 방문하고 Google 애널리틱스의 **보고서 → 실시간**에서 데이터가 들어오는지 확인합니다.

사이트의 사진과 편집 내용은 브라우저에 저장되며, 분석 코드로 전달하지 않습니다. 광고 개인화와 Google 신호 데이터 수집은 분석 태그에서 끕니다. Google Analytics는 통계 측정에 쿠키를 사용할 수 있습니다.
