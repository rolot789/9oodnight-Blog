# Security P0 Checklist

## 1) CSP/Nonce
- [x] `proxy.ts` injects a per-request nonce (`x-nonce`) and a dynamic `Content-Security-Policy`.
- [x] `app/layout.tsx` and `app/(public)/post/[id]/page.tsx` apply nonce to inline JSON-LD scripts.
- [x] Target policy:
  - [x] `script-src 'self' 'nonce-<value>' 'strict-dynamic' https://va.vercel-scripts.com`
  - [x] no `unsafe-inline` for scripts.

## 2) HTML sanitization test vectors
Use these payloads on editor content and verify no script execution:
- [ ] `<script>alert(1)</script>`
- [ ] `<img src=x onerror=alert(1)>`
- [ ] `<a href="javascript:alert(1)">x</a>`
- [ ] `<svg><script>alert(1)</script></svg>`
- [ ] `<iframe src="https://evil.example"></iframe>`

Expected:
- [x] dangerous tags removed (code-level sanitizer rules added)
- [x] inline event handlers removed (code-level sanitizer rules added)
- [x] `javascript:` / `data:` URL payloads neutralized (code-level sanitizer rules added)
- [ ] manual browser verification with payloads above

## 3) Search query constraints
- [x] Max length: `64` chars (`MAX_SEARCH_QUERY_LENGTH`).
- Normalization:
  - [x] NFKC normalize
  - [x] allow only letters/numbers/space and `# . _ -`
  - [x] collapse whitespace
- [x] On query failure, user-facing error message should be shown.

## 4) Auth route validation checks
- [x] `/auth/callback?next=...` accepts only safe internal path.
- Reject cases:
  - [x] missing leading slash
  - [x] `//...` double-slash path
- [x] Fallback redirect: `/`.

## 5) Secret management
- [x] Keep `.env` and `.env.local` out of git.
- [x] Use only `NEXT_PUBLIC_*` for public client variables.
- [x] Never store service-role keys in client-exposed env vars.
- [ ] Validate production env vars on deployment before release.
