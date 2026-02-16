import { type NextRequest } from "next/server"
import { z } from "zod"
import { apiSuccess } from "@/lib/shared/api-response"
import { createClient } from "@/lib/supabase/server"
import { createApiContext, jsonWithRequestId, apiErrorResponse } from "@/lib/server/observability"
import { consumeRateLimit, getRequestIp, resetRateLimit, validateJsonBody } from "@/lib/server/security"

const signinSchema = z.object({
  email: z.string().trim().toLowerCase().email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
})

export async function POST(request: NextRequest) {
  const context = createApiContext(request)
  const ip = getRequestIp(request)
  const rateLimit = consumeRateLimit(`auth:signin:${ip}`)
  if (!rateLimit.allowed) {
    return apiErrorResponse(
      context,
      "RATE_LIMITED",
      `너무 많은 로그인 시도가 감지되었습니다. ${Math.ceil(rateLimit.retryAfterMs / 1000)}초 뒤 다시 시도해주세요.`,
      429
    )
  }

  const bodyValidation = await validateJsonBody(request, signinSchema)
  if (!bodyValidation.success) {
    return apiErrorResponse(
      context,
      "INVALID_INPUT",
      bodyValidation.message,
      400
    )
  }
  const body = bodyValidation.data

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword(body)
    if (error) {
      return apiErrorResponse(
        context,
        "AUTH_FAILED",
        "이메일 또는 비밀번호가 올바르지 않습니다.",
        401
      )
    }

    resetRateLimit(`auth:signin:${ip}`)
    const response = jsonWithRequestId(
      apiSuccess({
        id: data.user.id,
        email: data.user.email,
      }),
      context.requestId
    )
    return response
  } catch (error) {
    return apiErrorResponse(
      context,
      "SIGNIN_FAILED",
      "로그인 처리 중 오류가 발생했습니다.",
      500,
      error
    )
  }
}
