import { NextResponse, type NextRequest } from "next/server"
import { apiSuccess } from "@/lib/shared/api-response"
import { deleteTodo, updateTodo } from "@/features/todo/server/todos"
import type { TodoStatus } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const context = createApiContext(request)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return apiErrorResponse(context, "UNAUTHORIZED", "로그인이 필요합니다.", 401)
    }

    const { id } = await params
    const body = (await request.json()) as {
      category?: string
      status?: TodoStatus
      completed?: boolean
      postId?: string | null
    }

    const todo = await updateTodo(id, user.id, {
      category: body.category,
      status: body.status,
      completed: body.completed,
      linked_post_id: body.postId,
    })

    const response = jsonWithRequestId(apiSuccess(todo), context.requestId)
    logApiSuccess(context, 200)
    return response
  } catch (error) {
    return apiErrorResponse(
      context,
      "TODO_UPDATE_FAILED",
      "할 일을 수정하지 못했습니다.",
      500,
      error
    )
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const context = createApiContext(request)
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return apiErrorResponse(context, "UNAUTHORIZED", "로그인이 필요합니다.", 401)
    }

    const { id } = await params
    await deleteTodo(id, user.id)
    const response = jsonWithRequestId(apiSuccess({ id }), context.requestId)
    logApiSuccess(context, 200)
    return response
  } catch (error) {
    return apiErrorResponse(
      context,
      "TODO_DELETE_FAILED",
      "할 일을 삭제하지 못했습니다.",
      500,
      error
    )
  }
}
