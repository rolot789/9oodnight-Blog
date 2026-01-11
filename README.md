# TAEKANG Blog

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/9oodnights-projects/v0-preview)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/zrf1gR38rI2)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

> *Exploring the intersection of Mathematics and Code*

수학과 코드의 교차점을 탐구하는 개인 기술 블로그입니다.

이 저장소의 `my_blog/`는 Next.js(App Router) 기반으로 구성되어 있으며, 콘텐츠는 **Supabase(PostgreSQL) `posts` 테이블**에 저장되고, 이미지/첨부파일은 **Supabase Storage(`files` 버킷)** 를 사용합니다.

## ✨ 주요 기능

### 🏠 홈(목록) + 카테고리 필터
- `/`에서 최신 글부터 정렬되어 게시글 목록을 보여줍니다.
- 왼쪽 사이드바의 카테고리를 클릭하면 `/?category=...`로 필터링합니다.
- 로그인(세션)이 있는 경우 상단에 **CREATE** 버튼이 나타나 `/edit`로 이동합니다.

### 📝 글 작성/수정(에디터)
- `/edit`에서 새 글을 작성합니다.
- `/edit?id=<postId>`로 들어가면 기존 글을 불러와 수정합니다.
- 필드 구성
	- `title`, `category`, `excerpt`, `content`
	- `tags`: 입력창에서 **Enter**로 태그 추가 / 배지 클릭으로 삭제
	- 대표 이미지(Featured Image): 업로드 시 Storage에 저장하고 `image_url`, `featured_image_path`로 관리
	- 첨부파일(Attachments): 여러 파일 업로드 가능, 목록에서 다운로드/삭제
- 읽기 시간(`read_time`)은 `content`의 단어 수를 기준으로 대략 계산합니다(200 wpm 기준).

### 👀 미리보기
- 에디터에서 **PREVIEW/SPLIT VIEW** 토글로 작성 화면과 미리보기를 함께 볼 수 있습니다.
- 전용 미리보기 페이지(`/edit/preview`)는 로컬스토리지에 저장한 내용을 읽어 렌더링합니다.

### 📄 글 상세(렌더링)
- `/post/[id]`에서 게시글을 로드하여 본문을 렌더링합니다.
- 본문 기능
	- **수식 렌더링(KaTeX)**: `$...$`, `$$...$$`
	- **GFM**: 표/체크박스/취소선 등
	- **코드 하이라이팅**: Prism 기반 코드블록 + 라인번호
	- **목차(ToC)**: 본문 내 `h1~h3`를 자동 수집하여 우측 사이드바에 표시(큰 화면에서만)
- 첨부파일이 있는 경우 하단에 다운로드 목록을 출력합니다.

### 🔍 검색
- `/search`에서 제목/본문(그리고 태그 검색용 문자열 컬럼)을 대상으로 `ilike` 검색을 수행합니다.
- `#tag` 형태로 입력하면 태그 중심 검색을 수행하도록 분기되어 있습니다.
- 검색 결과에는 하이라이팅과, 본문에서 매칭 주변만 잘라낸 snippet을 함께 보여줍니다.

> 참고: 현재 검색 쿼리는 `tags_searchable` 컬럼을 사용합니다. DB에 해당 컬럼이 없다면 아래 “데이터 모델/스키마” 섹션의 제안을 참고해 추가하세요.

### 🗂️ 카테고리
- Mathematics
- Development
- DevOps
- Computer Science
- Crypto
- Research

### 🔍 검색 기능
- 전체 게시글 검색 지원(제목/본문/태그)
- `#tag` 단축 검색

### 🔐 관리자 기능
- Supabase Auth 기반 인증 시스템
- 게시글 작성/수정/삭제
- 실시간 미리보기 편집기
- 이미지 및 첨부파일 업로드

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui

### Backend & Database
- **BaaS**: Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage

### Content Processing
- **MDX(RSC)**: next-mdx-remote/rsc
- **Preview(클라이언트)**: react-markdown
- **Math**: remark-math + rehype-katex
- **Markdown**: remark-gfm
- **Heading/ToC**: rehype-slug
- **Code Highlight**: react-syntax-highlighter(Prism)

### Deployment
- **Platform**: Vercel
- **Analytics**: Vercel Analytics

## 📁 프로젝트 구조

```
my_blog/
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈페이지 (게시글 목록)
│   ├── layout.tsx         # 루트 레이아웃
│   ├── post/[id]/         # 게시글 상세 페이지
│   ├── edit/              # 게시글 편집기
│   │   └── preview/        # 작성 중 미리보기
│   ├── search/            # 검색 페이지
│   ├── login/             # 로그인 페이지
│   ├── auth/              # 인증 관련
│   ├── admin/             # 관리자 페이지
│   └── api/               # API Routes
├── components/            # React 컴포넌트
│   ├── Header.tsx         # 헤더 네비게이션
│   ├── CodeBlock.tsx      # 코드 블록 컴포넌트
│   ├── TableOfContents.tsx # 목차 컴포넌트
│   ├── RealtimePreview.tsx # 실시간 미리보기
│   └── ui/                # shadcn/ui 컴포넌트
├── lib/                   # 유틸리티 함수
│   ├── mdx.ts            # MDX 처리 유틸
│   ├── types.ts          # TypeScript 타입 정의
│   ├── utils.ts          # 공통 유틸리티
│   └── supabase/         # Supabase 클라이언트
└── public/               # 정적 파일
```

