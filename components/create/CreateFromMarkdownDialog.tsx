"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MARKDOWN_IMPORT_STORAGE_KEY,
  parseMarkdownPreset,
  toMarkdownImportPayload,
} from "@/lib/shared/markdown-import"

interface CreateFromMarkdownDialogProps {
  label: string
  className: string
  showPlusIcon?: boolean
}

type CreateDialogStep = "choice" | "markdown"

export default function CreateFromMarkdownDialog({
  label,
  className,
  showPlusIcon = false,
}: CreateFromMarkdownDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<CreateDialogStep>("choice")
  const [rawMarkdown, setRawMarkdown] = useState("")
  const [error, setError] = useState("")

  const resetState = () => {
    setStep("choice")
    setRawMarkdown("")
    setError("")
  }

  const closeDialog = () => {
    setOpen(false)
    resetState()
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetState()
    }
  }

  const handleOpenEditor = () => {
    window.localStorage.removeItem(MARKDOWN_IMPORT_STORAGE_KEY)
    closeDialog()
    router.push("/edit")
    router.refresh()
  }

  const handleContinue = () => {
    const raw = rawMarkdown.trim()
    if (!raw) {
      setError("Markdown 원문을 붙여 넣어주세요.")
      return
    }

    const preset = parseMarkdownPreset(raw)
    if (!preset.title && !preset.excerpt && !preset.body.trim()) {
      setError("유효한 Markdown 내용을 찾지 못했습니다.")
      return
    }

    window.localStorage.setItem(
      MARKDOWN_IMPORT_STORAGE_KEY,
      JSON.stringify(toMarkdownImportPayload(preset))
    )

    closeDialog()
    router.push("/edit")
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button type="button" className={className}>
          {showPlusIcon && (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
          {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl rounded-none">
        {step === "choice" ? (
          <>
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
              <DialogDescription>
                새 글 작성 방식을 선택해주세요.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setStep("markdown")}
                className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-xs tracking-wider text-[#080f18] transition-colors hover:border-[#6096ba] hover:text-[#6096ba]"
              >
                PASTE MARKDOWN
              </button>
              <button
                type="button"
                onClick={handleOpenEditor}
                className="w-full border border-[#e5e5e5] bg-white px-4 py-3 text-xs tracking-wider text-[#080f18] transition-colors hover:border-[#6096ba] hover:text-[#6096ba]"
              >
                OPEN EDITOR
              </button>
              <p className="text-[11px] text-[#8b8c89]">
                Markdown 붙여넣기로 자동 추출하거나, 바로 빈 편집기로 진입할 수 있습니다.
              </p>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={closeDialog}
                className="border border-[#e5e5e5] bg-white px-4 py-2 text-xs tracking-wider text-[#080f18] transition-colors hover:border-[#6096ba] hover:text-[#6096ba]"
              >
                CANCEL
              </button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Paste Markdown</DialogTitle>
              <DialogDescription>
                Markdown 원문을 붙여 넣으면 `title`, `excerpt`, `body`를 자동 추출해 편집기로 이동합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <textarea
                value={rawMarkdown}
                onChange={(event) => {
                  setRawMarkdown(event.target.value)
                  if (error) {
                    setError("")
                  }
                }}
                placeholder={"---\ntitle: ...\nexcerpt: ...\n---\n# Heading\nBody..."}
                className="h-72 w-full resize-y border border-[#e5e5e5] bg-white p-3 text-sm text-[#080f18] outline-none focus:border-[#6096ba]"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <p className="text-[11px] text-[#8b8c89]">
                Frontmatter의 `title`, `excerpt`를 우선 사용합니다. title이 없으면 첫 번째 `# Heading`을 title로 인식합니다.
              </p>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => {
                  setError("")
                  setStep("choice")
                }}
                className="border border-[#e5e5e5] px-4 py-2 text-xs tracking-wider text-[#8b8c89] transition-colors hover:border-[#080f18] hover:text-[#080f18]"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={closeDialog}
                className="border border-[#e5e5e5] bg-white px-4 py-2 text-xs tracking-wider text-[#080f18] transition-colors hover:border-[#6096ba] hover:text-[#6096ba]"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="border border-[#080f18] bg-[#080f18] px-4 py-2 text-xs tracking-wider text-white transition-colors hover:bg-[#1a2632]"
              >
                CONTINUE TO EDIT
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
