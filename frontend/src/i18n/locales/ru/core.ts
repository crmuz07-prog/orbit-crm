import type { Locale } from '../../types'
import type { core as en } from '../en/core'

export const core: Locale<typeof en> = {
  common: {
    save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', edit: 'Изменить', add: 'Добавить', back: 'Назад', reset: 'Сбросить',
    saveChanges: 'Сохранить изменения', pleaseWait: 'Подождите…', deleted: 'Удалено', viewAll: 'Все', none: '—',
    noResults: 'Ничего не найдено.', cannotUndo: 'Это действие нельзя отменить.', notFound: '{{label}}: не найдено',
    notFoundDesc: 'Возможно, запись была удалена.', created: '{{entity}}: создано', updated: '{{entity}}: обновлено',
    today: 'Сегодня, {{time}}', tomorrow: 'Завтра, {{time}}', yesterday: 'Вчера, {{time}}', overdue: 'Просрочено',
  },
  entity: { deal: 'Сделка', company: 'Компания', contact: 'Контакт', activity: 'Активность', call: 'Звонок' },
  dialog: {
    new: { deal: 'Новая сделка', company: 'Новая компания', contact: 'Новый контакт', activity: 'Новая активность', call: 'Записать звонок', wrapUp: 'Итоги звонка' },
    edit: { deal: 'Изменить сделку', company: 'Изменить компанию', contact: 'Изменить контакт', activity: 'Изменить активность', call: 'Изменить звонок', wrapUp: 'Итоги звонка' },
  },
  nav: {
    workspace: 'Рабочее пространство', dashboard: 'Дашборд', deals: 'Сделки', companies: 'Компании', contacts: 'Контакты',
    activities: 'Активности', calls: 'Звонки', settings: 'Настройки', signOut: 'Выйти', openMenu: 'Открыть меню',
    search: 'Поиск или переход…', lightMode: 'Светлая тема', darkMode: 'Тёмная тема', language: 'Язык',
    create: 'Создать', new: 'Создать', demoBanner: 'Вы в демо-пространстве — изменения общие, их можно сбросить в Настройках.',
  },
  palette: {
    placeholder: 'Ищите сделки, компании, контакты или введите команду…', create: 'Создать', goTo: 'Перейти',
    deals: 'Сделки', companies: 'Компании', contacts: 'Контакты', logCall: 'Записать звонок',
    navigate: '↑↓ выбор', open: '↵ открыть', close: 'esc закрыть',
  },
  enums: {
    lifecycle: { lead: 'Лид', prospect: 'Потенциальный клиент', customer: 'Клиент', churned: 'Ушёл' },
    priority: { low: 'Низкий', medium: 'Средний', high: 'Высокий' },
    priorityFilter: 'Приоритет: {{label}}',
    activity: { note: 'Заметка', call: 'Звонок', email: 'Email', meeting: 'Встреча', task: 'Задача' },
    status: { open: 'Открыта', won: 'Выиграна', lost: 'Проиграна' },
    outcome: { connected: 'Дозвонились', no_answer: 'Нет ответа', voicemail: 'Голосовая почта', busy: 'Занято', wrong_number: 'Неверный номер' },
    direction: { outbound: 'Исходящий', inbound: 'Входящий' },
    lostReason: {
      price: 'Слишком дорого', competitor: 'Выбрали конкурента', budget: 'Нет бюджета',
      stalled: 'Нет решения', features: 'Не хватает функций', timing: 'Неподходящее время',
    },
  },
  validation: {
    dealName: 'Укажите название сделки', stage: 'Выберите этап воронки', companyName: 'Укажите название компании',
    firstName: 'Укажите имя', email: 'Похоже, email указан неверно', subject: 'Укажите тему', writeSomething: 'Сначала напишите что-нибудь',
  },
  errors: {
    permission_denied: 'Недостаточно прав для этого действия', owner_out_of_scope: 'Нельзя назначить записи этому сотруднику', session_revoked: 'Сеанс завершён — войдите снова', too_many_attempts: 'Слишком много неудачных попыток. Повторите через 15 минут', default_role: 'Роль по умолчанию нельзя удалить', name_taken: 'Это название уже занято',
    registration_disabled: 'Аккаунты создаёт администратор', account_disabled: 'Аккаунт отключён — обратитесь к администратору', self_lockout: 'Нельзя отключить себя или снять с себя права',
    forbidden: 'Недостаточно прав для этого действия', invalid_token: 'Ссылка недействительна или устарела', invite_email_mismatch: 'Приглашение отправлено на другой email', last_owner: 'В пространстве должен быть хотя бы один владелец', demo_read_only: 'В демо это изменить нельзя', already_member: 'Этот человек уже в пространстве', wrong_password: 'Текущий пароль неверный',
    generic: 'Что-то пошло не так', not_found: 'Запись не найдена', stage_has_deals: 'Перед удалением перенесите сделки из этого этапа',
    email_taken: 'Аккаунт с таким email уже существует', invalid_credentials: 'Неверный email или пароль', invalid_signature: 'Неверная подпись webhook', invalid_payload: 'Неверное событие звонка',
    no_workspace: 'У аккаунта нет рабочего пространства', demo_disabled: 'Демо отключено', not_authenticated: 'Пожалуйста, войдите снова',
    reset_demo_only: 'Сбросить можно только демо-пространство', network: 'Нет связи с сервером',
  },
  settings: {
    title: 'Настройки', description: 'Пространство, воронка и предпочтения', profile: 'Профиль',
    pipeline: 'Воронка продаж', pipelineDesc: 'Этапы и вероятность выигрыша определяют взвешенный прогноз.', addStage: 'Добавить этап',
    newStage: 'Новый этап', stageSaved: 'Этап сохранён',
    dealCount_one: '{{count}} сделка', dealCount_few: '{{count}} сделки', dealCount_many: '{{count}} сделок', dealCount_other: '{{count}} сделки',
    wonStage: 'Этап выигрыша', lostStage: 'Этап проигрыша', moveUp: 'Выше', moveDown: 'Ниже', deleteStage: 'Удалить этап',
    appearance: 'Внешний вид', theme: 'Тема', light: 'Светлая', dark: 'Тёмная', language: 'Язык', data: 'Данные',
    sampleTitle: 'Загрузить демо-данные', sampleDesc: 'Добавляет 15 международных компаний с контактами, сделками, звонками и активностями.',
    sampleDone: 'Демо-данные загружены', resetTitle: 'Сбросить демо-пространство', resetDesc: 'Удаляет всё в демо и восстанавливает исходные данные.',
    resetConfirm: 'Сбросить демо-пространство?', resetConfirmDesc: 'Все изменения в демо-пространстве будут потеряны.', resetDone: 'Демо-пространство сброшено',
  },
  auth: {
    waking: 'Сервер просыпается… на бесплатном хостинге это может занять до минуты.',
    welcome: 'С возвращением', create: 'Создайте рабочее пространство', signInSub: 'Войдите в своё пространство продаж.',
    signUpSub: 'Начните управлять B2B-воронкой за несколько минут.', demo: 'Открыть демо-пространство', or: 'или',
    fullName: 'Полное имя', email: 'Рабочий email', password: 'Пароль', signIn: 'Войти', signUp: 'Создать аккаунт',
    newHere: 'Впервые в Orbit?', createAccount: 'Создайте аккаунт', haveAccount: 'Уже есть аккаунт?',
    tagline: 'CRM для B2B-команд, которые закрывают сделки.',
    f1: 'Визуальная воронка', f1Text: 'Перетаскивайте сделки между этапами и сразу видьте зависшие.',
    f2: 'Каждый звонок зафиксирован', f2Text: 'Звонки, о чём говорили и следующие шаги с напоминаниями.',
    f3: 'Безопасность по умолчанию', f3Text: 'Каждое пространство изолировано на уровне API.',
  },
}
