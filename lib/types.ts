export interface Post {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  image_url: string | null
  featured_image_path: string | null
  attachments: { filename: string; url: string; filePath: string }[] | null
  read_time: string
  created_at: string
  updated_at: string
  tags: string[] | null
}

export interface SeriesMembership {
  post_id: string
  series_slug: string
  series_title: string
  position: number | null
}

export interface SeriesItem {
  postId: string
  title: string
  position: number | null
}

export interface SeriesContext {
  slug: string
  title: string
  total: number
  index: number
  previous: SeriesItem | null
  next: SeriesItem | null
}

export type TodoStatus = "Icebox" | "Draft" | "Planned" | "In Progress" | "Done"

export interface Todo {
  id: string
  text: string
  category: string
  status: TodoStatus
  completed: boolean
  created_at: string
  user_id?: string
  linked_post_id?: string | null
  linked_post_title?: string | null
}

export interface PostOption {
  id: string
  title: string
  created_at: string
}
