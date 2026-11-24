import type { TFunction } from 'i18next'

/** "3 d 4 h", "2 h 15 min", "< 1 min" — the two most significant units. */
export function formatDuration(seconds: number, t: TFunction): string {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return t('duration.lessThanMinute')
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const parts = days ? [t('duration.d', { count: days }), hours && t('duration.h', { count: hours })]
    : hours ? [t('duration.h', { count: hours }), minutes % 60 && t('duration.m', { count: minutes % 60 })]
      : [t('duration.m', { count: minutes })]
  return parts.filter(Boolean).join(' ')
}
