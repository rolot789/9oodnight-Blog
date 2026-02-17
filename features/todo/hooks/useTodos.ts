import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import type { DropResult } from "@hello-pangea/dnd"
import type { PostOption, Todo, TodoStatus } from "@/lib/types"
import type { ApiResponse } from "@/lib/shared/api-response"
import { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client"
import { toPostPath } from "@/lib/shared/slug"

const PAGE_SIZE = 20
const POST_OPTIONS_LIMIT = 50
const MAX_POST_OPTIONS_LIMIT = 50
export const NO_POST_LINK = "__none__"
const TODO_API_TIMEOUT_MS = 12000

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState("")
  const [category, setCategory] = useState("Draft")
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [postOptions, setPostOptions] = useState<PostOption[]>([])
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<"list" | "kanban">("list")
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null)

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
    }
  }

  const fetchTodoApi = useCallback(async <T,>(url: string, init?: RequestInit): Promise<T> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TODO_API_TIMEOUT_MS)
    try {
      const headers = new Headers(init?.headers)
      const supabase = createBrowserSupabaseClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`)
      }

      const res = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      })
      const payload = (await res.json()) as ApiResponse<T>
      if (!payload.ok) {
        throw new Error(payload.error.message)
      }
      return payload.data
    } catch (error) {
      if (controller.signal.aborted) {
        throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.")
      }
      throw error
    } finally {
      clearTimeout(timeoutId)
    }
  }, [])

  const loadPostOptions = useCallback(async () => {
    try {
      const safeLimit = Math.min(POST_OPTIONS_LIMIT, MAX_POST_OPTIONS_LIMIT)
      const options = await fetchTodoApi<PostOption[]>(`/api/posts?limit=${safeLimit}`)
      setPostOptions(options)
    } catch (error) {
      console.error("Failed to load post options", error)
    }
  }, [fetchTodoApi])

  const fetchTodos = useCallback(async (nextPage: number, isLoadMore = false) => {
    setLoadError(null)
    if (!isLoadMore) {
      setIsLoaded(false)
      setPage(0)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(PAGE_SIZE),
      })
      if (filterCategory !== "All") {
        params.set("category", filterCategory)
      }

      const newTodos = await fetchTodoApi<Todo[]>(`/api/todos?${params.toString()}`)
      if (isLoadMore) {
        setTodos((prev) => {
          const existingIds = new Set(prev.map((t) => t.id))
          const uniqueNewTodos = newTodos.filter((t) => !existingIds.has(t.id))
          return [...prev, ...uniqueNewTodos]
        })
        setPage(nextPage)
      } else {
        setTodos(newTodos)
      }

      setHasMore(newTodos.length === PAGE_SIZE)
    } catch (error) {
      console.error("Failed to fetch todos", error)
      const message = error instanceof Error ? error.message : "할 일 목록을 불러오지 못했습니다."
      setLoadError(message)
    }
    
    setIsLoaded(true)
    setIsLoadingMore(false)
  }, [fetchTodoApi, filterCategory])

  useEffect(() => {
    const checkUser = async () => {
      try {
        const data = await fetchTodoApi<{ user: { id: string; email: string | null } | null }>(
          "/api/auth/session"
        )
        setUser(data.user)
      } catch (error) {
        console.error("Failed to check session", error)
        setUser(null)
      }
    }
    checkUser()
  }, [fetchTodoApi])

  useEffect(() => {
    loadPostOptions()
  }, [loadPostOptions])

  useEffect(() => {
    fetchTodos(0, false)
  }, [fetchTodos])

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      fetchTodos(page + 1, true)
    }
  }

  const addTodo = async () => {
    if (!inputValue.trim()) return
    if (!user) {
      alert("You must be logged in to add todos")
      return
    }

    const linkedPostTitle = selectedPostId
      ? postOptions.find((post) => post.id === selectedPostId)?.title ?? null
      : null

    const tempId = crypto.randomUUID()
    const newTodo: Todo = {
      id: tempId,
      text: inputValue.trim(),
      category,
      status: "Draft",
      completed: false,
      created_at: new Date().toISOString(),
      user_id: user.id,
      linked_post_id: selectedPostId,
      linked_post_title: linkedPostTitle,
    }

    setTodos([newTodo, ...todos])
    setInputValue("")
    setSelectedPostId(null)

    try {
      const data = await fetchTodoApi<Todo>("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newTodo.text,
          category: newTodo.category,
          postId: selectedPostId,
        }),
      })
      setTodos((prev) => prev.map((t) => (t.id === tempId ? data : t)))
    } catch (error) {
      console.error("Failed to add todo", error)
      setTodos((prev) => prev.filter((t) => t.id !== tempId))
    }
  }

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const newCompleted = !todo.completed
    const newStatus = newCompleted ? "Done" : "Draft"

    setTodos(
      todos.map((t) => {
        if (t.id === id) {
          return { 
            ...t, 
            completed: newCompleted,
            status: newStatus as TodoStatus
          }
        }
        return t
      })
    )

    try {
      await fetchTodoApi<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted, status: newStatus }),
      })
    } catch (error) {
      console.error("Failed to toggle todo", error)
      setTodos(
        todos.map((t) => {
          if (t.id === id) {
            return { ...t, completed: !newCompleted, status: todo.status }
          }
          return t
        })
      )
    }
  }

  const deleteTodo = async (id: string) => {
    const prevTodos = [...todos]
    setTodos(todos.filter((t) => t.id !== id))

    try {
      await fetchTodoApi<{ id: string }>(`/api/todos/${id}`, { method: "DELETE" })
    } catch (error) {
      console.error("Failed to delete todo", error)
      setTodos(prevTodos)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo()
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return

    if (view === "kanban") {
      const sourceStatus = source.droppableId as TodoStatus
      const destStatus = destination.droppableId as TodoStatus
      const draggableId = result.draggableId

      if (sourceStatus === destStatus) return; 

      const todo = todos.find(t => t.id === draggableId)
      if (!todo) return

      const updatedTodo = { 
        ...todo, 
        status: destStatus, 
        completed: destStatus === "Done" 
      }

      setTodos(todos.map(t => t.id === draggableId ? updatedTodo : t))

      try {
        await fetchTodoApi<Todo>(`/api/todos/${draggableId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: destStatus, completed: destStatus === "Done" }),
        })
      } catch (error) {
         console.error("Failed to update status", error)
         setTodos(todos)
      }

    } else {
      const newTodos = Array.from(todos)
      const [reorderedItem] = newTodos.splice(source.index, 1)
      newTodos.splice(destination.index, 0, reorderedItem)
      setTodos(newTodos)
    }
  }

  const changeCategory = async (id: string, newCategory: string) => {
    const prevTodos = [...todos]
    setTodos(todos.map((t) => t.id === id ? { ...t, category: newCategory } : t))

    try {
      await fetchTodoApi<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: newCategory }),
      })
    } catch (error) {
      console.error("Failed to update category", error)
      setTodos(prevTodos)
    }
  }
  
  const changeStatus = async (id: string, newStatus: TodoStatus) => {
    const prevTodos = [...todos]
    setTodos(todos.map((t) => t.id === id ? { ...t, status: newStatus, completed: newStatus === "Done" } : t))

    try {
      await fetchTodoApi<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, completed: newStatus === "Done" }),
      })
    } catch (error) {
      console.error("Failed to update status", error)
      setTodos(prevTodos)
    }
  }

  const changeLinkedPost = async (id: string, postId: string | null) => {
    const prevTodos = [...todos]
    const nextTitle = postId
      ? postOptions.find((post) => post.id === postId)?.title ?? null
      : null

    setTodos(
      todos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              linked_post_id: postId,
              linked_post_title: nextTitle,
            }
          : todo
      )
    )

    try {
      const updatedTodo = await fetchTodoApi<Todo>(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      })

      setTodos((current) => current.map((todo) => (todo.id === id ? updatedTodo : todo)))
    } catch (error) {
      console.error("Failed to update linked post", error)
      setTodos(prevTodos)
    }
  }

  const filteredTodos = todos;
  const getTodoPostPath = (todo: Todo) => {
    if (!todo.linked_post_id) {
      return null
    }

    const linkedPost = postOptions.find((post) => post.id === todo.linked_post_id)
    const identifier = linkedPost?.slug || todo.linked_post_slug || todo.linked_post_id
    return toPostPath(identifier)
  }

  return {
    todos,
    inputValue, setInputValue,
    category, setCategory,
    selectedPostId, setSelectedPostId,
    postOptions,
    filterCategory, setFilterCategory,
    isLoaded,
    loadError,
    view, setView,
    user,
    page,
    hasMore,
    isLoadingMore,
    scrollContainerRef,
    scrollLeft,
    scrollRight,
    loadMore,
    addTodo,
    toggleTodo,
    deleteTodo,
    handleKeyDown,
    onDragEnd,
    changeCategory,
    changeStatus,
    changeLinkedPost,
    filteredTodos,
    getTodoPostPath,
  }
}
