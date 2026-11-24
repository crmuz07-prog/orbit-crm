import type { Locale } from '../../types'
import type { access as en } from '../en/access'

export const access: Locale<typeof en> = {
  access: {
    title: 'Rollar va huquqlar', description: 'Aʼzolar nimani koʻrishi va qila olishi. Egalar va administratorlarda doim toʻliq huquq bor.',
    newRole: 'Yangi rol', editRole: 'Rolni tahrirlash', roleName: 'Rol nomi', default: 'Standart', makeDefault: 'Standart qilish',
    members_one: '{{count}} ta aʼzo', members_other: '{{count}} ta aʼzo', saved: 'Rol saqlandi', created: 'Rol yaratildi', deleted: 'Rol oʻchirildi',
    deleteConfirm: '“{{name}}” roli oʻchirilsinmi?', deleteDesc: 'Uning aʼzolari standart rolga oʻtadi.', module: 'Boʻlim', scope: 'Yozuvlar',
    accessRole: 'Kirish roli', fullAccess: 'Toʻliq huquq', noTeam: 'Jamoasiz', team: 'Savdo jamoasi',
    modules: { companies: 'Kompaniyalar', contacts: 'Kontaktlar', deals: 'Bitimlar', activities: 'Faoliyat va qoʻngʻiroqlar', reports: 'Hisobotlar va dashboard' },
    actions: { view: 'Koʻrish', create: 'Qoʻshish', edit: 'Tahrirlash', delete: 'Oʻchirish', export: 'Eksport' },
    scopes: { own: 'Oʻziniki', team: 'Jamoasiniki', all: 'Hammasi' },
    scopeHint: 'Oʻziniki — oʻziga tegishli yozuvlar · Jamoasiniki — savdo jamoasi va egasiz yozuvlar · Hammasi — butun ish maydoni.',
  },
  teams: {
    title: 'Savdo jamoalari', description: 'Jamoa rahbarlari oʻz jamoasining voronkasini koʻrishi uchun sotuvchilarni guruhlang.', name: 'Jamoa nomi', add: 'Jamoa qoʻshish',
    created: 'Jamoa yaratildi', renamed: 'Jamoa nomi oʻzgartirildi', deleted: 'Jamoa oʻchirildi', deleteConfirm: '“{{name}}” jamoasi oʻchirilsinmi?',
    deleteDesc: 'Aʼzolar ish maydonida jamoasiz qoladi.', empty: 'Hozircha jamoa yoʻq',
  },
  owner: { label: 'Masʼul', unassigned: 'Biriktirilmagan', me: 'Men' },
  settingsTabs: { account: 'Hisob', team: 'Jamoa va huquqlar', workspace: 'Ish maydoni' },
  noAccess: { title: 'Bu boʻlimga kirish huquqi yoʻq', desc: 'Kirish rolingizni oʻzgartirish uchun administratorga murojaat qiling.' },
  exportCsv: 'CSV eksport', exported: 'Eksport yuklab olindi',
  security: { tab: 'Xavfsizlik', title: 'Kirish urinishlari', email: 'Login', ip: 'IP manzil', result: 'Natija', time: 'Vaqt', success: 'Muvaffaqiyatli', failed: 'Xato', empty: 'Hozircha kirish urinishlari yoʻq' },
}
