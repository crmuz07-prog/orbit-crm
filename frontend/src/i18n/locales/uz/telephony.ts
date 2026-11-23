import type { Locale } from '../../types'
import type { telephony as en } from '../en/telephony'

export const telephony: Locale<typeof en> = {
  telephony: {
    title: 'Telefoniya', description: 'PBX / VoIP raqamingiz orqali boʻlgan qoʻngʻiroqlar avtomatik yozib olinadi.',
    howTitle: 'Avtomatik yozib olish qanday ishlaydi',
    how1: 'Bulutli PBX’ingizni (OnlinePBX, Zadarma, UTEL, Sipuni, Asterisk, Twilio…) ulang va pastdagi webhook URL’ni kiriting.',
    how2: 'Har bir qoʻngʻiroqda PBX Orbit’ga xabar beradi: raqam kontaktga bogʻlanadi, bitim ulanadi va qoʻngʻiroq saqlanadi.',
    how3: 'Qoʻngʻiroq paytida oyna chiqadi; tugagach nimalar gaplashilganini yozasiz. Javobsiz qoʻngʻiroqlar qayta qoʻngʻiroq vazifasiga aylanadi.',
    webhookUrl: 'Webhook URL', secret: 'Imzo kaliti', signatureHint: 'Sarlavha yuboring: X-Orbit-Signature: sha256=HMAC(body, secret)',
    copy: 'Nusxalash', copied: 'Nusxalandi', reveal: 'Koʻrsatish', hide: 'Yashirish', rotate: 'Qayta yaratish', rotated: 'Yangi URL va kalit yaratildi',
    rotateConfirm: 'Webhook maʼlumotlari qayta yaratilsinmi?', rotateConfirmDesc: 'Eski URL darhol ishlamay qoladi — uni PBX’da yangilang.',
    payload: 'Hodisa maʼlumoti', createUnknown: 'Notanish raqamlar uchun kontakt yaratish', callbackTask: 'Javobsiz qoʻngʻiroqlar uchun qayta qoʻngʻiroq vazifasi',
    simulator: 'Qoʻngʻiroq simulyatori', simulatorDesc: 'PBX’siz butun jarayonni sinab koʻring.', phone: 'Telefon raqami', pickContact: 'Kontakt',
    startCall: 'Qoʻngʻiroqni simulyatsiya qilish', endCall: 'Tugatish', status: 'Natija',
    incoming: 'Kiruvchi qoʻngʻiroq', outgoing: 'Chiquvchi qoʻngʻiroq', ringing: 'Jiringlayapti…', onCall: 'Suhbatda', ended: 'Qoʻngʻiroq tugadi',
    openRecord: 'Ochish', dismiss: 'Yopish', wrapUp: 'Nimalar gaplashilganini yozish', missedTask: 'Javobsiz — qayta qoʻngʻiroq vazifasi yaratildi',
    unknown: 'Notanish raqam', auto: 'Avto', recording: 'Yozuv', needsSummary: 'Xulosa yozish', wrapUpTitle: 'Qoʻngʻiroq xulosasi',
    wrapUpSaved: 'Qoʻngʻiroq xulosasi saqlandi', live: 'Jonli',
  },
}
