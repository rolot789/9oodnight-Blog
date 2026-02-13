# TAEKANG Blog

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Storage-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)

수학과 코드의 교차점을 기록하는 개인 기술 블로그입니다.  
콘텐츠 저장/인증/파일 관리는 Supabase 기반으로 동작하며, Next.js App Router 구조로 운영됩니다.

---

## What This Blog Provides

| Area | Description |
|---|---|
| Content Publishing | 게시글 작성, 수정, 삭제, 상세 조회 |
| Rich Markdown | 수식(KaTeX), GFM, 코드 하이라이팅, 목차(ToC) |
| Search | 제목/본문/태그 기반 검색 및 결과 하이라이팅 |
| Media Handling | 대표 이미지/첨부파일 업로드 및 관리 |
| SEO | `sitemap.xml`, `feed.xml`, Open Graph 이미지 |
| Security/Ops | CSP nonce, 요청 추적(`x-request-id`), 표준 API 응답 규격 |

---

## Public Features (User-Facing)

### 1. Home & Category Filtering
- 최신 게시글 중심 목록 제공
- 카테고리 필터 기반 탐색 지원
- 글 카드에서 핵심 메타데이터(카테고리, 읽기 시간, 발행일) 노출

### 2. Post Detail Experience
- Markdown/MDX 렌더링
- 수식 문법 지원: `$...$`, `$$...$$`
- 코드 블록 문법 하이라이팅
- 본문 헤딩(`h1~h3`) 기반 자동 ToC
- 첨부파일 다운로드 영역 제공

### 3. Search Experience
- `/search`에서 키워드 검색
- 제목/본문/태그를 포함한 통합 검색
- 매칭 구간 강조 및 snippet 표시

### 4. Editor Experience (Authenticated)
- `/edit` 신규 작성, `/edit?id=<postId>` 수정
- 실시간 미리보기 및 분할 뷰
- 태그 입력/삭제 인터랙션
- 대표 이미지 및 첨부파일 업로드

---

## Architecture at a Glance

```text
app/
  (public)/                 # 홈, 포스트, 검색, TODO
  (editor)/                 # 작성/수정/미리보기
  (auth)/                   # 로그인/콜백/로그아웃
  api/                      # search, todos, auth/session, auth/signout
features/
  post/search/todo/editor
    server/                 # 도메인 서버 로직
    components/             # 도메인 UI 컴포넌트
lib/
  shared/                   # 보안/응답 포맷/공용 유틸
  server/                   # 인증/관측성 유틸
  supabase/                 # Supabase client/server
proxy.ts                    # 보안 헤더, nonce, request-id 처리
docs/                       # 운영 문서
```

상세 트리는 `docs/project-tree.md`를 기준으로 관리합니다.

---

## Stack

- Framework: Next.js 16 (App Router)
- Runtime/UI: React 19 + TypeScript 5
- Styling: Tailwind CSS 4 + shadcn/ui
- Data/Auth/Storage: Supabase
- Content Processing: remark/rehype, KaTeX

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Commands

```bash
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드(webpack)
npm run build:turbo  # Turbopack 빌드(실험용)
npm run start        # 프로덕션 실행
npx tsc --noEmit     # 타입 체크
```

---

## Security & Operational Notes

- 민감정보는 저장소에 커밋하지 않고 `.env.local`로 관리합니다.
- `NEXT_PUBLIC_*`는 클라이언트 노출 가능한 값만 사용합니다.
- API 추가 시 표준 응답 스키마(`{ ok, data | error }`)를 유지합니다.
- 구조/모듈 책임이 바뀌면 `docs/project-tree.md`를 반드시 함께 업데이트합니다.

---

## Contributor References

- `AGENTS.md`
- `GEMINI.md`
- `docs/security-p0-checklist.md`
- `docs/api-errors.md`
- `docs/observability.md`
