import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { apiSuccess } from "@/lib/shared/api-response"
import { createTodo, listTodos } from "@/features/todo/server/todos"
import { apiErrorResponse, createApiContext, jsonWithRequestId, logApiSuccess } from "@/lib/server/observability"
import { getAuthenticatedUser } from "@/lib/server/supabase-auth"
import { validateJsonBody, validateQueryParams } from "@/lib/server/security"
import { TODO_CATEGORIES } from "@/lib/constants"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

const todoListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).max(1000).default(0),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  category: z.enum(TODO_CATEGORIES).optional(),
})

const todoCreateSchema = z.object({
  text: z.string().trim().min(1).max(500),
  category: z.enum(TODO_CATEGORIES).optional(),
  postId: z
    .string()
    .uuid({ message: "유효하지 않은 게시글 ID 입니다." })
    .nullable()
    .optional()
    .transform((value) => value ?? null),
})

export async function GET(request: NextRequest) {
  const context = createApiContext(request)
  const { searchParams } = new URL(request.url)
  const queryValidation = validateQueryParams(searchParams, todoListQuerySchema)
  if (!queryValidation.success) {
    return apiErrorResponse(
      context,
      "INVALID_QUERY",
      queryValidation.message,
      400
    )
  }

  const { page, pageSize, category } = queryValidation.data

  try {
    const user = await getAuthenticatedUser(request)
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
  const bodyValidation = await validateJsonBody(request, todoCreateSchema)
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
      return apiErrorResponse(
        context,
        "UNAUTHORIZED",
        "로그인이 필요합니다.",
        401
      )
    }

    const { text, category, postId } = bodyValidation.data

    const todo = await createTodo({
      text,
      category: category ?? "Draft",
      userId: user.id,
      postId,
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
