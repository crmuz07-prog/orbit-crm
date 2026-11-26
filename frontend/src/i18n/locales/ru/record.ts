import type { Locale } from '../../types'
import type { record as en } from '../en/record'

export const record: Locale<typeof en> = {
  pipelines: {
    title: 'Воронки', description: 'У каждой воронки свои этапы, правила и сроки.', add: 'Добавить воронку', name: 'Название воронки',
    newName: 'Новая воронка', created: 'Воронка создана', saved: 'Воронка сохранена', deleted: 'Воронка удалена', default: 'Основная', makeDefault: 'Сделать основной',
    deleteConfirm: 'Удалить воронку «{{name}}»?', deleteDesc: 'Её этапы тоже удалятся. Воронку со сделками удалить нельзя.',
    select: 'Воронка', rule: 'Правило этапа', rulePlaceholder: 'например: сделка не может находиться здесь дольше 24 часов', maxDays: 'Макс. дней',
  },
  board: {
    header_one: '{{count}} сделка: {{sum}}', header_few: '{{count}} сделки: {{sum}}', header_many: '{{count}} сделок: {{sum}}', header_other: '{{count}} сделки: {{sum}}',
    quickAdd: 'Быстрое добавление', quickTitle: 'Название сделки', quickAmount: 'Сумма',
    inStage_one: '{{count}} день на этапе', inStage_few: '{{count}} дня на этапе', inStage_many: '{{count}} дней на этапе', inStage_other: '{{count}} дня на этапе',
    report: 'Отчёт по движению сделок',
  },
  report: {
    title: 'Движение сделок', stage: 'Этап', now: 'Сейчас', entered: 'Вошло', avgTime: 'Среднее время на этапе',
    days_one: 'Последний {{count}} день', days_few: 'Последние {{count}} дня', days_many: 'Последние {{count}} дней', days_other: 'Последние {{count}} дня',
  },
  feed: {
    today: 'Сегодня', yesterday: 'Вчера', created: 'создал(а) запись', createdIn: 'создал(а) сделку на этапе «{{stage}}»',
    set: 'для поля «{{field}}» установлено значение «{{value}}»', cleared: 'очистил(а) поле «{{field}}»', moved: 'перевёл(а) сделку с этапа «{{from}}» на «{{to}}»',
    system: 'Система', noTasks: 'Нет запланированных задач, рекомендуем', addTask: 'добавить', empty: 'Пока пусто. Напишите примечание или внесите звонок ниже.',
  },
  card: { linked: 'Связи', main: 'Основное', stageTimes: 'Время сделки на этапах', saved: 'Сохранено', edit: 'Нажмите, чтобы изменить', none: 'Не указано' },
  feedFields: {
    title: 'Название', amount: 'Бюджет', currency: 'Валюта', company_id: 'Компания', contact_id: 'Контакт', owner_id: 'Ответственный', priority: 'Приоритет',
    source: 'Источник', expected_close_date: 'Ожидаемое закрытие', lost_reason: 'Причина отказа', name: 'Название', domain: 'Сайт', industry: 'Отрасль',
    employees: 'Сотрудники', country: 'Страна', city: 'Город', annual_revenue: 'Годовая выручка', lifecycle: 'Стадия клиента', description: 'Описание',
    first_name: 'Имя', last_name: 'Фамилия', email: 'Email', phone: 'Телефон', title_job: 'Должность', linkedin_url: 'LinkedIn',
  },
  duration: { d: '{{count}} д', h: '{{count}} ч', m: '{{count}} мин', lessThanMinute: '< 1 мин' },
}
