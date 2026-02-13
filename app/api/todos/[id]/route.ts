import { NextResponse, type NextRequest } from "next/server"
import { apiError, apiSuccess } from "@/lib/shared/api-response"
import { deleteTodo, updateTodo } from "@/features/todo/server/todos"
import type { TodoStatus } from "@/lib/types"
import { createClient } from "@/lib/supabase/server"

interface Params {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(apiError("UNAUTHORIZED", "로그인이 필요합니다."), { status: 401 })
    }

    const { id } = await params
    const body = (await request.json()) as {
      category?: string
      status?: TodoStatus
      completed?: boolean
    }

    const todo = await updateTodo(id, user.id, {
      category: body.category,
      status: body.status,
      completed: body.completed,
    })

    return NextResponse.json(apiSuccess(todo))
  } catch (error) {
    console.error("Update todo error:", error)
    return NextResponse.json(
      apiError("TODO_UPDATE_FAILED", "할 일을 수정하지 못했습니다."),
      { status: 500 }
    )
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(apiError("UNAUTHORIZED", "로그인이 필요합니다."), { status: 401 })
    }

    const { id } = await params
    await deleteTodo(id, user.id)
    return NextResponse.json(apiSuccess({ id }))
  } catch (error) {
    console.error("Delete todo error:", error)
    return NextResponse.json(
      apiError("TODO_DELETE_FAILED", "할 일을 삭제하지 못했습니다."),
      { status: 500 }
    )
  }
}
