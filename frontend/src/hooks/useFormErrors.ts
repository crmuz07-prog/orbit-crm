import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/lib/http'
import { check, issueKey, type Issue, type Rule, type RuleCode } from '@/lib/validation'

/**
 * Inline field errors for a form: client rules before sending, and the API's 422 field errors after.
 * Field names are the inputs' `name` attributes, so the first invalid one can be focused.
 */
export function useFormErrors<F extends string>(formId: string) {
  const { t } = useTranslation()
  const [issues, setIssues] = useState<Partial<Record<F, Issue>>>({})

  const focusFirst = (fields: string[]) => {
    const first = fields[0]
    if (first) document.querySelector<HTMLInputElement>(`#${formId} [name="${first}"]`)?.focus()
  }

  /** True when every field passes; otherwise shows the errors and focuses the first one. */
  const validate = (values: Record<F, string>, schema: Partial<Record<F, Rule[]>>) => {
    const found = check(values, schema)
    setIssues(found)
    focusFirst(Object.keys(schema).filter((f) => f in found))
    return Object.keys(found).length === 0
  }

  /**
   * Puts an API validation error on its fields; false when it was not a field error (show a toast instead).
   * `alias` maps API field names to this form's; a business error code can be pinned to a field too
   * (e.g. `{ code: 'wrong_password', field: 'current' }`).
   */
  const fromApi = (error: unknown, alias: Partial<Record<string, F>> = {}, pin?: { code: RuleCode; field: F }) => {
    if (pin && error instanceof ApiError && error.code === pin.code) {
      setIssues({ [pin.field]: { code: pin.code } } as Partial<Record<F, Issue>>)
      focusFirst([pin.field])
      return true
    }
    if (!(error instanceof ApiError) || !error.fields?.length) return false
    const found: Partial<Record<F, Issue>> = {}
    for (const f of error.fields) {
      // "owner.email" → "email"; an alias maps API names to this form's fields.
      const name = alias[f.field] ?? (f.field.split('.').pop() as F)
      if (!(name in found)) found[name] = { code: f.code, min: f.min, max: f.max }
    }
    setIssues(found)
    focusFirst(Object.keys(found))
    return Object.keys(found).length > 0
  }

  const message = (field: F) => {
    const issue = issues[field]
    return issue ? t(issueKey(issue), { min: issue.min, max: issue.max }) : undefined
  }
  /** Clears one field's error while the person fixes it. */
  const clear = useCallback((field: F) => setIssues((all) => (field in all ? { ...all, [field]: undefined } : all)), [])

  /** onChange for a field: stores the value and clears that field's error. */
  const bind = (field: F, setValue: (value: string) => void) => (value: string) => {
    setValue(value)
    clear(field)
  }

  return { validate, fromApi, message, clear, bind }
}
