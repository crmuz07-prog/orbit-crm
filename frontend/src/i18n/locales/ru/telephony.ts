import type { Locale } from '../../types'
import type { telephony as en } from '../en/telephony'

export const telephony: Locale<typeof en> = {
  telephony: {
    title: 'Телефония', description: 'Звонки через вашу АТС / VoIP-номер записываются автоматически.',
    howTitle: 'Как работает автоматическая запись',
    how1: 'Подключите облачную АТС (OnlinePBX, Zadarma, UTEL, Sipuni, Asterisk, Twilio…) и вставьте webhook URL ниже.',
    how2: 'При каждом звонке АТС уведомляет Orbit: номер сопоставляется с контактом, привязывается сделка, звонок сохраняется.',
    how3: 'Во время звонка появляется карточка; после — вы записываете, о чём говорили. Пропущенные звонки становятся задачами «перезвонить».',
    webhookUrl: 'Webhook URL', secret: 'Секрет подписи', signatureHint: 'Передавайте заголовок X-Orbit-Signature: sha256=HMAC(body, secret)',
    copy: 'Копировать', copied: 'Скопировано', reveal: 'Показать', hide: 'Скрыть', rotate: 'Перевыпустить', rotated: 'Созданы новый URL и секрет',
    rotateConfirm: 'Перевыпустить данные webhook?', rotateConfirmDesc: 'Старый URL сразу перестанет работать — обновите его в АТС.',
    payload: 'Формат события', createUnknown: 'Создавать контакт для неизвестных номеров', callbackTask: 'Создавать задачу «перезвонить» для пропущенных',
    simulator: 'Симулятор звонков', simulatorDesc: 'Проверьте весь процесс без АТС.', phone: 'Номер телефона', pickContact: 'Контакт',
    startCall: 'Симулировать звонок', endCall: 'Завершить', status: 'Результат',
    incoming: 'Входящий звонок', outgoing: 'Исходящий звонок', ringing: 'Звонит…', onCall: 'Идёт разговор', ended: 'Звонок завершён',
    openRecord: 'Открыть', dismiss: 'Закрыть', wrapUp: 'Записать, о чём говорили', missedTask: 'Пропущен — создана задача «перезвонить»',
    unknown: 'Неизвестный номер', auto: 'Авто', recording: 'Запись', needsSummary: 'Добавить итог', wrapUpTitle: 'Итоги звонка',
    wrapUpSaved: 'Итоги звонка сохранены', live: 'В эфире',
  },
}
