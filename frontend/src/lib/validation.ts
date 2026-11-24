import type { ParseKeys } from 'i18next'

/** Same shape the API accepts (email-validator needs a dot and a 2+ letter TLD after the @). */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/
export const MIN_PASSWORD = 8

export type RuleCode = 'required' | 'email' | 'too_short' | 'too_long' | 'mismatch' | 'invalid' | 'wrong_password' | 'range' | 'min_value'
export interface Issue {
  code: RuleCode
  min?: number
  max?: number
}
export type Rule = (value: string) => Issue | null

export const rules = {
  required: (): Rule => (v) => (v.trim() ? null : { code: 'required' }),
  email: (): Rule => (v) => (!v.trim() || EMAIL.test(v.trim()) ? null : { code: 'email' }),
  min: (min: number): Rule => (v) => (!v || v.length >= min ? null : { code: 'too_short', min }),
  /** A whole number within [min, max] (empty passes; combine with required). */
  range: (min: number, max = Number.MAX_SAFE_INTEGER): Rule => (v) => {
    if (!v.trim()) return null
    const n = Number(v)
    if (Number.isInteger(n) && n >= min && n <= max) return null
    return max === Number.MAX_SAFE_INTEGER ? { code: 'min_value', min } : { code: 'range', min, max }
  },
  same: (other: () => string): Rule => (v) => (v === other() ? null : { code: 'mismatch' }),
}

/** A new password: required and at least the API's minimum length. */
export const newPassword = () => [rules.required(), rules.min(MIN_PASSWORD)]

export const issueKey = (issue: Issue): ParseKeys => `validation.rules.${issue.code}`

/** The first failing rule of each field. */
export function check<F extends string>(values: Record<F, string>, schema: Partial<Record<F, Rule[]>>): Partial<Record<F, Issue>> {
  const issues: Partial<Record<F, Issue>> = {}
  for (const field of Object.keys(schema) as F[]) {
    const issue = schema[field]?.map((rule) => rule(values[field] ?? '')).find(Boolean)
    if (issue) issues[field] = issue
  }
  return issues
}
