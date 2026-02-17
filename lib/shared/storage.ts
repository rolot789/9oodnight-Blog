export function extractFileExtension(name: string): string {
  const rawExt = name.split(".").pop() || ""
  return rawExt.toLowerCase()
}

export function sanitizeStorageName(ext: string): string {
  const safeExt = ext.slice(0, 8)
  return `${crypto.randomUUID().replace(/-/g, "")}.${safeExt}`
}

// Validates Supabase Storage paths: alphanumeric start, safe chars, whitelisted extensions
export function isSafeStoragePath(filePath: string): boolean {
  return /^[a-z0-9][a-z0-9/_-]{2,220}\.(png|jpg|jpeg|gif|webp|pdf|txt|md|csv|json)$/i.test(
    filePath,
  )
}
