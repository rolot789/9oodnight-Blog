import { NextResponse, type NextRequest } from "next/server"
import { apiError, type ApiResponse } from "@/lib/shared/api-response"

interface ApiContext {
  requestId: string
  startedAt: number
  path: string
  method: string
}

function getOrCreateRequestId(request: NextRequest): string {
  return (
    request.headers.get("x-request-id") ||
    request.headers.get("x-vercel-id") ||
    crypto.randomUUID()
  )
}

export function createApiContext(request: NextRequest): ApiContext {
  return {
    requestId: getOrCreateRequestId(request),
    startedAt: Date.now(),
    path: request.nextUrl.pathname,
    method: request.method,
  }
}

export function jsonWithRequestId<T>(
  payload: ApiResponse<T>,
  requestId: string,
  status = 200
) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "x-request-id": requestId,
    },
  })
}

export function logApiSuccess(context: ApiContext, status: number) {
  console.info(
    JSON.stringify({
      level: "info",
      type: "api_success",
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      status,
      durationMs: Date.now() - context.startedAt,
      timestamp: new Date().toISOString(),
    })
  )
}

export function logApiError(
  context: ApiContext,
  code: string,
  status: number,
  error: unknown
) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(
    JSON.stringify({
      level: "error",
      type: "api_error",
      requestId: context.requestId,
      method: context.method,
      path: context.path,
      code,
      status,
      durationMs: Date.now() - context.startedAt,
      message,
      stack,
      timestamp: new Date().toISOString(),
    })
  )
}

export function apiErrorResponse(
  context: ApiContext,
  code: string,
  message: string,
  status: number,
  error?: unknown
) {
  if (error) {
    logApiError(context, code, status, error)
  }
  return jsonWithRequestId(apiError(code, message), context.requestId, status)
}
