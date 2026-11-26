import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNowStrict, isToday, isTomorrow, isYesterday, parseISO, type Locale } from 'date-fns'
import { enUS, ru, uz } from 'date-fns/locale'
import i18n, { LANGUAGES } from '@/i18n'
import { ApiError } from './http'
import type { Contact } from './types'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// ───────────── Locale-aware formatting (follows the active UI language) ─────────────

const DATE_LOCALES: Record<string, Locale> = { en: enUS, ru, uz }
const dateLocale = () => DATE_LOCALES[i18n.language] ?? enUS
const intlLocale = () => LANGUAGES.find((l) => l.code === i18n.language)?.intl ?? 'en-US'

/** The workspace currency: deals are in so'm unless one says otherwise. */
export const DEFAULT_CURRENCY = 'UZS'

/**
 * 120000 → "120 000": thousands split by a non-breaking space, as so'm amounts are written in Uzbekistan. Done by hand
 * because browsers ship no Uzbek number data and silently fall back to "120,000".
 */
export function groupDigits(value: number): string {
  const n = Math.round(value)
  return `${n < 0 ? '−' : ''}${Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}`
}

const SCALES = [[1e9, 'common.scale.b'], [1e6, 'common.scale.m'], [1e3, 'common.scale.k']] as const

/** 120000 → "120 ming", 1500000 → "1,5 mln" (тыс. / млн in Russian, K / M in English); chart axes use it bare. */
export function compactNumber(value: number): string {
  const [size, unit] = SCALES.find(([s]) => Math.abs(value) >= s) ?? [1, null]
  if (!unit) return groupDigits(value)
  const scaled = Math.round((value / size) * 10) / 10
  const text = Number.isInteger(scaled) ? groupDigits(scaled) : scaled.toFixed(1).replace('.', i18n.language === 'en' ? '.' : ',')
  return `${text}${i18n.language === 'en' ? '' : '\u00a0'}${i18n.t(unit)}`
}

export function money(value: number | null | undefined, currency = DEFAULT_CURRENCY, compact = false) {
  // So'm in every language as "120 000 so'm" (browsers print "UZS 120,000" and have no Uzbek grouping).
  if (currency === 'UZS') return `${compact ? compactNumber(value ?? 0) : groupDigits(value ?? 0)}\u00a0${i18n.t('common.som')}`
  try {
    return new Intl.NumberFormat(intlLocale(), {
      style: 'currency', currency, notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0,
    }).format(value ?? 0)
  } catch {
    return `${currency} ${(value ?? 0).toLocaleString()}`
  }
}

export const percent = (value: number) => new Intl.NumberFormat(intlLocale(), { style: 'percent', maximumFractionDigits: 0 }).format(value / 100)

/** 75 → "1:15", 3725 → "1:02:05" */
export function duration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = String(seconds % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}

export const toDate = (iso: string) => (iso.length === 10 ? parseISO(iso) : new Date(iso))

export const shortDate = (iso: string | null | undefined) => (iso ? format(toDate(iso), 'd MMM yyyy', { locale: dateLocale() }) : '—')

export const timeOf = (date: Date) => format(date, 'HH:mm')

export function relativeDay(iso: string) {
  const d = toDate(iso)
  const time = timeOf(d)
  if (isToday(d)) return i18n.t('common.today', { time })
  if (isTomorrow(d)) return i18n.t('common.tomorrow', { time })
  if (isYesterday(d)) return i18n.t('common.yesterday', { time })
  return format(d, 'd MMM, HH:mm', { locale: dateLocale() })
}

export const timeAgo = (iso: string) => formatDistanceToNowStrict(toDate(iso), { addSuffix: true, locale: dateLocale() })

export const monthLabel = (date: Date) => format(date, 'LLL', { locale: dateLocale() })

/** ISO → value for <input type="datetime-local"> */
export const toLocalInput = (iso: string | null | undefined) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : '')

export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

// ───────────── Misc helpers ─────────────

export const fullName = (c: Pick<Contact, 'first_name' | 'last_name'>) => `${c.first_name} ${c.last_name}`.trim()

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

export const byId = <T extends { id: string }>(rows: T[] | undefined) => new Map((rows ?? []).map((r) => [r.id, r]))

export const blankToNull = (value: string | null | undefined) => (value && value.trim() ? value.trim() : null)

/** Translates API error codes; falls back to the server message. */
export function errorMessage(error: unknown) {
  const issue = error instanceof ApiError ? error.fields?.[0] : undefined
  if (issue) return i18n.t(`validation.rules.${issue.code}` as 'validation.rules.required', { min: issue.min, max: issue.max })
  if (error instanceof ApiError && error.code && i18n.exists(`errors.${error.code}`)) return i18n.t(`errors.${error.code}` as 'errors.generic')
  if (error instanceof TypeError) return i18n.t('errors.network')
  if (error instanceof Error && error.message) return error.message
  return i18n.t('errors.generic')
}

/** An in-app path from an untrusted source (`?next=`): `//evil.com` and `/\evil.com` would leave the site. */
export function safeInternalPath(path: string | null | undefined, fallback = '/'): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[\u0000-\u001f]/.test(path)) return fallback
  return path
}
