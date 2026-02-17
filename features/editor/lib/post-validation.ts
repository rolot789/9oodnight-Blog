import { extractFileExtension, sanitizeStorageName } from "@/lib/shared/storage"
export { isMissingRelationError } from "@/lib/shared/supabase-errors"

export const MAX_EXCERPT_LENGTH = 500
export const MAX_TITLE_LENGTH = 120
export const MAX_CONTENT_LENGTH = 30000
export const MAX_TAG_LENGTH = 30
export const MAX_TAGS = 12
export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024
export const MAX_FEATURED_IMAGE_BYTES = 4 * 1024 * 1024
export const SAFE_ATTACHMENT_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
  "txt",
  "md",
  "csv",
  "json",
])
export const SAFE_IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"])
export const DISALLOWED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "sh",
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "php",
  "py",
  "pl",
  "jar",
  "dll",
  "msi",
  "apk",
  "iso",
  "com",
  "scr",
  "ps1",
  "vbs",
  "aspx",
  "asp",
  "jsp",
  "pyc",
  "pyo",
  "go",
  "class",
  "bin",
  "elf",
  "so",
  "dmg",
  "app",
  "html",
  "htm",
  "svg",
  "xml",
])

export async function readSignature(file: File, bytes = 16): Promise<number[]> {
  const buffer = await file.slice(0, bytes).arrayBuffer()
  return Array.from(new Uint8Array(buffer))
}

export function hasBinarySignature(signature: number[], fileType: "image" | "pdf"): boolean {
  if (fileType === "image") {
    const png = [0x89, 0x50, 0x4e, 0x47]
    const jpeg = [0xff, 0xd8, 0xff]
    const gif = [0x47, 0x49, 0x46]
    const webp = [0x52, 0x49, 0x46, 0x46]
    return (
      signature.slice(0, 4).every((value, index) => value === png[index]) ||
      signature.slice(0, 3).every((value, index) => value === jpeg[index]) ||
      signature.slice(0, 3).every((value, index) => value === gif[index]) ||
      signature.slice(0, 4).every((value, index) => value === webp[index])
    )
  }

  const pdf = [0x25, 0x50, 0x44, 0x46]
  return signature.slice(0, 4).every((value, index) => value === pdf[index])
}

export function normalizeUploadTag(tag: string): string {
  return tag
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9가-힣-]/g, "")
    .slice(0, MAX_TAG_LENGTH)
}

export function sanitizeTags(values: string[]): string[] {
  const unique = new Set<string>()
  values.forEach((rawTag) => {
    const tag = normalizeUploadTag(rawTag)
    if (tag) {
      unique.add(tag.toLowerCase())
    }
  })
  return Array.from(unique).slice(0, MAX_TAGS)
}

export function sanitizeInputText(
  value: string,
  maxLength: number,
  fallback = ""
): string {
  return value.trim().slice(0, maxLength) || fallback
}

export async function validateAttachmentFile(file: File, kind: "image" | "attachment"): Promise<string> {
  const ext = extractFileExtension(file.name)
  if (!ext) {
    throw new Error("확장자가 없는 파일은 업로드할 수 없습니다.")
  }

  if (DISALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("실행 파일/스크립트 파일은 업로드할 수 없습니다.")
  }

  const maxBytes = kind === "image" ? MAX_FEATURED_IMAGE_BYTES : MAX_ATTACHMENT_BYTES
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("파일 크기가 허용 범위를 초과했습니다.")
  }

  const allowedExtensions = kind === "image" ? SAFE_IMAGE_EXTENSIONS : SAFE_ATTACHMENT_EXTENSIONS
  if (!allowedExtensions.has(ext)) {
    throw new Error("지원되지 않는 파일 형식입니다.")
  }

  const mime = (file.type || "").toLowerCase()
  if (kind === "image") {
    if (!mime.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드할 수 있습니다.")
    }
  }

  if (kind === "image" || ext === "pdf") {
    const signature = await readSignature(file)
    if (kind === "image" && !hasBinarySignature(signature, "image")) {
      throw new Error("이미지 파일 시그니처가 유효하지 않습니다.")
    }
    if (ext === "pdf" && !hasBinarySignature(signature, "pdf")) {
      throw new Error("PDF 파일 시그니처가 유효하지 않습니다.")
    }
  }

  return sanitizeStorageName(ext)
}

export function normalizeSeriesSlug(input: string): string {
  return input
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}
