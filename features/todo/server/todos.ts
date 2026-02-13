import { createClient } from "@/lib/supabase/server"
import { STATUSES, TODO_CATEGORIES } from "@/lib/constants"
import type { Todo, TodoStatus } from "@/lib/types"

export interface TodoListQuery {
  page: number
  pageSize: number
  category?: string
  userId: string
}

interface TodoPostLinkRow {
  todo_id: string
  post_id: string
}

interface PostTitleRow {
  id: string
  title: string
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }
  const code = "code" in error ? String((error as { code?: string }).code ?? "") : ""
  return code === "42P01" || code === "42703"
}

async function attachPostLinks(todos: Todo[]): Promise<Todo[]> {
  if (todos.length === 0) {
    return todos
  }

  const supabase = await createClient()
  const todoIds = todos.map((todo) => todo.id)

  const { data: linksRaw, error: linksError } = await supabase
    .from("todo_post_links")
    .select("todo_id, post_id")
    .in("todo_id", todoIds)

  if (linksError) {
    if (isMissingRelationError(linksError)) {
      return todos
    }
    throw linksError
  }

  const links = (linksRaw as TodoPostLinkRow[] | null) || []
  if (links.length === 0) {
    return todos
  }

  const postIds = Array.from(new Set(links.map((link) => link.post_id)))
  const { data: postsRaw, error: postsError } = await supabase
    .from("posts")
    .select("id, title")
    .in("id", postIds)

  if (postsError) {
    throw postsError
  }

  const postsById = new Map(((postsRaw as PostTitleRow[] | null) || []).map((post) => [post.id, post.title]))
  const postIdByTodoId = new Map(links.map((link) => [link.todo_id, link.post_id]))

  return todos.map((todo) => {
    const linkedPostId = postIdByTodoId.get(todo.id) ?? null
    return {
      ...todo,
      linked_post_id: linkedPostId,
      linked_post_title: linkedPostId ? postsById.get(linkedPostId) ?? null : null,
    }
  })
}

async function setTodoPostLink(todoId: string, postId: string | null): Promise<void> {
  const supabase = await createClient()

  if (!postId) {
    const { error } = await supabase
      .from("todo_post_links")
      .delete()
      .eq("todo_id", todoId)
    if (error && !isMissingRelationError(error)) {
      throw error
    }
    return
  }

  const { error } = await supabase
    .from("todo_post_links")
    .upsert({ todo_id: todoId, post_id: postId }, { onConflict: "todo_id" })

  if (error && !isMissingRelationError(error)) {
    throw error
  }
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

  return attachPostLinks((data as Todo[]) || [])
}

export async function createTodo(input: {
  text: string
  category: string
  userId: string
  postId?: string | null
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

  try {
    await setTodoPostLink(data.id, input.postId ?? null)
  } catch (error) {
    console.error("Failed to save todo-post link:", error)
  }

  const [todoWithLink] = await attachPostLinks([data as Todo])
  return todoWithLink
}

export async function updateTodo(
  id: string,
  userId: string,
  patch: Partial<Pick<Todo, "category" | "status" | "completed">> & {
    linked_post_id?: string | null
  }
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

  let data: Todo | null = null
  if (Object.keys(updatePayload).length > 0) {
    const { data: updatedTodo, error } = await supabase
      .from("todos")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single()

    if (error || !updatedTodo) {
      throw error ?? new Error("Failed to update todo")
    }
    data = updatedTodo as Todo
  } else {
    const { data: existingTodo, error } = await supabase
      .from("todos")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (error || !existingTodo) {
      throw error ?? new Error("Failed to update todo")
    }
    data = existingTodo as Todo
  }

  if (patch.linked_post_id !== undefined) {
    try {
      await setTodoPostLink(id, patch.linked_post_id)
    } catch (error) {
      console.error("Failed to update todo-post link:", error)
    }
  }

  const [todoWithLink] = await attachPostLinks([data as Todo])
  return todoWithLink
}

export async function deleteTodo(id: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { error: unlinkError } = await supabase
    .from("todo_post_links")
    .delete()
    .eq("todo_id", id)

  if (unlinkError && !isMissingRelationError(unlinkError)) {
    throw unlinkError
  }

  const { error } = await supabase.from("todos").delete().eq("id", id).eq("user_id", userId)
  if (error) {
    throw error
  }
}

export async function listTodosByPost(postId: string, limit = 10): Promise<Todo[]> {
  const supabase = await createClient()

  const { data: linksRaw, error: linksError } = await supabase
    .from("todo_post_links")
    .select("todo_id")
    .eq("post_id", postId)
    .limit(Math.max(1, Math.min(limit, 50)))

  if (linksError) {
    if (isMissingRelationError(linksError)) {
      return []
    }
    throw linksError
  }

  const todoIds = (((linksRaw as { todo_id: string }[] | null) || []).map((row) => row.todo_id))
  if (todoIds.length === 0) {
    return []
  }

  const { data: todosRaw, error: todosError } = await supabase
    .from("todos")
    .select("*")
    .in("id", todoIds)
    .order("created_at", { ascending: false })

  if (todosError) {
    throw todosError
  }

  return ((todosRaw as Todo[] | null) || []).map((todo) => ({
    ...todo,
    linked_post_id: postId,
  }))
}
