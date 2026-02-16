interface RateLimitState {
  count: number
  windowStart: number
  lockUntil: number
  failures: number
}

const states = new Map<string, RateLimitState>()

export interface RateLimitOptions {
  windowMs: number
  maxRequests: number
  baseBackoffMs: number
  maxBackoffMs: number
}

export interface RateLimitResult {
  allowed: boolean
  retryAfterMs: number
  remaining: number
  resetsAt: number
}

const DEFAULT_RATE_LIMIT_OPTIONS: RateLimitOptions = {
  windowMs: 60_000,
  maxRequests: 10,
  baseBackoffMs: 3_000,
  maxBackoffMs: 60_000,
}

function getOrCreateState(key: string): RateLimitState {
  const now = Date.now()
  const existing = states.get(key)
  if (!existing) {
    const next: RateLimitState = {
      count: 0,
      windowStart: now,
      lockUntil: 0,
      failures: 0,
    }
    states.set(key, next)
    return next
  }

  if (existing.lockUntil && now > existing.lockUntil) {
    existing.lockUntil = 0
  }

  if (now - existing.windowStart > DEFAULT_RATE_LIMIT_OPTIONS.windowMs) {
    existing.count = 0
    existing.windowStart = now
    existing.failures = 0
  }

  return existing
}

function calculateBackoffMs(failures: number, options: RateLimitOptions) {
  const stage = Math.min(failures, 8)
  return Math.min(options.maxBackoffMs, options.baseBackoffMs * 2 ** stage)
}

export function consumeRateLimit(
  key: string,
  options: Partial<RateLimitOptions> = {}
): RateLimitResult {
  const config = { ...DEFAULT_RATE_LIMIT_OPTIONS, ...options }
  const now = Date.now()
  const state = getOrCreateState(key)

  if (state.lockUntil > now) {
    return {
      allowed: false,
      retryAfterMs: state.lockUntil - now,
      remaining: 0,
      resetsAt: state.lockUntil,
    }
  }

  if (now - state.windowStart > config.windowMs) {
    state.count = 0
    state.windowStart = now
  }

  if (state.count >= config.maxRequests) {
    state.failures += 1
    state.lockUntil = now + calculateBackoffMs(state.failures, config)
    state.count = 0
    state.windowStart = now
    return {
      allowed: false,
      retryAfterMs: state.lockUntil - now,
      remaining: 0,
      resetsAt: state.lockUntil,
    }
  }

  state.count += 1
  states.set(key, state)

  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: Math.max(config.maxRequests - state.count, 0),
    resetsAt: state.windowStart + config.windowMs,
  }
}

export function resetRateLimit(key: string): void {
  states.delete(key)
}

export function getRateLimitStateSnapshot(key: string) {
  return states.get(key)
}

export function getRequestIp(request: Request): string {
  const headers = request.headers
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  )
}
