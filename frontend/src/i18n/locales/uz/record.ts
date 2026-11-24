import type { Locale } from '../../types'
import type { record as en } from '../en/record'

export const record: Locale<typeof en> = {
  pipelines: {
    title: 'Voronkalar', description: 'Har bir voronkaning oʻz bosqichlari, qoidalari va muddatlari bor.', add: 'Voronka qoʻshish', name: 'Voronka nomi',
    newName: 'Yangi voronka', created: 'Voronka yaratildi', saved: 'Voronka saqlandi', deleted: 'Voronka oʻchirildi', default: 'Asosiy', makeDefault: 'Asosiy qilish',
    deleteConfirm: '“{{name}}” voronkasi oʻchirilsinmi?', deleteDesc: 'Uning bosqichlari ham oʻchadi. Bitimi bor voronkani oʻchirib boʻlmaydi.',
    select: 'Voronka', rule: 'Bosqich qoidasi', rulePlaceholder: 'masalan: 24 soatdan koʻp bu bosqichda turishi mumkin emas', maxDays: 'Maks. kun',
  },
  board: {
    header_one: '{{count}} ta bitim: {{sum}}', header_other: '{{count}} ta bitim: {{sum}}', quickAdd: 'Tezkor qoʻshish', quickTitle: 'Bitim nomi', quickAmount: 'Summa',
    inStage_one: 'Bosqichda {{count}} kun', inStage_other: 'Bosqichda {{count}} kun', report: 'Bitimlar harakati hisoboti',
  },
  report: {
    title: 'Bitimlar harakati', stage: 'Bosqich', now: 'Hozir', entered: 'Kirgan', avgTime: 'Bosqichda oʻrtacha vaqt',
    days_one: 'Soʻnggi {{count}} kun', days_other: 'Soʻnggi {{count}} kun',
  },
  feed: {
    today: 'Bugun', yesterday: 'Kecha', created: 'yozuvni yaratdi', createdIn: 'bitimni «{{stage}}» bosqichida yaratdi',
    set: '«{{field}}» maydoniga «{{value}}» qiymatini oʻrnatdi', cleared: '«{{field}}» maydonini tozaladi', moved: 'bitimni «{{from}}» bosqichidan «{{to}}» bosqichiga oʻtkazdi',
    system: 'Tizim', noTasks: 'Rejalashtirilgan vazifa yoʻq — tavsiya qilamiz:', addTask: 'qoʻshish', empty: 'Hozircha hech narsa yoʻq. Pastda izoh yozing yoki qoʻngʻiroqni kiriting.',
  },
  card: { main: 'Asosiy', stageTimes: 'Bosqichlardagi vaqt', saved: 'Saqlandi', edit: 'Tahrirlash uchun bosing', none: 'Kiritilmagan' },
  feedFields: {
    title: 'Nomi', amount: 'Byudjet', currency: 'Valyuta', company_id: 'Kompaniya', contact_id: 'Kontakt', owner_id: 'Masʼul', priority: 'Muhimlik',
    source: 'Manba', expected_close_date: 'Kutilgan yopilish', lost_reason: 'Yoʻqotish sababi', name: 'Nomi', domain: 'Sayt', industry: 'Soha',
    employees: 'Xodimlar', country: 'Mamlakat', city: 'Shahar', annual_revenue: 'Yillik daromad', lifecycle: 'Hayot bosqichi', description: 'Tavsif',
    first_name: 'Ism', last_name: 'Familiya', email: 'Email', phone: 'Telefon', title_job: 'Lavozim', linkedin_url: 'LinkedIn',
  },
  duration: { d: '{{count}} kun', h: '{{count}} soat', m: '{{count}} daq', lessThanMinute: '< 1 daq' },
}
