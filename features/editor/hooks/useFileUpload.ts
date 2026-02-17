import type React from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"
import { DEFAULT_IMAGES } from "@/lib/constants"
import { isSafeStoragePath } from "@/lib/shared/storage"
import { validateAttachmentFile } from "@/features/editor/lib/post-validation"
import type { Attachment } from "@/features/editor/hooks/usePostForm"

interface UseFileUploadDeps {
  userId: string | null
  isAuthorizedPost: boolean
  isEditMode: boolean
  supabase: SupabaseClient
  featuredImagePath: string | null
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>
  setImageUrl: React.Dispatch<React.SetStateAction<string>>
  setFeaturedImagePath: React.Dispatch<React.SetStateAction<string | null>>
  setFileToDelete: React.Dispatch<React.SetStateAction<string | null>>
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
  fileToDelete: string | null
}

export function useFileUpload({
  userId,
  isAuthorizedPost,
  isEditMode,
  supabase,
  featuredImagePath,
  setAttachments,
  setImageUrl,
  setFeaturedImagePath,
  setFileToDelete,
  setIsUploading,
  fileToDelete,
}: UseFileUploadDeps) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    if (!userId || (!isAuthorizedPost && isEditMode)) {
      toast.error("업로드 권한이 없습니다.")
      return
    }

    const file = e.target.files[0]

    setIsUploading(true)
    try {
      const safeFileName = await validateAttachmentFile(file, "attachment")
      const { error } = await supabase.storage.from("files").upload(safeFileName, file)

      if (error) {
        toast.error(`Upload error: ${error.message}`)
      } else {
        const { data: { publicUrl } } = supabase.storage.from("files").getPublicUrl(safeFileName)
        setAttachments((current) => [
          ...current,
          { filename: file.name, url: publicUrl, filePath: safeFileName },
        ])
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "파일 업로드에 실패했습니다."
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return
    }
    if (!userId || (!isAuthorizedPost && isEditMode)) {
      toast.error("업로드 권한이 없습니다.")
      return
    }

    const file = e.target.files[0]
    setIsUploading(true)
    try {
      const safeFileName = await validateAttachmentFile(file, "image")
      if (featuredImagePath && isSafeStoragePath(featuredImagePath)) {
        await supabase.storage.from("files").remove([featuredImagePath])
      }

      const { error } = await supabase.storage.from("files").upload(safeFileName, file)
      if (error) {
        toast.error(`Upload error: ${error.message}`)
      } else {
        const { data: { publicUrl } } = supabase.storage.from("files").getPublicUrl(safeFileName)
        setImageUrl(publicUrl)
        setFeaturedImagePath(safeFileName)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "대표 이미지 업로드에 실패했습니다."
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFeaturedImageRemove = async () => {
    if (!featuredImagePath) {
      setImageUrl(DEFAULT_IMAGES.THUMBNAIL)
      return
    }
    if (!userId || (!isAuthorizedPost && isEditMode)) {
      toast.error("삭제 권한이 없습니다.")
      return
    }
    if (!isSafeStoragePath(featuredImagePath)) {
      toast.error("허용되지 않은 경로의 파일입니다.")
      return
    }

    setIsUploading(true)
    const { error } = await supabase.storage.from("files").remove([featuredImagePath])
    
    if (error) {
      toast.error(`Failed to remove image: ${error.message}`)
      setIsUploading(false)
      return
    }

    setImageUrl(DEFAULT_IMAGES.THUMBNAIL)
    setFeaturedImagePath(null)
    setIsUploading(false)
  }

  const handleFileDelete = (filePath: string) => {
    if (!isSafeStoragePath(filePath)) {
      toast.error("허용되지 않은 파일 경로입니다.")
      return
    }
    setFileToDelete(filePath)
  }

  const executeFileDelete = async () => {
    if (!fileToDelete) return
    if (!userId || (!isAuthorizedPost && isEditMode)) {
      setFileToDelete(null)
      toast.error("삭제 권한이 없습니다.")
      return
    }
    if (!isSafeStoragePath(fileToDelete)) {
      setFileToDelete(null)
      toast.error("허용되지 않은 파일 경로입니다.")
      return
    }

    const filePathToDelete = fileToDelete
    setAttachments((current) => current.filter((att) => att.filePath !== filePathToDelete))
    setFileToDelete(null)

    const { error } = await supabase.storage.from('files').remove([filePathToDelete])
    
    if (error) {
      toast.error(`Failed to delete file: ${error.message}`)
    }
  }

  return {
    handleFileUpload,
    handleFeaturedImageUpload,
    handleFeaturedImageRemove,
    handleFileDelete,
    executeFileDelete,
  }
}
