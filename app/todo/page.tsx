"use client"

import { useState, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, CheckCircle2, Circle, GripVertical, LayoutList, Kanban } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Todo, TodoStatus } from "@/lib/types"

const CATEGORIES = ["Draft", "General", "Mathematics", "Development", "DevOps", "Computer Science", "Crypto", "Research"]

const STATUSES: TodoStatus[] = ["Icebox", "Draft", "Planned", "In Progress", "Done"]

const STATUS_LABELS: Record<TodoStatus, string> = {
  Icebox: "Icebox",
  Draft: "Draft",
  Planned: "진행예정",
  "In Progress": "진행중",
  Done: "완료",
}

const CATEGORY_COLORS: Record<string, string> = {
  Draft: "text-gray-500 border-gray-500",
  General: "text-[#6096ba] border-[#6096ba]",
  Mathematics: "text-purple-600 border-purple-600",
  Development: "text-emerald-600 border-emerald-600",
  DevOps: "text-orange-600 border-orange-600",
  "Computer Science": "text-blue-600 border-blue-600",
  Crypto: "text-yellow-600 border-yellow-600",
  Research: "text-rose-600 border-rose-600",
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [inputValue, setInputValue] = useState("")
  const [category, setCategory] = useState("Draft")
  const [filterCategory, setFilterCategory] = useState<string>("All")
  const [isLoaded, setIsLoaded] = useState(false)
  const [view, setView] = useState<"list" | "kanban">("list")
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()

    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Failed to fetch todos", JSON.stringify(error, null, 2))
      } else if (data) {
        setTodos(data as Todo[])
      }
      setIsLoaded(true)
    }

    fetchTodos()
  }, [])

  const addTodo = async () => {
    if (!inputValue.trim()) return
    if (!user) {
      alert("You must be logged in to add todos")
      return
    }

    const tempId = crypto.randomUUID()
    const newTodo: Todo = {
      id: tempId,
      text: inputValue.trim(),
      category,
      status: "Draft",
      completed: false,
      created_at: new Date().toISOString(),
      user_id: user.id
    }

    // Optimistic update
    setTodos([newTodo, ...todos])
    setInputValue("")

    const { data, error } = await supabase
      .from('todos')
      .insert({
        text: newTodo.text,
        category: newTodo.category,
        status: newTodo.status,
        completed: newTodo.completed,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to add todo", JSON.stringify(error, null, 2))
      // Rollback
      setTodos((prev) => prev.filter((t) => t.id !== tempId))
    } else if (data) {
      // Replace temp ID with real ID
      setTodos((prev) => prev.map((t) => (t.id === tempId ? (data as Todo) : t)))
    }
  }

  const toggleTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const newCompleted = !todo.completed
    const newStatus = newCompleted ? "Done" : "Draft"

    // Optimistic update
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

    const { error } = await supabase
      .from('todos')
      .update({ completed: newCompleted, status: newStatus })
      .eq('id', id)

    if (error) {
      console.error("Failed to toggle todo", error)
      // Rollback (simplified, just toggling back)
      setTodos(
        todos.map((t) => {
          if (t.id === id) {
            return { 
              ...t, 
              completed: !newCompleted,
              status: todo.status
            }
          }
          return t
        })
      )
    }
  }

  const deleteTodo = async (id: string) => {
    const prevTodos = [...todos]
    // Optimistic update
    setTodos(todos.filter((t) => t.id !== id))

    const { error } = await supabase.from('todos').delete().eq('id', id)

    if (error) {
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

      if (sourceStatus === destStatus) {
         return; 
      }

      const todo = todos.find(t => t.id === draggableId)
      if (!todo) return

      // Optimistic update
      const updatedTodo = { 
        ...todo, 
        status: destStatus, 
        completed: destStatus === "Done" 
      }

      setTodos(
        todos.map(t => t.id === draggableId ? updatedTodo : t)
      )

      const { error } = await supabase
        .from('todos')
        .update({ status: destStatus, completed: destStatus === "Done" })
        .eq('id', draggableId)

      if (error) {
         console.error("Failed to update status", error)
         // Rollback
         setTodos(todos)
      }

    } else {
      // List view reordering - only local since we don't have an order field in DB yet
      const newTodos = Array.from(todos)
      const [reorderedItem] = newTodos.splice(source.index, 1)
      newTodos.splice(destination.index, 0, reorderedItem)
      setTodos(newTodos)
    }
  }

  const changeCategory = async (id: string, newCategory: string) => {
    const prevTodos = [...todos]
    setTodos(
      todos.map((t) =>
        t.id === id ? { ...t, category: newCategory } : t
      )
    )

    const { error } = await supabase
      .from('todos')
      .update({ category: newCategory })
      .eq('id', id)

    if (error) {
      console.error("Failed to update category", error)
      setTodos(prevTodos)
    }
  }
  
  const changeStatus = async (id: string, newStatus: TodoStatus) => {
    const prevTodos = [...todos]
    setTodos(
      todos.map((t) =>
        t.id === id ? { ...t, status: newStatus, completed: newStatus === "Done" } : t
      )
    )

    const { error } = await supabase
      .from('todos')
      .update({ status: newStatus, completed: newStatus === "Done" })
      .eq('id', id)
    
    if (error) {
      console.error("Failed to update status", error)
      setTodos(prevTodos)
    }
  }

  const filteredTodos = filterCategory === "All" 
    ? todos 
    : todos.filter(t => t.category === filterCategory)

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-[#fafbfc] py-12 px-6">
        <div className="mx-auto max-w-6xl">
           <div className="mb-8 animate-pulse">
              <div className="h-8 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-48 bg-gray-100 rounded"></div>
           </div>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#fafbfc] py-12 px-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-wide text-[#080f18] mb-4">Login Required</h1>
          <p className="text-[#8b8c89] mb-6 text-sm">Please login to manage your todos.</p>
          <a href="/login" className="inline-block bg-[#080f18] text-white px-6 py-2 text-xs tracking-widest hover:bg-[#6096ba] transition-all uppercase">
            Go to Login
          </a>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Main Content Area */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-light tracking-[0.2em] text-[#080f18] mb-4">TODO</h1>
            <p className="text-sm tracking-wider text-[#8b8c89] uppercase">
              Ideas and drafts for future posts
            </p>
          </div>
          <div className="flex bg-[#e5e5e5] p-1 rounded-sm self-start md:self-auto">
             <button
               onClick={() => setView("list")}
               className={cn(
                 "flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider transition-all",
                 view === "list" ? "bg-white text-[#080f18] shadow-sm" : "text-[#8b8c89] hover:text-[#080f18]"
               )}
             >
               <LayoutList className="h-4 w-4" />
               List
             </button>
             <button
               onClick={() => setView("kanban")}
               className={cn(
                 "flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider transition-all",
                 view === "kanban" ? "bg-white text-[#080f18] shadow-sm" : "text-[#8b8c89] hover:text-[#080f18]"
               )}
             >
               <Kanban className="h-4 w-4" />
               Kanban
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[200px_1fr]">
          {/* Left Sidebar: Categories */}
          <aside className="space-y-8">
            <div>
              <h3 className="mb-6 text-xs font-bold tracking-widest text-[#080f18]">CATEGORIES</h3>
              <ul className="space-y-4">
                <li>
                  <button
                    onClick={() => setFilterCategory("All")}
                    className={`text-xs tracking-wider transition-colors hover:text-[#080f18] uppercase text-left w-full ${
                      filterCategory === "All" ? "font-medium text-[#080f18] border-l-2 border-[#080f18] pl-3 -ml-3.5" : "text-[#8b8c89]"
                    }`}
                  >
                    All
                  </button>
                </li>
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setFilterCategory(cat)}
                      className={`text-xs tracking-wider transition-colors hover:text-[#080f18] uppercase text-left w-full ${
                        filterCategory === cat ? "font-medium text-[#080f18] border-l-2 border-[#080f18] pl-3 -ml-3.5" : "text-[#8b8c89]"
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right Column: Content */}
          <main className="min-w-0">
            {/* Input Area */}
            <div className="bg-white p-6 shadow-sm border border-[#e5e5e5] mb-10">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-[180px] shrink-0">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 rounded-none border-[#e5e5e5] focus:border-[#6096ba]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder="What's the next topic?"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-11 rounded-none border-[#e5e5e5] focus-visible:ring-0 focus-visible:border-[#6096ba] placeholder:text-[#c0c0c0] placeholder:font-light"
                />
                <button
                  onClick={addTodo}
                  className="bg-[#080f18] text-white px-8 py-2 text-xs tracking-widest hover:bg-[#6096ba] transition-all flex items-center justify-center gap-2 rounded-none h-11 uppercase"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              {view === "list" ? (
                <Droppable droppableId="list-view">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps} 
                      ref={provided.innerRef}
                      className="space-y-4"
                    >
                      {filteredTodos.length === 0 ? (
                        <div className="text-center py-20 text-[#8b8c89] text-xs tracking-widest border border-dashed border-[#e5e5e5] bg-white uppercase">
                          No items found.
                        </div>
                      ) : (
                        filteredTodos.map((todo, index) => (
                          <Draggable key={todo.id} draggableId={todo.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  "group flex items-start sm:items-center justify-between p-6 border border-[#e5e5e5] bg-white transition-all hover:shadow-md select-none",
                                  todo.completed && "opacity-60",
                                  snapshot.isDragging && "shadow-lg rotate-1 z-50 bg-[#fafbfc]"
                                )}
                                style={provided.draggableProps.style}
                              >
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                   <div 
                                     {...provided.dragHandleProps} 
                                     className="mt-1 sm:mt-0 text-[#e5e5e5] hover:text-[#080f18] cursor-grab active:cursor-grabbing"
                                   >
                                     <GripVertical className="h-5 w-5" />
                                   </div>
                                  <button
                                    onClick={() => toggleTodo(todo.id)}
                                    className="text-[#8b8c89] hover:text-[#080f18] transition-colors shrink-0 mt-1 sm:mt-0"
                                  >
                                    {todo.completed ? (
                                      <CheckCircle2 className="h-5 w-5 text-[#6096ba]" />
                                    ) : (
                                      <Circle className="h-5 w-5" />
                                    )}
                                  </button>
                                  <div className="flex flex-col gap-2 min-w-0 w-full">
                                    <span
                                      className={cn(
                                        "text-base font-light tracking-wide text-[#080f18] break-words",
                                        todo.completed && "line-through text-[#8b8c89]"
                                      )}
                                    >
                                      {todo.text}
                                    </span>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      {/* Category Select */}
                                      <Select 
                                        value={todo.category} 
                                        onValueChange={(val) => changeCategory(todo.id, val)}
                                      >
                                        <SelectTrigger className="h-auto w-auto p-0 border-none bg-transparent focus:ring-0">
                                          <span 
                                            className={cn(
                                              "border px-2 py-0.5 text-[9px] font-normal tracking-wider uppercase cursor-pointer hover:opacity-80 transition-opacity",
                                              CATEGORY_COLORS[todo.category] || "text-[#6096ba] border-[#6096ba]"
                                            )}
                                          >
                                            {todo.category}
                                          </span>
                                        </SelectTrigger>
                                        <SelectContent>
                                          {CATEGORIES.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                              {cat.toUpperCase()}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      
                                      {/* Status Select */}
                                       <Select 
                                        value={todo.status} 
                                        onValueChange={(val) => changeStatus(todo.id, val as TodoStatus)}
                                      >
                                        <SelectTrigger className="h-auto w-auto p-0 border-none bg-transparent focus:ring-0">
                                          <span className="text-[10px] tracking-wider text-[#8b8c89] uppercase hover:text-[#080f18] transition-colors">
                                            {STATUS_LABELS[todo.status]}
                                          </span>
                                        </SelectTrigger>
                                        <SelectContent>
                                          {STATUSES.map((status) => (
                                            <SelectItem key={status} value={status}>
                                              {STATUS_LABELS[status]}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>

                                      <span className="text-[10px] tracking-wider text-[#c0c0c0] uppercase">
                                        {new Date(todo.created_at).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteTodo(todo.id)}
                                  className="opacity-0 group-hover:opacity-100 text-[#c0c0c0] hover:text-[#080f18] transition-all p-2 shrink-0"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-6 items-start">
                  {STATUSES.map((status) => (
                    <div key={status} className="flex-1 min-w-[280px]">
                      <h3 className="text-xs font-bold tracking-widest text-[#080f18] mb-4 uppercase border-b border-[#080f18] pb-2">
                        {STATUS_LABELS[status]}
                        <span className="ml-2 text-[#8b8c89] font-normal">
                          {filteredTodos.filter(t => t.status === status).length}
                        </span>
                      </h3>
                      <Droppable droppableId={status}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "min-h-[200px] space-y-3 bg-[#f3f4f6]/50 p-2 rounded-sm border border-transparent transition-colors",
                              snapshot.isDraggingOver && "bg-[#e5e5e5]/50 border-[#c0c0c0] border-dashed"
                            )}
                          >
                            {filteredTodos
                              .filter(t => t.status === status)
                              .map((todo, index) => (
                                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={cn(
                                        "bg-white p-4 shadow-sm border border-[#e5e5e5] hover:shadow-md transition-all select-none group relative",
                                        snapshot.isDragging && "rotate-2 shadow-lg z-50"
                                      )}
                                      style={provided.draggableProps.style}
                                    >
                                      <p className="text-sm font-light text-[#080f18] mb-3 line-clamp-3">
                                        {todo.text}
                                      </p>
                                      <div className="flex items-center justify-between">
                                        <span 
                                          className={cn(
                                            "border px-1.5 py-0.5 text-[8px] font-normal tracking-wider uppercase",
                                            CATEGORY_COLORS[todo.category] || "text-[#6096ba] border-[#6096ba]"
                                          )}
                                        >
                                          {todo.category}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteTodo(todo.id);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 text-[#c0c0c0] hover:text-[#080f18] transition-all"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              )}
            </DragDropContext>
          </main>
        </div>
      </div>
    </div>
  )
}