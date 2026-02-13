import { NextResponse, type NextRequest } from "next/server"
import { apiSuccess } from "@/lib/shared/api-response"
import { createClient } from "@/lib/supabase/server"
import { createTodo, listTodos } from "@/features/todo/server/todos"
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(request: NextRequest) {
  const context = createApiContext(request)
  const { searchParams } = new URL(request.url)
  const page = Math.max(0, Number(searchParams.get("page") ?? "0") || 0)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get("pageSize") ?? `${DEFAULT_PAGE_SIZE}`) || DEFAULT_PAGE_SIZE)
  )
  const category = searchParams.get("category") ?? undefined

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return apiErrorResponse(
        context,
        "UNAUTHORIZED",
        "로그인이 필요합니다.",
        401
      )
    }

    const todos = await listTodos({ page, pageSize, category, userId: user.id })
    const response = jsonWithRequestId(apiSuccess(todos), context.requestId)
    logApiSuccess(context, 200)
    return response
  } catch (error) {
    return apiErrorResponse(
      context,
      "TODO_LIST_FAILED",
      "할 일 목록을 불러오지 못했습니다.",
      500,
      error
    )
  }
}

export async function POST(request: NextRequest) {
  const context = createApiContext(request)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return apiErrorResponse(
        context,
        "UNAUTHORIZED",
        "로그인이 필요합니다.",
        401
      )
    }

    const body = (await request.json()) as { text?: string; category?: string }
    if (!body?.text || !body?.text.trim()) {
      return apiErrorResponse(
        context,
        "INVALID_INPUT",
        "할 일 텍스트는 필수입니다.",
        400
      )
    }

    const todo = await createTodo({
      text: body.text,
      category: body.category ?? "Draft",
      userId: user.id,
    })

    const response = jsonWithRequestId(apiSuccess(todo), context.requestId, 201)
    logApiSuccess(context, 201)
    return response
  } catch (error) {
    return apiErrorResponse(
      context,
      "TODO_CREATE_FAILED",
      "할 일을 생성하지 못했습니다.",
      500,
      error
    )
  }
}
