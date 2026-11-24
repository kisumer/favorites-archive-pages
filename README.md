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

1. 기존 Lovable 사이트에 기록이 있다면 편집 화면의 **내 데이터 → 백업 파일 내보내기 (.json)**로 저장합니다. 기기나 브라우저마다 기록을 따로 저장했다면 각각 내보냅니다.
2. GitHub에 `favorites-archive` 저장소를 만들고 이 폴더의 소스를 저장소 루트에 올립니다. `.github/workflows/pages.yml`과 `package-lock.json`도 포함합니다. 개인 백업 JSON은 로컬에 보관합니다.
3. 저장소의 **Settings → Pages → Build and deployment → Source**에서 **GitHub Actions**를 선택합니다.
4. **Actions → Deploy GitHub Pages → Run workflow**에서 `main`을 선택해 실행합니다. 이후 `main`에 푸시할 때 자동 배포합니다. 저장소 이름을 달리 정해도 워크플로가 Pages의 실제 경로를 Vite에 전달합니다.
5. 실행이 성공하면 **Settings → Pages**에 표시되는 주소를 엽니다. 예시 주소는 `https://<계정>.github.io/favorites-archive/`입니다.
6. 새 사이트에서 **내 데이터 → 백업 불러오기**로 기존 JSON을 선택하고 확인합니다. 이 작업은 새 사이트에 현재 저장된 내용을 백업으로 교체합니다. 브라우저는 도메인별로 저장소를 구분하므로 주소가 바뀌면 백업을 통해 옮겨야 합니다.

[GitHub Pages 게시 소스 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 참여자

연도마다 기본 참여자 입력란이 한 개 있습니다. **연도 고르기 → 만든 사람**에서 이름을 입력하고 **참여자 추가** 또는 삭제 버튼을 사용합니다. 이름을 입력한 참여자들은 같은 연도의 미리보기와 PNG에 표시됩니다. 기존 백업의 만든 사람은 첫 참여자로 불러옵니다.
