import type { Locale } from '../../types'
import type { engage as en } from '../en/engage'

export const engage: Locale<typeof en> = {
  activities: {
    title: 'Активности', description: 'Звонки, встречи, письма и задачи по всей воронке', newActivity: 'Новая активность',
    overdue: 'Просрочено', today: 'Сегодня', upcoming: 'Предстоящие', done: 'Выполнено', all: 'Все', allTypes: 'Все типы',
    emptyOverdue: 'Просроченных нет 🎉', empty: 'Здесь пусто', emptyDesc: 'Планируйте следующие шаги, чтобы сделки не остывали.',
    type: 'Тип', due: 'Срок', when: 'Когда', subject: 'Тема', subjectRequired: 'Тема *', details: 'Подробности',
    deal: 'Сделка', company: 'Компания', contact: 'Контакт', remind: 'Напомнить', subjectPlaceholder: 'Связаться по предложению',
    timeline: 'Активность', upcomingCount: 'Предстоящие · {{count}}', history: 'История', pinned: 'Закреплено',
    timelineEmpty: 'Активности пока нет', timelineEmptyDesc: 'Запишите звонок, письмо или заметку, чтобы начать историю.',
    markDone: 'Отметить выполненным', markedDone: 'Выполнено', deleted: 'Активность удалена', pin: 'Закрепить', unpin: 'Открепить',
    logged: '{{type}}: записано',
    placeholder: {
      note: 'Напишите заметку… (видна только вашей команде)', call: 'Итог звонка, следующие шаги…', email: 'Краткое содержание письма…',
      meeting: 'Повестка или заметки встречи…', task: 'Детали задачи…',
    },
    submit: { note: 'Сохранить заметку', call: 'Записать звонок', email: 'Записать письмо', meeting: 'Записать встречу', task: 'Создать задачу' },
  },
  reminder: {
    none: 'Без напоминания', atTime: 'В момент срока', min15: 'За 15 минут', hour1: 'За 1 час', day1: 'За 1 день',
    title: 'Напоминания', empty: 'Напоминаний нет', emptyDesc: 'Здесь появятся напоминания по задачам и следующим шагам.',
    due: 'Сейчас', upcoming: 'Предстоящие', snooze: 'Отложить', snooze10: '10 минут', snooze60: '1 час',
    tomorrow: 'Завтра в 9:00', done: 'Готово', snoozed: 'Отложено до {{time}}', toast: 'Напоминание',
    enableNotifications: 'Включить уведомления браузера', open: 'Открыть напоминания',
    dueCount_one: '{{count}} напоминание', dueCount_few: '{{count}} напоминания', dueCount_many: '{{count}} напоминаний', dueCount_other: '{{count}} напоминания',
  },
  calls: {
    title: 'Звонки', description: 'Каждый разговор с клиентами зафиксирован', logCall: 'Записать звонок',
    today: 'Звонков сегодня', week: 'На этой неделе', connectRate: 'Дозвон', avgDuration: 'Средний разговор',
    talkTime: 'Время разговоров', last30: 'Последние 30 дней', allOutcomes: 'Все результаты', allDirections: 'Все направления',
    empty: 'Звонков пока нет', emptyDesc: 'Позвоните контакту и запишите, о чём говорили.',
    dialogTitle: 'Звонок: {{name}}', dialogTitleBlank: 'Записать звонок', dial: 'Набрать', start: 'Начать звонок', end: 'Завершить',
    live: 'Идёт звонок', ready: 'Готово к звонку', direction: 'Направление', outcome: 'Результат', contact: 'Контакт', noPhone: 'Нет номера телефона',
    discussed: 'О чём говорили', discussedPlaceholder: 'Ключевые моменты, возражения, решения, кто участвовал…',
    nextSteps: 'Следующие шаги', nextStepsPlaceholder: 'напр.: Отправить обновлённое КП до пятницы',
    followUp: 'Запланировать следующий шаг', followUpSubject: 'Задача', followUpDefault: 'Связаться с {{name}}',
    followUpDue: 'Срок', save: 'Сохранить звонок', saved: 'Звонок записан', subject: 'Звонок с {{name}}', duration: 'Длительность',
  },
}
