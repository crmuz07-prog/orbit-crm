import type { Locale } from '../../types'
import type { instagram as en } from '../en/instagram'

export const instagram: Locale<typeof en> = {
  instagram: {
    nav: 'Instagram', title: 'Instagram lidlari', description: 'Instagram akkauntingizdagi Direct yozishmalar va reklama lid-formalari.',
    leads: 'Lidlar', messages: 'Direct yozishmalar', leadForms: 'Lid-formalar', won: 'Yutilgan', conversion: 'Konversiya',
    avgResponse: 'Oʻrtacha birinchi javob', unanswered: 'Javob kutmoqda', perDay: 'Kunlik lidlar', perDayDesc: 'Yangi yozishmalar va lid-formalar',
    topAds: 'Eng yaxshi reklamalar', topAdsDesc: 'Eng koʻp lid keltirgan reklamalar', ad: 'Reklama', noAds: 'Bu davrda reklama lidlari yoʻq',
    latest: 'Soʻnggi lidlar', latestDesc: 'Eng yangi Instagram bitimlari', empty: 'Hozircha Instagram lidlari yoʻq',
    emptyDesc: 'Sozlamalarda Instagramʼni ulang yoki lidlar qanday kelishini koʻrish uchun sinov xabarini yuboring.', openSettings: 'Instagram sozlamalari',
    simulateMessage: 'Sinov xabari', simulateLead: 'Sinov lid-formasi', simulated: 'Sinov lidi qabul qilindi',
    kind: { message: 'Direct', lead_form: 'Lid-forma' },
  },
  igSettings: {
    title: 'Instagram', description: 'Direct xabarlar va reklama lid-formalari Meta Graph API orqali CRMʼga avtomatik tushadi.',
    callbackUrl: 'Callback URL', verifyToken: 'Verify token', appSecret: 'App secret', accessToken: 'Sahifa access tokeni',
    accountId: 'Instagram akkaunt ID', stage: 'Yangi lidlar tushadigan bosqich', owner: 'Yangi lidlar masʼuli', saved: 'Instagram sozlamalari saqlandi',
    secretSet: 'Saqlangan — almashtirish uchun yangi qiymat kiriting', connected: 'Ulangan', notConnected: 'Ulanmagan', lastEvent: 'Oxirgi voqea {{time}}',
    steps: 'Qanday ulanadi', step1: 'Instagramʼni Business akkauntga oʻtkazing va Facebook sahifasiga ulang.',
    step2: 'developers.facebook.com saytida ilova oching, Webhooks va Instagram / Messenger mahsulotlarini qoʻshing.',
    step3: 'Webhook sozlamalariga callback URL va verify tokenni kiriting; messages va leadgen hodisalariga obuna boʻling.',
    step4: 'App secret va sahifa access tokenini shu yerga kiriting. Oʻz akkauntingiz uchun Development rejimi App Reviewʼsiz ishlaydi.',
    rotate: 'Tokenlarni yangilash', rotated: 'Yangi callback URL va verify token berildi',
    rotateConfirm: 'Yangi callback URL berilsinmi?', rotateDesc: 'Eski manzil ishlamay qoladi; uni Meta ilovasida yangilang.',
  },
  igReply: {
    placeholder: 'Instagram Directʼda javob yozing…', send: 'Yuborish', sent: 'Instagramʼga yuborildi',
    window: 'Mijozning oxirgi xabaridan keyin 24 soat ichida javob yozish mumkin.', you: 'Siz',
  },
}