## 🧠 동작 방식(구현 관점)

### Supabase 클라이언트 구성
- **서버 컴포넌트/RSC**: `lib/supabase/server.ts`
	- 쿠키를 통해 세션을 자동으로 읽고 서버에서 쿼리를 실행합니다.
- **클라이언트 컴포넌트**: `lib/supabase/client.ts`
	- 브라우저에서 재사용 가능한 Supabase 클라이언트를 생성합니다.

### 보호 라우팅(로그인 필요)
- `middleware.ts`에서 `/edit`, `/admin` 경로를 보호합니다.
- 세션이 없으면 `/login`으로 리다이렉트합니다.

### MDX/Markdown 렌더 파이프라인
- **게시글 상세(`/post/[id]`)**
	- `lib/mdx.ts`의 `compileMDXContent()`를 통해 MDX를 컴파일합니다.
	- `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-slug`를 사용합니다.
	- HTML 코멘트 제거, `<style>` 제거 등 간단한 sanitize를 수행합니다.
- **미리보기(`/edit/preview`, 에디터 SPLIT VIEW)**
	- `react-markdown` 기반으로 즉시 렌더링하며 동일한 플러그인(수식/GFM/slug)을 사용합니다.
	- 코드블록은 공통 `components/CodeBlock.tsx`로 렌더링합니다.

## 🗃️ 데이터 모델/스키마(권장)

앱에서 사용하는 게시글 타입은 `lib/types.ts`의 `Post` 인터페이스를 기준으로 합니다.

### posts 테이블에서 사용하는 주요 컬럼
- `id` (uuid/string)
- `title` (text)
- `category` (text)
- `excerpt` (text)
- `content` (text)
- `image_url` (text, nullable)
- `featured_image_path` (text, nullable) — Storage 파일 삭제/정리를 위해 경로를 함께 저장
- `attachments` (jsonb, nullable) — `{ filename, url, filePath }[]`
- `read_time` (text)
- `tags` (text[], nullable)
- `created_at`, `updated_at` (timestamp)

### tags 인덱스
`update_schema.sql`에는 `tags` 컬럼과 GIN 인덱스를 추가하는 SQL이 포함되어 있습니다.

### tags_searchable(선택/추천)
검색 페이지는 `tags_searchable.ilike`를 사용합니다. `tags` 배열을 문자열로 합친 컬럼(또는 뷰/생성 컬럼)을 만들어두면 검색이 단순해집니다.

예시(하나의 방법):

```sql
-- tags 배열을 공백으로 합친 문자열을 생성 컬럼으로 유지
ALTER TABLE posts
	ADD COLUMN IF NOT EXISTS tags_searchable text
	GENERATED ALWAYS AS (array_to_string(tags, ' ')) STORED;

CREATE INDEX IF NOT EXISTS idx_posts_tags_searchable
	ON posts USING GIN (to_tsvector('simple', coalesce(tags_searchable, '')));
```

> 위 SQL은 “한 가지 예시”이며, 실제 운영에서는 FTS/pg_trgm 등 선호하는 방식으로 최적화할 수 있습니다.

## 📦 스토리지(첨부/이미지)
- Supabase Storage에 `files` 버킷을 사용합니다.
- 업로드 시 파일명은 안전하게 변환되고(`[^a-zA-Z0-9]` → `_`), `Date.now()` 기반 prefix를 붙입니다.
- 게시글 삭제 시
	- 첨부파일 목록의 `filePath`들을 `files` 버킷에서 제거
	- 대표 이미지가 있으면 `featured_image_path`를 이용해 제거
	- 이후 `posts` 레코드를 삭제(스토리지 삭제는 best-effort)

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+
- pnpm

### 설치

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

### 환경 변수

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase 준비 체크리스트(요약)
- Auth: Email/Password 로그인 활성화
- Database: `posts` 테이블 생성(위 “데이터 모델” 참고)
- Storage: `files` 버킷 생성(필요 시 public 또는 signed URL 전략 선택)
- RLS/Policy: 운영 환경에서는 `posts`/`storage.objects`에 적절한 정책 설정 권장

## 📦 스크립트

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm start` | 프로덕션 서버 실행 |
| `pnpm lint` | ESLint 검사 |

## 🌐 배포

이 프로젝트는 Vercel에 자동 배포됩니다.

**Live**: [https://vercel.com/9oodnights-projects/v0-preview](https://vercel.com/9oodnights-projects/v0-preview)

## 📄 라이선스

이 프로젝트는 개인 블로그 용도로 제작되었습니다.
