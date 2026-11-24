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
