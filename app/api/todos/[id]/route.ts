import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { apiSuccess } from "@/lib/shared/api-response"
import { deleteTodo, updateTodo } from "@/features/todo/server/todos"
import type { TodoStatus } from "@/lib/types"
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"
import { getAuthenticatedUser } from "@/lib/server/supabase-auth"
import { validateJsonBody } from "@/lib/server/security"
import { TODO_CATEGORIES, STATUSES } from "@/lib/constants"

interface Params {
  params: Promise<{ id: string }>
}

const uuidParamSchema = z.object({ id: z.string().uuid({ message: "유효하지 않은 todo ID입니다." }) })

const todoUpdateSchema = z.object({
  category: z.enum(TODO_CATEGORIES as readonly [string, ...string[]]).optional(),
  status: z.enum(STATUSES as readonly [string, ...string[]]).optional(),
  completed: z.boolean().optional(),
  postId: z
    .string()
    .uuid({ message: "유효하지 않은 게시글 ID입니다." })
    .nullable()
    .optional()
    .transform((value) => value ?? null),
})

export async function PATCH(request: NextRequest, { params }: Params) {
  const context = createApiContext(request)
  const rawParams = await params
  const paramValidation = uuidParamSchema.safeParse(rawParams)
  if (!paramValidation.success) {
    return apiErrorResponse(
      context,
      "INVALID_PARAM",
      "요청 경로 ID 형식이 올바르지 않습니다.",
      400
    )
  }

  const bodyValidation = await validateJsonBody(request, todoUpdateSchema)
  if (!bodyValidation.success) {
    return apiErrorResponse(
      context,
      "INVALID_INPUT",
      bodyValidation.message,
      400
    )
  }

  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return apiErrorResponse(context, "UNAUTHORIZED", "로그인이 필요합니다.", 401)
    }

    const { id } = paramValidation.data
    const body = bodyValidation.data

    const todo = await updateTodo(id, user.id, {
      category: body.category,
      status: body.status as TodoStatus | undefined,
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
  const rawParams = await params
  const paramValidation = uuidParamSchema.safeParse(rawParams)
  if (!paramValidation.success) {
    return apiErrorResponse(
      context,
      "INVALID_PARAM",
      "요청 경로 ID 형식이 올바르지 않습니다.",
      400
    )
  }

  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return apiErrorResponse(context, "UNAUTHORIZED", "로그인이 필요합니다.", 401)
    }

    const { id } = paramValidation.data
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
