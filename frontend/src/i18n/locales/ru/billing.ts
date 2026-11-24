import type { Locale } from '../../types'
import type { billing as en } from '../en/billing'

export const billing: Locale<typeof en> = {
  billing: {
    tab: 'Платежи', manage: 'Подписка', status: { active: 'Активна', expiring: 'Скоро закончится', expired: 'Истекла', blocked: 'Заблокирована' },
    paidUntil: 'Оплачено до', noEnd: 'Бессрочно', seats: 'Места', unlimited: 'Без ограничений', seatsUsed: '{{used}} / {{limit}}',
    recordPayment: 'Внести платёж', amount: 'Сумма (UZS)', months: 'Месяцев', seatsField: 'Мест (необязательно)', note: 'Комментарий',
    newEnd: 'После платежа оплачено до: {{date}}', paymentRecorded: 'Платёж внесён', saved: 'Подписка обновлена',
    limits: 'Ограничения', seatLimit: 'Лимит мест', endDate: 'Дата окончания (включительно)', block: 'Заблокировать компанию', unblock: 'Разблокировать',
    blockConfirm: 'Заблокировать {{name}}?', blockDesc: 'Пока компания заблокирована, никто из участников не войдёт в CRM.',
    history: 'История платежей', noPayments: 'Платежей пока нет', total: 'Всего получено', period: 'Период', company: 'Компания', date: 'Дата',
    daysLeft_one: 'Остался {{count}} день', daysLeft_few: 'Осталось {{count}} дня', daysLeft_many: 'Осталось {{count}} дней', daysLeft_other: 'Осталось {{count}} дня',
    emptyHint: 'Оставьте пустым — без ограничений',
    warning_one: 'Подписка закончится через {{count}} день ({{date}}). Для продления обратитесь к администратору платформы.',
    warning_few: 'Подписка закончится через {{count}} дня ({{date}}). Для продления обратитесь к администратору платформы.',
    warning_many: 'Подписка закончится через {{count}} дней ({{date}}). Для продления обратитесь к администратору платформы.',
    warning_other: 'Подписка закончится через {{count}} дня ({{date}}). Для продления обратитесь к администратору платформы.',
    expiredTitle: 'Подписка закончилась', expiredDesc: 'Доступ к {{name}} приостановлен. Попросите администратора платформы продлить подписку.',
    blockedTitle: 'Компания заблокирована', blockedDesc: 'Администратор платформы заблокировал {{name}}. Пожалуйста, свяжитесь с ним.',
    teamSeats: 'Занято мест: {{used}} из {{limit}}',
  },
}
