import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { account as enAccount } from './locales/en/account'
import { admin as enAdmin } from './locales/en/admin'
import { access as enAccess } from './locales/en/access'
import { billing as enBilling } from './locales/en/billing'
import { record as enRecord } from './locales/en/record'
import { labels as enLabels } from './locales/en/labels'
import { instagram as enInstagram } from './locales/en/instagram'
import { core as enCore } from './locales/en/core'
import { engage as enEngage } from './locales/en/engage'
import { sales as enSales } from './locales/en/sales'
import { telephony as enTelephony } from './locales/en/telephony'
import { account as ruAccount } from './locales/ru/account'
import { admin as ruAdmin } from './locales/ru/admin'
import { access as ruAccess } from './locales/ru/access'
import { billing as ruBilling } from './locales/ru/billing'
import { record as ruRecord } from './locales/ru/record'
import { labels as ruLabels } from './locales/ru/labels'
import { instagram as ruInstagram } from './locales/ru/instagram'
import { core as ruCore } from './locales/ru/core'
import { engage as ruEngage } from './locales/ru/engage'
import { sales as ruSales } from './locales/ru/sales'
import { telephony as ruTelephony } from './locales/ru/telephony'
import { account as uzAccount } from './locales/uz/account'
import { admin as uzAdmin } from './locales/uz/admin'
import { access as uzAccess } from './locales/uz/access'
import { billing as uzBilling } from './locales/uz/billing'
import { record as uzRecord } from './locales/uz/record'
import { labels as uzLabels } from './locales/uz/labels'
import { instagram as uzInstagram } from './locales/uz/instagram'
import { core as uzCore } from './locales/uz/core'
import { engage as uzEngage } from './locales/uz/engage'
import { sales as uzSales } from './locales/uz/sales'
import { telephony as uzTelephony } from './locales/uz/telephony'

export const en = { ...enCore, ...enSales, ...enEngage, ...enTelephony, ...enAccount, ...enAdmin, ...enAccess, ...enBilling, ...enRecord, ...enLabels, ...enInstagram }

export const LANGUAGES = [
  { code: 'uz', label: 'Oʻzbekcha', short: 'UZ', intl: 'uz-UZ' },
  { code: 'ru', label: 'Русский', short: 'RU', intl: 'ru-RU' },
  { code: 'en', label: 'English', short: 'EN', intl: 'en-US' },
] as const

export type Language = (typeof LANGUAGES)[number]['code']

const STORAGE_KEY = 'orbit:lang'

function detectLanguage(): Language {
  const isKnown = (code: string | null | undefined): code is Language => LANGUAGES.some((l) => l.code === code)
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isKnown(stored)) return stored
  } catch {
    /* storage blocked */
  }
  const browser = navigator.language.slice(0, 2)
  return isKnown(browser) ? browser : 'en'
}

export function setLanguage(code: Language) {
  void i18n.changeLanguage(code)
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* ignore */
  }
}

i18n.on('languageChanged', (code) => document.documentElement.setAttribute('lang', code))

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uz: { translation: { ...uzCore, ...uzSales, ...uzEngage, ...uzTelephony, ...uzAccount, ...uzAdmin, ...uzAccess, ...uzBilling, ...uzRecord, ...uzLabels, ...uzInstagram } },
    ru: { translation: { ...ruCore, ...ruSales, ...ruEngage, ...ruTelephony, ...ruAccount, ...ruAdmin, ...ruAccess, ...ruBilling, ...ruRecord, ...ruLabels, ...ruInstagram } },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
