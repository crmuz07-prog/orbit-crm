import type { Locale } from '../../types'
import type { billing as en } from '../en/billing'

export const billing: Locale<typeof en> = {
  billing: {
    tab: 'Toʻlovlar', manage: 'Obuna', status: { active: 'Faol', expiring: 'Tugayapti', expired: 'Muddati tugagan', blocked: 'Bloklangan' },
    paidUntil: 'Toʻlangan muddat', noEnd: 'Muddatsiz', seats: 'Oʻrinlar', unlimited: 'Cheksiz', seatsUsed: '{{used}} / {{limit}}',
    recordPayment: 'Toʻlovni kiritish', amount: 'Summa (UZS)', months: 'Oylar', seatsField: 'Oʻrinlar (ixtiyoriy)', note: 'Izoh',
    newEnd: 'Bu toʻlovdan keyin muddat: {{date}}', paymentRecorded: 'Toʻlov kiritildi', saved: 'Obuna yangilandi',
    limits: 'Cheklovlar', seatLimit: 'Oʻrinlar soni', endDate: 'Tugash sanasi (shu kun ham kiradi)', block: 'Kompaniyani bloklash', unblock: 'Blokdan chiqarish',
    blockConfirm: '{{name}} bloklansinmi?', blockDesc: 'Blokdan chiqarilmaguncha barcha aʼzolar CRMʼga kira olmaydi.',
    history: 'Toʻlovlar tarixi', noPayments: 'Hozircha toʻlov yoʻq', total: 'Jami tushum', period: 'Davr', company: 'Kompaniya', date: 'Sana',
    daysLeft_one: '{{count}} kun qoldi', daysLeft_other: '{{count}} kun qoldi', emptyHint: 'Cheklovsiz boʻlsa boʻsh qoldiring',
    warning_one: 'Obunangiz {{count}} kundan soʻng ({{date}}) tugaydi. Uzaytirish uchun platforma administratoriga murojaat qiling.',
    warning_other: 'Obunangiz {{count}} kundan soʻng ({{date}}) tugaydi. Uzaytirish uchun platforma administratoriga murojaat qiling.',
    expiredTitle: 'Obuna muddati tugadi', expiredDesc: '{{name}} uchun kirish toʻxtatildi. Obunani uzaytirish uchun platforma administratoriga murojaat qiling.',
    blockedTitle: 'Kompaniya bloklangan', blockedDesc: 'Platforma administratori {{name}}ni blokladi. Iltimos, unga murojaat qiling.',
    teamSeats: 'Band oʻrinlar: {{used}} / {{limit}}',
  },
}
