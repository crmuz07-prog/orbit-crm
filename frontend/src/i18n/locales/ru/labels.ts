import type { Locale } from '../../types'
import type { labels as en } from '../en/labels'

export const labels: Locale<typeof en> = {
  defaults: {
    stage: { leadIn: 'Новый лид', qualified: 'Квалифицирован', discovery: 'Знакомство / Демо', proposal: 'Предложение', negotiation: 'Переговоры', won: 'Успешно реализовано', lost: 'Закрыто и не реализовано' },
    pipeline: { sales: 'Воронка продаж' },
    role: { salesRep: 'Менеджер по продажам', teamLead: 'Руководитель группы', viewer: 'Наблюдатель' },
  },
  options: {
    source: { inbound: 'Входящее обращение', outbound: 'Активные продажи', referral: 'Рекомендация', partner: 'Партнёр', event: 'Мероприятие', website: 'Сайт' },
    industry: {
      saas: 'SaaS', fintech: 'Финтех', logistics: 'Логистика', manufacturing: 'Производство', healthcare: 'Здравоохранение', energy: 'Энергетика',
      retail: 'Розничная торговля', telecom: 'Телеком', education: 'Образование', aerospace: 'Аэрокосмос', food: 'Продукты и напитки', mining: 'Горнодобыча',
      cybersecurity: 'Кибербезопасность', other: 'Другое',
    },
  },
  examples: {
    companyName: 'ООО «Шёлковый путь»', domain: 'silkway.uz', country: 'Узбекистан', city: 'Ташкент', jobTitle: 'Руководитель отдела закупок',
    dealName: 'Шёлковый путь — годовая лицензия', personName: 'Азиз Каримов', email: 'vy@kompaniya.uz',
  },
  datePicker: { placeholder: 'Выберите дату', clear: 'Очистить дату', time: 'Время', hour: 'Час', minute: 'Мин' },
  misc: { autoCall: '{{direction}} звонок · {{name}}', callBack: 'Перезвонить {{phone}}', demo: 'Демо', close: 'Закрыть' },
}
