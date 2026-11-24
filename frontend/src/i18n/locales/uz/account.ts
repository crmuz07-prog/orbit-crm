import type { Locale } from '../../types'
import type { account as en } from '../en/account'

export const account: Locale<typeof en> = {
  roles: { owner: 'Egasi', admin: 'Administrator', member: 'Aʼzo' },
  account: {
    forgot: 'Parolni unutdingizmi?', forgotTitle: 'Parolni tiklash', forgotSub: 'Ish emailingizni kiriting — parolni tiklash havolasini yuboramiz.',
    sendLink: 'Havolani yuborish', sentTitle: 'Pochtangizni tekshiring', backToSignIn: 'Kirish sahifasiga qaytish',
    sentSub: '{{email}} uchun akkaunt boʻlsa, havola yuborildi. Xat kelmadimi? Ish maydoni administratoridan tiklash havolasini soʻrang.',
    resetTitle: 'Yangi parol oʻrnatish', newPassword: 'Yangi parol', confirmPassword: 'Parolni takrorlang', mismatch: 'Parollar mos kelmadi',
    savePassword: 'Parolni saqlash', resetDone: 'Parol yangilandi — siz tizimga kirdingiz',
    verifyTitle: 'Email tasdiqlanmoqda…', verified: 'Email tasdiqlandi', verifiedSub: 'Rahmat! Email manzilingiz tasdiqlandi.',
    verifyFailed: 'Havola notoʻgʻri yoki muddati oʻtgan', openApp: 'Orbitni ochish',
    banner: 'Iltimos, email manzilingizni tasdiqlang — {{email}} ga havola yubordik.', resend: 'Qayta yuborish', resent: 'Tasdiqlash xati yuborildi',
    profile: 'Profil', name: 'Toʻliq ism', saveProfile: 'Saqlash', profileSaved: 'Profil yangilandi', security: 'Parol',
    currentPassword: 'Joriy parol', changePassword: 'Parolni oʻzgartirish', passwordChanged: 'Parol oʻzgartirildi', setFirstPassword: 'Parol oʻrnatish',
    workspaces: 'Ish maydonlari', switched: '{{workspace}} ga oʻtildi',
  },
  team: {
    title: 'Jamoa', description: 'Hamkasblarga login bering va ularning huquqlarini boshqaring.', member: 'Aʼzo', role: 'Rol',
    addUser: 'Foydalanuvchi qoʻshish', added: 'Foydalanuvchi qoʻshildi', fullName: 'Toʻliq ism', email: 'Login (email)', tempPassword: 'Vaqtinchalik parol',
    generate: 'Yaratish', credentials: 'Topshiriladigan kirish maʼlumotlari', credentialsHint: 'Birinchi kirishda u oʻz parolini oʻrnatishi soʻraladi.',
    you: 'siz', temporary: 'vaqtinchalik parol', inactive: 'faolsizlantirilgan', remove: 'Ish maydonidan chiqarish', removeConfirm: '{{name}} chiqarilsinmi?',
    removeConfirmDesc: 'U bu ish maydoniga kirish huquqini darhol yoʻqotadi.', removed: 'Aʼzo chiqarildi', roleChanged: 'Rol yangilandi',
    setPassword: 'Parol oʻrnatish', setPasswordHint: '{{name}} uchun vaqtinchalik parol bering; keyingi kirishda u parolni almashtiradi.',
    passwordSet: 'Parol yangilandi', readOnly: 'Jamoani faqat egalar va administratorlar boshqaradi.', demoReadOnly: 'Demo ish maydonida jamoani boshqarish oʻchirilgan.',
  },
}
