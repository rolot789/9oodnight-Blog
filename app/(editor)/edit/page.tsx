import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import EditForm from "./EditForm"
import SiteFooter from "@/components/layout/SiteFooter"

export default async function EditPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Editor */}
      <main className="w-full py-12">
        <EditForm />
      </main>

      <SiteFooter />
    </div>
  )
}
