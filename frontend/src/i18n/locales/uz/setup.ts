export const setup = {
  setup: {
    groups: { personal: 'Shaxsiy', team: 'Jamoa', sales: 'Savdo', integrations: 'Integratsiyalar', data: 'Maʼlumotlar' },
    nav: {
      profile: 'Profil', security: 'Parol', appearance: 'Koʻrinish', members: 'Foydalanuvchilar', roles: 'Rollar va huquqlar', teams: 'Savdo jamoalari',
      pipelines: 'Voronkalar va bosqichlar', fields: 'Bitim maydonlari', lostReasons: 'Rad etish sabablari', telephony: 'Telefoniya', instagram: 'Instagram', data: 'Import va eksport',
    },
    navLabel: 'Sozlamalar boʻlimlari',
    securityDesc: 'Parol oʻzgarsa, boshqa qurilmalardagi kirishlar yopiladi.',
    stageCols: { name: 'Bosqich', chance: 'Ehtimol', deals: 'Bitimlar' },
    openStages: 'Ish bosqichlari', closedStages: 'Yakuniy bosqichlar', closedHint: 'Bitimlar shu yerda yakunlanadi. Voronkada kamida bitta yutish va bitta yutqazish bosqichi qoladi.',
    color: 'Rang', rule: 'Kanbanda koʻrinadigan qoida', maxDays: 'Bosqichda maks. kun',
    stageDelete: {
      title: '“{{name}}” bosqichi oʻchirilsinmi?', empty: 'Unda bitim yoʻq. Bu amalni qaytarib boʻlmaydi.',
      hasDeals_one: 'Unda {{count}} ta bitim bor. Qaysi bosqichga oʻtkazishni tanlang — bitim tarixida koʻchirish saqlanadi.',
      hasDeals_other: 'Unda {{count}} ta bitim bor. Qaysi bosqichga oʻtkazishni tanlang — har bir bitim tarixida koʻchirish saqlanadi.',
      moveTo: 'Bitimlarni oʻtkazish', pick: 'Bosqichni tanlang', action: 'Oʻtkazish va oʻchirish', done: 'Bosqich oʻchirildi',
      last: 'Bu voronkadagi yagona {{kind}} — oʻchirishdan oldin yana bittasini qoʻshing.',
    },
    members: { fullAccess: 'Toʻliq huquq', add: 'Foydalanuvchi qoʻshish', addTitle: 'Yangi foydalanuvchi', addDesc: 'Login yarating va vaqtinchalik parolni bering; birinchi kirishda u parolni oʻzgartiradi.',
      role: 'Tizim roli', access: 'Huquqlar', team: 'Savdo jamoasi' },
    data: {
      importTitle: 'Excel’dan import', importDesc: 'Lidlar, kontaktlar va kompaniyalar .xlsx yoki .csv fayldan — saqlashdan oldin koʻrib chiqasiz.',
      exportTitle: 'CSV’ga eksport', exportDesc: 'Roʻyxatni boricha yuklab oling — Excel, buxgalteriya yoki zaxira uchun.',
      sampleHint: 'Faqat ish maydoni boʻsh boʻlganda chiqadi — haqiqiy maʼlumot namuna bilan aralashmaydi.',
    },
    simulator: 'PBX’siz sinab koʻrish',
  },
}
