import type { Locale } from '../../types'
import type { admin as en } from '../en/admin'

export const admin: Locale<typeof en> = {
  admin: {
    nav: 'Admin panel', title: 'Platforma boshqaruvi', description: 'Butun CRM boʻyicha kompaniyalar, foydalanuvchilar va kirish huquqlari.',
    companies: 'Kompaniyalar', users: 'Foydalanuvchilar', newCompany: 'Yangi kompaniya', newUser: 'Yangi foydalanuvchi', search: 'Ism yoki email boʻyicha qidirish',
    companyName: 'Kompaniya nomi', owner: 'Egasi', ownerName: 'Egasining toʻliq ismi', members_one: '{{count}} ta aʼzo', members_other: '{{count}} ta aʼzo',
    created: 'Yaratilgan', rename: 'Nomini oʻzgartirish', renamed: 'Kompaniya nomi oʻzgartirildi', companyCreated: 'Kompaniya yaratildi',
    noCompany: 'Kompaniyasiz (faqat platforma)', company: 'Kompaniya', userCreated: 'Foydalanuvchi yaratildi', active: 'Faol', inactive: 'Faolsizlantirilgan',
    superadmin: 'Superadmin', activate: 'Faollashtirish', deactivate: 'Faolsizlantirish', makeSuperadmin: 'Superadmin qilish', removeSuperadmin: 'Superadminlikni olish',
    updated: 'Foydalanuvchi yangilandi', addToCompany: 'Kompaniyaga qoʻshish', removeFromCompany: '{{company}} dan chiqarish', membershipAdded: 'Kompaniyaga qoʻshildi',
    membershipRemoved: 'Kompaniyadan chiqarildi', emptyUsers: 'Hozircha foydalanuvchi yoʻq', emptyCompanies: 'Hozircha kompaniya yoʻq', actions: 'Amallar', status: 'Holat',
    noWorkspaceTitle: 'Siz platforma superadmini sifatida kirdingiz', noWorkspaceDesc: 'CRMʼda ishlashni boshlash uchun admin panelda kompaniya yarating.',
  },
  gate: {
    title: 'Oʻz parolingizni oʻrnating', subtitle: 'Administrator sizga vaqtinchalik parol bergan. Davom etish uchun yangi parol tanlang.',
    save: 'Saqlash va davom etish', done: 'Parol saqlandi — xush kelibsiz!',
  },
  login: { askAdmin: 'Login yoʻqmi? Administratoringizga murojaat qiling.' },
}
