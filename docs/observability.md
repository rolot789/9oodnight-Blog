# Observability Guide (P3-1)

## Goals
- Correlate API errors with a request identifier.
- Emit structured logs for success/error paths.
- Keep a single response envelope and include tracing headers.

## Request ID Flow
1. `proxy.ts` creates or forwards `x-request-id`.
2. API routes read `x-request-id` via `createApiContext`.
3. API responses include `x-request-id` header.
4. Client/network logs can trace the same ID end-to-end.

## Structured Logs
- Success log shape:
  - `level=info`
  - `type=api_success`
  - `requestId`, `method`, `path`, `status`, `durationMs`, `timestamp`
- Error log shape:
  - `level=error`
  - `type=api_error`
  - `requestId`, `code`, `status`, `message`, `stack`, `durationMs`

## Current Coverage
- `/api/search`
- `/api/todos`
- `/api/todos/[id]`
- `/api/auth/session`
- `/api/auth/signout`

## Sentry Integration Plan
- Add `SENTRY_DSN` in deployment env.
- Forward `requestId` in Sentry context/tags.
- Capture:
  - uncaught route errors
  - handled API errors with `code/status`
- Keep PII out of logs/events unless explicitly required.

## Operational Checklist
- Verify every API error response includes `x-request-id`.
- Confirm logs contain `requestId` for both success and failure.
- Alert on:
  - elevated `5xx` rate
  - p95 latency regression
  - repeated same `error.code`.
