import type { Locale } from '../../types'
import type { instagram as en } from '../en/instagram'

export const instagram: Locale<typeof en> = {
  instagram: {
    nav: 'Instagram', title: 'Лиды из Instagram', description: 'Переписки в Direct и лид-формы рекламы из вашего Instagram.',
    leads: 'Лиды', messages: 'Переписки в Direct', leadForms: 'Лид-формы', won: 'Выиграно', conversion: 'Конверсия',
    avgResponse: 'Среднее время первого ответа', unanswered: 'Ждут ответа', perDay: 'Лиды по дням', perDayDesc: 'Новые переписки и лид-формы',
    topAds: 'Лучшие объявления', topAdsDesc: 'Объявления, которые принесли больше всего лидов', ad: 'Объявление', noAds: 'За период лидов из рекламы нет',
    latest: 'Последние лиды', latestDesc: 'Новые сделки из Instagram', empty: 'Лидов из Instagram пока нет',
    emptyDesc: 'Подключите Instagram в настройках или отправьте тестовое сообщение, чтобы увидеть, как приходят лиды.', openSettings: 'Настройки Instagram',
    simulateMessage: 'Тестовое сообщение', simulateLead: 'Тестовая лид-форма', simulated: 'Тестовый лид получен',
    kind: { message: 'Direct', lead_form: 'Лид-форма' },
  },
  igSettings: {
    title: 'Instagram', description: 'Сообщения Direct и лид-формы рекламы автоматически попадают в CRM через Meta Graph API.',
    callbackUrl: 'Callback URL', verifyToken: 'Verify token', appSecret: 'App secret', accessToken: 'Токен доступа страницы',
    accountId: 'ID аккаунта Instagram', stage: 'Этап для новых лидов', owner: 'Ответственный за новые лиды', saved: 'Настройки Instagram сохранены',
    secretSet: 'Сохранено — введите новое значение, чтобы заменить', connected: 'Подключено', notConnected: 'Не подключено', lastEvent: 'Последнее событие {{time}}',
    steps: 'Как подключить', step1: 'Переведите Instagram в бизнес-аккаунт и привяжите его к странице Facebook.',
    step2: 'Создайте приложение на developers.facebook.com и добавьте продукты Webhooks и Instagram / Messenger.',
    step3: 'Вставьте callback URL и verify token в настройки вебхука; подпишитесь на messages и leadgen.',
    step4: 'Скопируйте сюда app secret и токен доступа страницы. Для своего аккаунта режим Development работает без App Review.',
    rotate: 'Обновить токены', rotated: 'Выданы новый callback URL и verify token',
    rotateConfirm: 'Выдать новый callback URL?', rotateDesc: 'Старый адрес перестанет работать; обновите его в приложении Meta.',
  },
  igReply: {
    placeholder: 'Ответить в Instagram Direct…', send: 'Отправить', sent: 'Отправлено в Instagram',
    window: 'Ответить можно в течение 24 часов после последнего сообщения клиента.', you: 'Вы',
  },
}
