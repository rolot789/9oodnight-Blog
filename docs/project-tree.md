# Project Tree Guide

이 문서는 `my_blog` 프로젝트의 현재 디렉터리 구조와 각 요소의 역할을 설명합니다.

## 1) Top-Level Tree

```text
my_blog/
├── app/                    # Next.js App Router (페이지/라우트/메타)
├── components/             # 공용 UI/뷰 컴포넌트
├── docs/                   # 운영/보안/API 문서
├── features/               # 도메인별 기능 모듈 (post/search/todo/editor)
├── lib/                    # 공용 로직/유틸/서버 헬퍼
├── public/                 # 정적 에셋
├── .github/                # GitHub Actions/자동화 설정
├── proxy.ts                # 전역 프록시(보안 헤더/CSP/request-id/인증 가드)
├── next.config.mjs         # Next.js 설정 (헤더/캐시/이미지 등)
├── package.json            # 스크립트/의존성
├── tsconfig.json           # TypeScript 설정
├── postcss.config.mjs      # PostCSS 설정
├── supabase_schema.sql     # Supabase 예시 스키마(일부)
└── README.md               # 프로젝트 개요/사용법
```

## 2) `app/` (라우팅 계층)

```text
app/
├── (public)/               # 공개 라우트 그룹
│   ├── page.tsx            # 홈/포스트 목록
│   ├── post/
│   │   ├── page.tsx        # /post?id=... 리다이렉트 처리
│   │   └── [id]/
│   │       ├── page.tsx    # 포스트 상세
│   │       └── opengraph-image.tsx  # 포스트별 동적 OG 이미지
│   ├── search/
│   │   ├── page.tsx        # 검색 UI
│   │   └── loading.tsx     # 검색 로딩 UI
│   └── todo/page.tsx       # TODO 화면
├── (editor)/               # 에디터 라우트 그룹
│   └── edit/
│       ├── page.tsx        # 편집 화면 엔트리
│       ├── EditForm.tsx    # 편집 폼 메인
│       └── preview/page.tsx # 편집 미리보기
├── (auth)/                 # 인증 라우트 그룹
│   ├── login/page.tsx
│   └── auth/
│       ├── callback/route.ts # OAuth 콜백
│       └── signout/route.ts  # 레거시 signout redirect
├── api/                    # 서버 API 라우트
│   ├── search/route.ts
│   ├── todos/route.ts
│   ├── todos/[id]/route.ts
│   └── auth/
│       ├── session/route.ts
│       └── signout/route.ts
├── feed.xml/route.ts       # RSS 라우트
├── sitemap.xml/route.ts    # sitemap 라우트
├── opengraph-image.tsx     # 사이트 기본 OG 이미지
├── actions.ts              # Server Actions
├── layout.tsx              # 루트 레이아웃
└── globals.css             # 전역 스타일
```

## 3) `features/` (도메인 계층)

```text
features/
├── post/
│   ├── components/         # 포스트 전용 UI (목차/관련글/마크다운 렌더러)
│   └── server/             # 포스트 도메인 서버 로직 (home/post/feed/sitemap)
├── search/
│   └── server/search.ts    # 검색/자동완성/인기태그 서버 로직
├── todo/
│   └── server/todos.ts     # TODO CRUD 서버 로직
└── editor/
    └── components/         # 에디터 전용 UI (블록 에디터/실시간 프리뷰)
```

## 4) `components/` (공용 UI 계층)

```text
components/
├── layout/Header.tsx       # 상단 네비게이션
├── ui/                     # shadcn 기반 공용 UI primitive
├── BlockNoteViewer*.tsx    # BlockNote 렌더링
├── CodeBlock.tsx           # 코드 블록 렌더링
├── LogoutButton.tsx        # 로그아웃 버튼
├── mdx-components.tsx      # MDX 렌더 컴포넌트 매핑
└── mdx-preview-renderer.tsx # 미리보기 렌더러
```

## 5) `lib/` (공통 로직)

```text
lib/
├── supabase/
│   ├── client.ts           # 브라우저용 Supabase 클라이언트
│   └── server.ts           # 서버용 Supabase 클라이언트
├── shared/
│   ├── api-response.ts     # API 응답 표준 타입
│   ├── csp.ts              # CSP 문자열 빌더
│   ├── security.ts         # 보안 유틸(JSON-LD/검색 정규화/HTML sanitize)
│   └── utils.ts            # 공용 유틸 함수
├── server/
│   ├── auth.ts             # 서버 인증 공통 처리(signout 등)
│   └── observability.ts    # request-id/구조화 로그/에러 응답 헬퍼
├── seo/index.ts            # 메타데이터/JSON-LD/SEO 설정
├── mdx/index.ts            # MDX 처리 로직
├── constants.ts            # 카테고리/상수
└── types.ts                # 공용 타입(Post/Todo)
```

## 6) `docs/` (문서)

```text
docs/
├── security-p0-checklist.md # 보안 P0 체크리스트
├── api-errors.md            # API 에러코드 규약
├── observability.md         # 관측/로깅 가이드
└── project-tree.md          # 현재 문서
```

## 7) 기타 핵심 파일

- `proxy.ts`: CSP nonce, 보안 헤더, request-id 전파, 보호 라우트 인증 체크.
- `next.config.mjs`: 캐시 정책, 헤더 정책, 이미지 설정, 빌드 동작.
- `package.json`:
  - `build`: `next build --webpack` (현재 환경 안정화용)
  - `build:turbo`: Turbopack 빌드 테스트용.
- `supabase_schema.sql`: `todos` 테이블/정책 예시. 실제 운영 정책은 Supabase 콘솔 기준으로 관리.

---

참고: `.next/`, `node_modules/`, `.git`은 빌드/의존성/형상관리 산출물로 본 문서에서 제외했습니다.
