import type { Locale } from '../../types'
import type { core as en } from '../en/core'

export const core: Locale<typeof en> = {
  common: {
    som: 'soʻm', save: 'Saqlash', cancel: 'Bekor qilish', delete: 'Oʻchirish', edit: 'Tahrirlash', add: 'Qoʻshish', back: 'Orqaga', reset: 'Tiklash',
    saveChanges: 'Oʻzgarishlarni saqlash', pleaseWait: 'Kuting…', deleted: 'Oʻchirildi', viewAll: 'Barchasi', none: '—',
    noResults: 'Hech narsa topilmadi.', cannotUndo: 'Bu amalni qaytarib boʻlmaydi.', notFound: '{{label}} topilmadi',
    notFoundDesc: 'Ehtimol, u oʻchirilgan.', created: '{{entity}} yaratildi', updated: '{{entity}} yangilandi',
    today: 'Bugun, {{time}}', tomorrow: 'Ertaga, {{time}}', yesterday: 'Kecha, {{time}}', overdue: 'Muddati oʻtgan',
  },
  entity: { deal: 'Bitim', company: 'Kompaniya', contact: 'Kontakt', activity: 'Faoliyat', call: 'Qoʻngʻiroq' },
  dialog: {
    new: { deal: 'Yangi bitim', company: 'Yangi kompaniya', contact: 'Yangi kontakt', activity: 'Yangi faoliyat', call: 'Qoʻngʻiroqni qayd etish', wrapUp: 'Qoʻngʻiroq xulosasi' },
    edit: { deal: 'Bitimni tahrirlash', company: 'Kompaniyani tahrirlash', contact: 'Kontaktni tahrirlash', activity: 'Faoliyatni tahrirlash', call: 'Qoʻngʻiroqni tahrirlash', wrapUp: 'Qoʻngʻiroq xulosasi' },
  },
  nav: {
    workspace: 'Ish maydoni', dashboard: 'Boshqaruv paneli', deals: 'Bitimlar', companies: 'Kompaniyalar', contacts: 'Kontaktlar',
    activities: 'Faoliyatlar', calls: 'Qoʻngʻiroqlar', settings: 'Sozlamalar', signOut: 'Chiqish', openMenu: 'Menyuni ochish',
    search: 'Qidirish yoki oʻtish…', lightMode: 'Yorugʻ rejim', darkMode: 'Qorongʻi rejim', language: 'Til',
    create: 'Yaratish', new: 'Yangi', demoBanner: 'Siz demo ish maydonidasiz — oʻzgarishlar umumiy, ularni Sozlamalarda tiklash mumkin.',
  },
  palette: {
    placeholder: 'Bitim, kompaniya, kontakt qidiring yoki buyruq yozing…', create: 'Yaratish', goTo: 'Oʻtish',
    deals: 'Bitimlar', companies: 'Kompaniyalar', contacts: 'Kontaktlar', logCall: 'Qoʻngʻiroqni qayd etish',
    navigate: '↑↓ tanlash', open: '↵ ochish', close: 'esc yopish',
  },
  enums: {
    lifecycle: { lead: 'Lid', prospect: 'Potensial mijoz', customer: 'Mijoz', churned: 'Ketgan' },
    priority: { low: 'Past', medium: 'Oʻrta', high: 'Yuqori' },
    priorityFilter: '{{label}} muhimlik',
    activity: { note: 'Eslatma', call: 'Qoʻngʻiroq', email: 'Email', meeting: 'Uchrashuv', task: 'Vazifa', message: 'Xabar' },
    status: { open: 'Ochiq', won: 'Yutilgan', lost: 'Yutqazilgan' },
    outcome: { connected: 'Gaplashildi', no_answer: 'Javob yoʻq', voicemail: 'Ovozli xabar', busy: 'Band', wrong_number: 'Notoʻgʻri raqam' },
    direction: { outbound: 'Chiquvchi', inbound: 'Kiruvchi' },
    lostReason: {
      price: 'Narx juda baland', competitor: 'Raqobatchini tanladi', budget: 'Byudjet yoʻq',
      stalled: 'Qaror qabul qilinmadi', features: 'Funksiyalar yetishmaydi', timing: 'Vaqt notoʻgʻri',
    },
  },
  validation: {
    rules: { required: 'Bu maydonni toʻldiring', email: 'Toʻgʻri email kiriting, masalan name@kompaniya.uz', too_short: 'Kamida {{min}} ta belgi', too_long: 'Koʻpi bilan {{max}} ta belgi', mismatch: 'Parollar mos kelmadi', invalid: 'Qiymatni tekshiring', wrong_password: 'Joriy parol notoʻgʻri', range: '{{min}} dan {{max}} gacha butun son kiriting', min_value: 'Kamida {{min}} boʻlgan butun son kiriting' },
    dealName: 'Bitim nomi majburiy', stage: 'Pipeline bosqichini tanlang', companyName: 'Kompaniya nomi majburiy',
    firstName: 'Ism majburiy', email: 'Email notoʻgʻri koʻrinadi', subject: 'Mavzu majburiy', writeSomething: 'Avval biror narsa yozing',
  },
  errors: {
    validation_error: 'Belgilangan maydonlarni tekshiring', signedOut: 'Tizimdan chiqildi', messaging_window_closed: 'Instagram mijozning oxirgi xabaridan keyin faqat 24 soat ichida javob berishga ruxsat beradi', instagram_not_connected: 'Avval Sozlamalarda Instagramʼni ulang', not_instagram_contact: 'Bu kontakt Instagramʼdan kelmagan', instagram_send_failed: 'Instagram xabarni qabul qilmadi', invalid_verify_token: 'Verify token mos kelmadi',
    pipeline_has_deals: 'Avval bitimlarni bu voronkadan koʻchiring', default_pipeline: 'Asosiy voronkani oʻchirib boʻlmaydi',
    subscription_expired: 'Kompaniya obunasi muddati tugagan', company_blocked: 'Kompaniya platforma administratori tomonidan bloklangan', seat_limit_reached: 'Barcha toʻlangan oʻrinlar band — qoʻshimcha oʻrin uchun platforma administratoriga murojaat qiling',
    permission_denied: 'Bu amal uchun huquqingiz yoʻq', owner_out_of_scope: 'Yozuvni bu xodimga biriktira olmaysiz', session_revoked: 'Sessiya yakunlandi — qaytadan kiring', too_many_attempts: 'Juda koʻp xato urinish. 15 daqiqadan soʻng qayta urining', default_role: 'Standart rolni oʻchirib boʻlmaydi', name_taken: 'Bu nom allaqachon band',
    registration_disabled: 'Akkauntlarni administrator yaratadi', account_disabled: 'Bu akkaunt faolsizlantirilgan — administratorga murojaat qiling', self_lockout: 'Oʻzingizni faolsizlantira yoki huquqingizni tushira olmaysiz',
    forbidden: 'Bu amal uchun ruxsatingiz yoʻq', invalid_token: 'Havola notoʻgʻri yoki muddati oʻtgan', invite_email_mismatch: 'Bu taklif boshqa emailga yuborilgan', last_owner: 'Ish maydonida kamida bitta egasi boʻlishi kerak', demo_read_only: 'Demoda buni oʻzgartirib boʻlmaydi', already_member: 'Bu kishi allaqachon ish maydonida', wrong_password: 'Joriy parol notoʻgʻri',
    generic: 'Nimadir xato ketdi', not_found: 'Yozuv topilmadi', stage_has_deals: 'Oʻchirishdan oldin bu bosqichdagi bitimlarni koʻchiring',
    email_taken: 'Bu email bilan akkaunt allaqachon mavjud', invalid_credentials: 'Email yoki parol notoʻgʻri', invalid_signature: 'Webhook imzosi notoʻgʻri', invalid_payload: 'Qoʻngʻiroq hodisasi notoʻgʻri',
    no_workspace: 'Akkauntingizda ish maydoni yoʻq', demo_disabled: 'Demo oʻchirilgan', not_authenticated: 'Iltimos, qayta kiring',
    reset_demo_only: 'Faqat demo ish maydonini tiklash mumkin', network: 'Serverga ulanib boʻlmadi',
  },
  settings: {
    title: 'Sozlamalar', description: 'Ish maydoni, pipeline va afzalliklar', profile: 'Profil',
    pipeline: 'Savdo pipeline', pipelineDesc: 'Bosqichlar va yutish ehtimoli vaznli prognozni belgilaydi.', addStage: 'Bosqich qoʻshish',
    newStage: 'Yangi bosqich', stageSaved: 'Bosqich saqlandi', dealCount_one: '{{count}} ta bitim', dealCount_other: '{{count}} ta bitim',
    wonStage: 'Yutish bosqichi', lostStage: 'Yutqazish bosqichi', moveUp: 'Yuqoriga', moveDown: 'Pastga', deleteStage: 'Bosqichni oʻchirish',
    appearance: 'Koʻrinish', theme: 'Mavzu', light: 'Yorugʻ', dark: 'Qorongʻi', language: 'Til', data: 'Maʼlumotlar',
    sampleTitle: 'Namuna maʼlumot yuklash', sampleDesc: '15 ta xalqaro kompaniya, kontaktlar, bitimlar, qoʻngʻiroqlar va faoliyatlar qoʻshadi.',
    sampleDone: 'Namuna maʼlumot yuklandi', resetTitle: 'Demo ish maydonini tiklash', resetDesc: 'Demodagi hamma narsani oʻchiradi va namuna maʼlumotni qaytaradi.',
    resetConfirm: 'Demo ish maydoni tiklansinmi?', resetConfirmDesc: 'Demo ish maydonidagi barcha oʻzgarishlar yoʻqoladi.', resetDone: 'Demo ish maydoni tiklandi',
  },
  auth: {
    waking: 'Server ishga tushmoqda… bepul hostingda bu bir daqiqagacha choʻzilishi mumkin.',
    welcome: 'Xush kelibsiz', create: 'Ish maydoningizni yarating', signInSub: 'Savdo ish maydoningizga kiring.',
    signUpSub: 'B2B pipelineʼingizni bir necha daqiqada boshqarishni boshlang.', demo: 'Demo ish maydonini koʻrish', or: 'yoki',
    fullName: 'Toʻliq ism', email: 'Ish emaili', password: 'Parol', signIn: 'Kirish', signUp: 'Akkaunt yaratish',
    newHere: 'Orbitda yangimisiz?', createAccount: 'Akkaunt yarating', haveAccount: 'Akkauntingiz bormi?',
    tagline: 'Bitim yopadigan B2B jamoalar uchun CRM.',
    f1: 'Vizual pipeline', f1Text: 'Bitimlarni bosqichlar boʻylab suring va toʻxtab qolganlarini darhol koʻring.',
    f2: 'Har bir qoʻngʻiroq qayd etiladi', f2Text: 'Qoʻngʻiroqlar, nimalar gaplashilgani va eslatmali keyingi qadamlar.',
    f3: 'Xavfsizlik standart', f3Text: 'Har bir ish maydoni API darajasida ajratilgan.',
  },
}
