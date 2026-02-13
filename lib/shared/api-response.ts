export interface ApiErrorPayload {
  code: string
  message: string
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiErrorPayload }

export function apiSuccess<T>(data: T): ApiResponse<T> {
  return { ok: true, data }
}

export function apiError(code: string, message: string): ApiResponse<never> {
  return { ok: false, error: { code, message } }
}
