export interface Post {
  id: string
  title: string
  category: string
  excerpt: string
  content: string
  image_url: string | null
  attachments: { filename: string; url: string; filePath: string }[] | null
  read_time: string
  created_at: string
  updated_at: string
  tags: string[] | null
}
