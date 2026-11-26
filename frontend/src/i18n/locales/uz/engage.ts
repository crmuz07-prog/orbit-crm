import type { Locale } from '../../types'
import type { engage as en } from '../en/engage'

export const engage: Locale<typeof en> = {
  activities: {
    deleteTitle: 'Bu faoliyat oʻchirilsinmi?', title: 'Vazifalar', description: 'Muddati boʻyicha qoʻngʻiroqlar, uchrashuvlar va ishlar', newActivity: 'Yangi vazifa',
    overdue: 'Muddati oʻtgan', today: 'Bugun', upcoming: 'Kelgusi', done: 'Bajarilgan', all: 'Barchasi', allTypes: 'Barcha turlar',
    emptyOverdue: 'Muddati oʻtgan narsa yoʻq 🎉', empty: 'Bu yerda hech narsa yoʻq', emptyDesc: 'Bitimlar sovib qolmasligi uchun keyingi qadamlarni rejalashtiring.',
    type: 'Turi', due: 'Muddat', when: 'Qachon', subject: 'Mavzu', subjectRequired: 'Mavzu *', details: 'Tafsilotlar',
    deal: 'Bitim', company: 'Kompaniya', contact: 'Kontakt', remind: 'Eslatish', subjectPlaceholder: 'Taklif boʻyicha qayta bogʻlanish',
    timeline: 'Faoliyat', upcomingCount: 'Kelgusi · {{count}}', history: 'Tarix', pinned: 'Qadalgan',
    timelineEmpty: 'Hozircha faoliyat yoʻq', timelineEmptyDesc: 'Tarixni boshlash uchun qoʻngʻiroq, email yoki eslatma qoʻshing.',
    markDone: 'Bajarildi deb belgilash', markedDone: 'Bajarildi', deleted: 'Faoliyat oʻchirildi', pin: 'Qadash', unpin: 'Qadashni olish',
    logged: '{{type}} qayd etildi',
    placeholder: {
      note: 'Eslatma yozing… (faqat jamoangiz koʻradi)', call: 'Qoʻngʻiroq natijasi, keyingi qadamlar…', email: 'Email qisqacha mazmuni…',
      meeting: 'Kun tartibi yoki uchrashuv qaydlari…', task: 'Vazifa tafsilotlari…',
    },
    submit: { note: 'Eslatmani saqlash', call: 'Qoʻngʻiroqni qayd etish', email: 'Emailni qayd etish', meeting: 'Uchrashuvni qayd etish', task: 'Vazifa yaratish' },
  },
  reminder: {
    openRecord: 'Ochish',
    none: 'Eslatmasiz', atTime: 'Muddat vaqtida', min15: '15 daqiqa oldin', hour1: '1 soat oldin', day1: '1 kun oldin',
    title: 'Eslatmalar', empty: 'Eslatma yoʻq', emptyDesc: 'Vazifa va keyingi qadamlar eslatmalari shu yerda chiqadi.',
    due: 'Hozir', upcoming: 'Kelgusi', snooze: 'Kechiktirish', snooze10: '10 daqiqa', snooze60: '1 soat',
    tomorrow: 'Ertaga 9:00', done: 'Bajarildi', snoozed: '{{time}} gacha kechiktirildi', toast: 'Eslatma',
    enableNotifications: 'Brauzer bildirishnomalarini yoqish', open: 'Eslatmalarni ochish',
    dueCount_one: '{{count}} ta eslatma vaqti keldi', dueCount_other: '{{count}} ta eslatma vaqti keldi',
  },
  calls: {
    title: 'Qoʻngʻiroqlar', description: 'Mijozlar bilan har bir suhbat qayd etilgan', logCall: 'Qoʻngʻiroqni qayd etish',
    today: 'Bugungi qoʻngʻiroqlar', week: 'Shu hafta', connectRate: 'Ulanish darajasi', avgDuration: 'Oʻrtacha suhbat',
    talkTime: 'Suhbat vaqti', last30: 'Oxirgi 30 kun', allOutcomes: 'Barcha natijalar', allDirections: 'Barcha yoʻnalishlar',
    empty: 'Hozircha qoʻngʻiroq qayd etilmagan', emptyDesc: 'Kontaktga qoʻngʻiroq qiling va nimalar gaplashilganini yozing.',
    dialogTitle: '{{name}} ga qoʻngʻiroq', dialogTitleBlank: 'Qoʻngʻiroqni qayd etish', dial: 'Terish', start: 'Qoʻngʻiroqni boshlash', end: 'Tugatish',
    live: 'Suhbatda', ready: 'Tayyor', direction: 'Yoʻnalish', outcome: 'Natija', contact: 'Kontakt', noPhone: 'Telefon raqami yoʻq',
    discussed: 'Nimalar gaplashildi', discussedPlaceholder: 'Asosiy fikrlar, eʼtirozlar, qarorlar, kimlar qatnashdi…',
    nextSteps: 'Keyingi qadamlar', nextStepsPlaceholder: 'masalan: Juma kuni yangilangan taklifni yuborish',
    followUp: 'Keyingi qadamni rejalashtirish', followUpSubject: 'Keyingi vazifa', followUpDefault: '{{name}} bilan qayta bogʻlanish',
    followUpDue: 'Muddat', save: 'Qoʻngʻiroqni saqlash', saved: 'Qoʻngʻiroq qayd etildi', subject: '{{name}} bilan qoʻngʻiroq', duration: 'Davomiylik',
  },
}
