export function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }
  const code = "code" in error ? String((error as { code?: string }).code ?? "") : ""
  return code === "42P01" || code === "42703"
}
