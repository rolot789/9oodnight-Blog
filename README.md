# TAEKANG Blog

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)

수학과 코드의 교차점을 기록하는 개인 기술 블로그입니다.  
이 프로젝트는 **Next.js App Router + Supabase** 기반으로, 콘텐츠 작성부터 검색/SEO/파일관리까지 하나의 워크플로우로 구성되어 있습니다.

---

## 1) 블로그 구성 개요

### 사용자 영역
- 홈: 최신 글 목록, 카테고리 기반 탐색
- 글 상세: Markdown/MDX 본문 렌더링, 수식/코드/목차/첨부파일
- 검색: 제목/본문/태그 통합 검색, 하이라이팅 스니펫

### 관리자(인증) 영역
- 에디터: 신규 작성/기존 글 수정
- 미리보기: 작성 중 결과를 실시간 확인
- 미디어 관리: 대표 이미지, 첨부파일 업로드/정리

### 시스템 영역
- API: 검색, TODO, 세션조회, 로그아웃
- 보안: CSP nonce, 요청 ID 추적(`x-request-id`), 표준 응답 포맷
- SEO: `sitemap.xml`, `feed.xml`, Open Graph 이미지 자동 생성

---

## 2) 핵심 기능 상세

### Home & 카테고리 필터
- 홈(`/(public)/page.tsx`)에서 게시글 목록을 렌더링합니다.
- 카테고리 필터를 통해 관심 주제만 빠르게 탐색할 수 있습니다.
- 카드 단위로 읽기시간/카테고리/작성일 메타데이터를 노출합니다.

### 글 상세 페이지
- 경로: `/post/[id]`
- 본문 렌더링: Markdown/MDX + GFM + KaTeX + 코드 하이라이팅
- 본문 헤딩(`h1~h3`)을 기준으로 ToC(목차)를 생성합니다.
- 첨부파일이 있으면 다운로드 목록을 페이지 하단에 표시합니다.

### 검색
- 경로: `/search`
- 제목/본문/태그를 함께 탐색하며, 검색어 매칭 지점을 시각적으로 강조합니다.
- 결과 카드에 snippet(문맥 일부)을 보여줘 클릭 전 판단을 돕습니다.

### 에디터 (로그인 필요)
- 경로: `/edit` (신규), `/edit?id=<postId>` (수정)
- 편집 항목: `title`, `category`, `excerpt`, `content`, `tags`
- 미리보기/분할화면으로 실제 렌더 결과를 즉시 확인합니다.
- 이미지/첨부파일은 Supabase Storage(`files`)에 업로드됩니다.

---

## 3) 아키텍처와 디렉터리

```text
app/
  (public)/                 # 홈, 포스트, 검색, TODO
  (editor)/                 # 작성/수정/미리보기
  (auth)/                   # 로그인/콜백/로그아웃
  api/                      # search, todos, auth/session, auth/signout
features/
  post/search/todo/editor
    server/                 # 도메인 서버 로직(쿼리/검증/비즈니스)
    components/             # 도메인 UI 컴포넌트
lib/
  shared/                   # 공통 유틸(보안, 응답포맷, 일반 함수)
  server/                   # 서버 전용(인증, observability)
  supabase/                 # Supabase client/server 생성기
proxy.ts                    # 보안 헤더, nonce, request-id 전달
docs/                       # 운영 문서(보안, 에러 규약, 트리 문서)
```

> 저장소 구조/모듈 책임이 변경되면 `docs/project-tree.md`를 반드시 함께 갱신합니다.

---

## 4) 데이터와 운영 흐름

### 데이터 저장
- 게시글/메타데이터: Supabase PostgreSQL (`posts`)
- 파일/이미지: Supabase Storage (`files`)
- 인증: Supabase Auth 세션 기반

### 요청 흐름(요약)
1. 사용자가 페이지/API 요청
2. `proxy.ts`가 nonce 및 `x-request-id`를 주입
3. Route/Page에서 도메인 서버 로직(`features/*/server`) 호출
4. Supabase 쿼리 실행 후 표준 응답 반환

### API 응답 규칙
- 공통 포맷: `{ ok, data | error }`
- 신규 API 작성 시 `lib/shared/api-response.ts` 유틸을 사용합니다.

---

## 5) 로컬 실행 방법

### Prerequisites
- Node.js 18+
- npm

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Commands

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드(webpack)
npm run build:turbo  # Turbopack 빌드(실험/비교용)
npm run start        # 프로덕션 서버 실행
npx tsc --noEmit     # 타입 체크
```

---

## 6) 콘텐츠 관리 가이드

### 새 글 작성
1. 로그인 후 `/edit` 접속
2. 제목/카테고리/요약/본문/태그 입력
3. 필요 시 이미지/첨부파일 업로드
4. 미리보기 확인 후 저장

### 기존 글 수정
1. `/edit?id=<postId>`로 진입
2. 내용 수정 후 저장
3. 상세 페이지에서 렌더/첨부/검색 반영 여부 확인

### 품질 점검 체크리스트
- 수식/코드블록 렌더 정상 여부
- ToC 생성 여부
- 검색 결과 노출 여부
- OG/SEO 메타 반영 여부

---

## 7) Screenshots

### Home
![Home Screen](public/banner.jpg)

### Post / Content Preview
![Post Preview](public/Thumbnail.jpg)

---

## 8) 보안 및 기여 규칙

- 민감정보는 절대 커밋하지 않고 `.env.local`에만 보관합니다.
- `NEXT_PUBLIC_*`에는 클라이언트 노출 가능한 값만 둡니다.
- 보안/운영 문서:
  - `docs/security-p0-checklist.md`
  - `docs/api-errors.md`
  - `docs/observability.md`
- 기여 가이드:
  - `AGENTS.md`
  - `GEMINI.md`
