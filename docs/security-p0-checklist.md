# Security P0 Checklist (my_blog)

## 1) 인증/세션

- [x] `/edit` 진입: 서버 컴포넌트에서 `getUser` 확인 후 미인증 접근 차단 (`app/(editor)/edit/page.tsx`).
- [x] `middleware.ts` 등록: 보안 헤더/쿠키/경로 가드 진입점 정합화 (`proxy.ts`).
- [x] 쿠키 속성: `Secure` / `HttpOnly` / `SameSite` 강제 보강 (`proxy.ts`의 `setAll`).
- [x] `/api/auth/signin` 로그인 API: `zod` 입력 검증 + 요청 바디 검증 실패 처리.
- [ ] 로그인 토큰 정책: refresh token 회전·재발급 경로 정교화, 세션 갱신 시 재인증 강화.

## 2) 권한/인가

- [x] Todo API는 모두 사용자 식별값(`user_id`) 기반으로 목록/수정/삭제 제약.
- [x] 포스트 수정/로드/삭제 경로에 `author_id` 필터 또는 권한 체크 강화 (`app/(editor)/edit/EditForm.tsx`, `lib/server/security`).
- [ ] 관리자 전용 API/페이지(있을 경우) 별도 role policy 강화.

## 3) 입력 검증/출력 인코딩

- [x] API Query/Body 스키마 검증 추가:
  - `app/api/posts`
  - `app/api/search`
  - `app/api/todos`
  - `app/api/todos/[id]`
- [x] 검색 정규화 로직(`normalizeSearchQuery`) 유지 및 길이 제한.
- [x] 위험 HTML 입력에 대한 렌더링 sanitization 적용 (`lib/shared/security`, `features/post/components/MarkdownRenderer.tsx`).
- [ ] 전체 HTML 입력 경로에 대해 CSP 기반 런타임 차단 시나리오 수동 검증 강화.

## 4) 업로드 보안

- [x] 파일 업로드 시 MIME/확장자/시그니처/크기 검증 함수 도입 (`app/(editor)/edit/EditForm.tsx`).
- [x] 업로드 파일 경로 랜덤화 및 안전 경로 검증(`isSafeStoragePath`).
- [x] 삭제/교체 경로도 동일하게 경로 검증 수행.
- [ ] 서버측 저장소 정책에서 MIME/Content-Length 최종 재검증(버킷 정책).

## 5) 보안 헤더/네트워크

- [x] CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `HSTS` 설정.
- [ ] 운영 HTTP→HTTPS 리다이렉트 정책(배포 인프라 포함) 확인 로그 추가.

## 6) 인프라·운영

- [x] 요청 ID, API 에러 로깅(`logApiError`) 기본 선행 도입.
- [ ] 에러 로그에서 토큰/PII 마스킹 및 감사로그 분리 정책 적용.
- [ ] 보안 이슈 시 알림(로그 레벨/모니터링 대시보드) 연동.
- [ ] 공급망 점검: `npm` 취약점 스캔 및 lockfile 정책을 CI에 편입.

