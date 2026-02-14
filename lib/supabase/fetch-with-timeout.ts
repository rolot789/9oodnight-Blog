const DEFAULT_SUPABASE_TIMEOUT_MS = 10000

function getSupabaseTimeoutMs(): number {
  const raw =
    process.env.SUPABASE_REQUEST_TIMEOUT_MS ??
    process.env.NEXT_PUBLIC_SUPABASE_REQUEST_TIMEOUT_MS ??
    `${DEFAULT_SUPABASE_TIMEOUT_MS}`
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SUPABASE_TIMEOUT_MS
  }
  return parsed
}

export async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
) {
  const controller = new AbortController()
  const timeoutMs = getSupabaseTimeoutMs()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  const upstreamSignal = init?.signal
  const onUpstreamAbort = () => controller.abort()

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort()
    } else {
      upstreamSignal.addEventListener("abort", onUpstreamAbort, { once: true })
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } catch (error) {
    if (controller.signal.aborted && !(upstreamSignal?.aborted)) {
      throw new Error(`Supabase request timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
    if (upstreamSignal) {
      upstreamSignal.removeEventListener("abort", onUpstreamAbort)
    }
  }
}
