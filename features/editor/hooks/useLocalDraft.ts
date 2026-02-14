import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type PersistedDraft<T extends object> = T & {
  updatedAt: string
}

interface UseLocalDraftOptions<T extends object> {
  storageKey: string
  isReady: boolean
  payload: T
  hasMeaningfulContent: (payload: T) => boolean
  onRestore: (payload: T) => void
  debounceMs?: number
}

function stripUpdatedAt<T extends object>(
  value: PersistedDraft<T> | T
): T {
  const clone = { ...(value as object) } as { updatedAt?: unknown }
  delete clone.updatedAt
  return clone as T
}

export function useLocalDraft<T extends object>({
  storageKey,
  isReady,
  payload,
  hasMeaningfulContent,
  onRestore,
  debounceMs = 1200,
}: UseLocalDraftOptions<T>) {
  const [recoverableDraft, setRecoverableDraft] = useState<PersistedDraft<T> | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null)
  const hasCheckedDraftRef = useRef(false)

  const payloadSnapshot = useMemo(() => JSON.stringify(payload), [payload])
  const payloadValue = useMemo(() => JSON.parse(payloadSnapshot) as T, [payloadSnapshot])

  useEffect(() => {
    hasCheckedDraftRef.current = false
    setRecoverableDraft(null)
    setLastAutoSavedAt(null)
  }, [storageKey])

  useEffect(() => {
    if (!isReady || hasCheckedDraftRef.current) {
      return
    }

    hasCheckedDraftRef.current = true

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as PersistedDraft<T>
      if (!parsed || typeof parsed !== "object") {
        return
      }

      const draftSnapshot = JSON.stringify(stripUpdatedAt(parsed))
      if (draftSnapshot !== payloadSnapshot) {
        setRecoverableDraft(parsed)
      }

      if (typeof parsed.updatedAt === "string") {
        setLastAutoSavedAt(parsed.updatedAt)
      }
    } catch (error) {
      console.error("Failed to read local draft:", error)
    }
  }, [isReady, storageKey, payloadSnapshot])

  useEffect(() => {
    if (!isReady || recoverableDraft) {
      return
    }

    if (!hasMeaningfulContent(payloadValue)) {
      localStorage.removeItem(storageKey)
      return
    }

    const timer = setTimeout(() => {
      try {
        setIsAutoSaving(true)
        const nextDraft = {
          ...payloadValue,
          updatedAt: new Date().toISOString(),
        } as PersistedDraft<T>
        localStorage.setItem(storageKey, JSON.stringify(nextDraft))
        setLastAutoSavedAt(nextDraft.updatedAt)
      } catch (error) {
        console.error("Failed to autosave draft:", error)
      } finally {
        setIsAutoSaving(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [storageKey, isReady, recoverableDraft, payloadValue, hasMeaningfulContent, debounceMs])

  const restoreDraft = useCallback(() => {
    if (!recoverableDraft) {
      return false
    }
    onRestore(stripUpdatedAt(recoverableDraft))
    setRecoverableDraft(null)
    return true
  }, [recoverableDraft, onRestore])

  const dismissRecoveredDraft = useCallback(() => {
    setRecoverableDraft(null)
  }, [])

  const deleteRecoveredDraft = useCallback(() => {
    localStorage.removeItem(storageKey)
    setRecoverableDraft(null)
    setLastAutoSavedAt(null)
  }, [storageKey])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(storageKey)
    setRecoverableDraft(null)
    setLastAutoSavedAt(null)
  }, [storageKey])

  return {
    recoverableDraft,
    isAutoSaving,
    lastAutoSavedAt,
    restoreDraft,
    dismissRecoveredDraft,
    deleteRecoveredDraft,
    clearDraft,
  }
}
