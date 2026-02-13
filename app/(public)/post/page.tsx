import { redirect } from "next/navigation"

interface PageProps {
  searchParams: Promise<{
    id?: string
  }>
}

export default async function PostRedirectPage({ searchParams }: PageProps) {
  const { id } = await searchParams
  
  if (id) {
    redirect(`/post/${id}`)
  }
  
  // id가 없으면 홈으로 리다이렉트
  redirect("/")
}
