import { NextResponse, type NextRequest } from "next/server"
import { apiError, apiSuccess } from "@/lib/shared/api-response"
import { createClient } from "@/lib/supabase/server"
import { createTodo, listTodos } from "@/features/todo/server/todos"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function GET(request: NextRequest) {
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
      return NextResponse.json(
        apiError("UNAUTHORIZED", "로그인이 필요합니다."),
        { status: 401 }
      )
    }

    const todos = await listTodos({ page, pageSize, category, userId: user.id })
    return NextResponse.json(apiSuccess(todos))
  } catch (error) {
    console.error("List todos error:", error)
    return NextResponse.json(
      apiError("TODO_LIST_FAILED", "할 일 목록을 불러오지 못했습니다."),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        apiError("UNAUTHORIZED", "로그인이 필요합니다."),
        { status: 401 }
      )
    }

    const body = (await request.json()) as { text?: string; category?: string }
    if (!body?.text || !body?.text.trim()) {
      return NextResponse.json(
        apiError("INVALID_INPUT", "할 일 텍스트는 필수입니다."),
        { status: 400 }
      )
    }

    const todo = await createTodo({
      text: body.text,
      category: body.category ?? "Draft",
      userId: user.id,
    })

    return NextResponse.json(apiSuccess(todo), { status: 201 })
  } catch (error) {
    console.error("Create todo error:", error)
    return NextResponse.json(
      apiError("TODO_CREATE_FAILED", "할 일을 생성하지 못했습니다."),
      { status: 500 }
    )
  }
}
