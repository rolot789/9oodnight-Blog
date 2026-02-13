import { createClient } from "@/lib/supabase/server"
import { STATUSES, TODO_CATEGORIES } from "@/lib/constants"
import type { Todo, TodoStatus } from "@/lib/types"

export interface TodoListQuery {
  page: number
  pageSize: number
  category?: string
  userId: string
}

export async function listTodos({ page, pageSize, category, userId }: TodoListQuery): Promise<Todo[]> {
  const supabase = await createClient()
  let query = supabase
    .from("todos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (category && category !== "All") {
    query = query.eq("category", category)
  }

  const from = page * pageSize
  const to = from + pageSize - 1
  const { data, error } = await query.range(from, to)
  if (error) {
    throw error
  }

  return (data as Todo[]) || []
}

export async function createTodo(input: {
  text: string
  category: string
  userId: string
}): Promise<Todo> {
  const supabase = await createClient()
  const safeText = input.text.trim().slice(0, 500)
  if (!safeText) {
    throw new Error("TODO text is required")
  }

  const category = TODO_CATEGORIES.includes(input.category) ? input.category : "Draft"

  const { data, error } = await supabase
    .from("todos")
    .insert({
      text: safeText,
      category,
      status: "Draft",
      completed: false,
      user_id: input.userId,
    })
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error("Failed to create todo")
  }

  return data as Todo
}

export async function updateTodo(
  id: string,
  userId: string,
  patch: Partial<Pick<Todo, "category" | "status" | "completed">>
): Promise<Todo> {
  const supabase = await createClient()
  const updatePayload: Partial<Todo> = {}

  if (typeof patch.completed === "boolean") {
    updatePayload.completed = patch.completed
  }

  if (typeof patch.category === "string") {
    updatePayload.category = TODO_CATEGORIES.includes(patch.category) ? patch.category : "Draft"
  }

  if (typeof patch.status === "string") {
    const validStatuses = STATUSES as readonly string[]
    updatePayload.status = (validStatuses.includes(patch.status) ? patch.status : "Draft") as TodoStatus
  }

  if (
    typeof updatePayload.status === "string" &&
    updatePayload.completed === undefined
  ) {
    updatePayload.completed = updatePayload.status === "Done"
  }

  if (
    typeof updatePayload.completed === "boolean" &&
    updatePayload.status === undefined
  ) {
    updatePayload.status = updatePayload.completed ? "Done" : "Draft"
  }

  const { data, error } = await supabase
    .from("todos")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single()

  if (error || !data) {
    throw error ?? new Error("Failed to update todo")
  }

  return data as Todo
}

export async function deleteTodo(id: string, userId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("todos").delete().eq("id", id).eq("user_id", userId)
  if (error) {
    throw error
  }
}
