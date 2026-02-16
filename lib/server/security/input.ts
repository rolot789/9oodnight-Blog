import type { NextRequest } from "next/server"
import { type ZodIssue, type ZodTypeAny, z } from "zod"

export interface ValidationSuccess<T> {
  success: true
  data: T
}

export interface ValidationFailure {
  success: false
  message: string
  issues?: ZodIssue[]
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

function buildValidationMessage(issues: ZodIssue[]): string {
  const firstIssue = issues[0]
  if (!firstIssue) {
    return "입력값이 유효하지 않습니다."
  }

  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : ""
  return `${path}${firstIssue.message}`
}

export async function validateJsonBody<T extends ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (parsed.success) {
      return {
        success: true,
        data: parsed.data,
      }
    }

    return {
      success: false,
      message: buildValidationMessage(parsed.error.issues),
      issues: parsed.error.issues,
    }
  } catch {
    return {
      success: false,
      message: "요청 본문 형식이 잘못되었습니다.",
    }
  }
}

export function validateQueryParams<T extends ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): ValidationResult<z.infer<T>> {
  const raw: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (!raw[key]) {
      raw[key] = value
    }
  })

  const parsed = schema.safeParse(raw)
  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
    }
  }

  return {
    success: false,
    message: buildValidationMessage(parsed.error.issues),
    issues: parsed.error.issues,
  }
}
