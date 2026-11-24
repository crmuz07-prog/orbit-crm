export const process = {
  tasks: {
    none: 'Vazifa yoʻq', overdueSince: 'Kechikdi · {{when}}', filter: 'Barcha vazifalar', overdue: 'Muddati oʻtgan', today: 'Bugun', planned: 'Rejalashtirilgan',
    noTask: 'Vazifasiz', buckets: { overdue: 'Muddati oʻtgan', today: 'Bugun', tomorrow: 'Ertaga', week: 'Shu hafta', later: 'Keyinroq', undated: 'Sanasiz', done: 'Bajarilgan' },
  },
  leadSource: {
    title: 'Lid manbasi', platform: 'Platforma', campaign: 'Kampaniya', adset: 'Reklama guruhi', ad_name: 'Reklama', form_name: 'Forma', received: 'Kelgan sana: {{date}}',
    platforms: { instagram: 'Instagram', facebook: 'Facebook', messenger: 'Messenger', whatsapp: 'WhatsApp', audience_network: 'Audience Network', import: 'Import' },
  },
  customFields: {
    title: 'Bitim maydonlari', description: 'Har bir bitimdagi oʻz maydonlaringiz (amoCRM kabi): biznes turi, hajm, paket turi…',
    add: 'Maydon qoʻshish', label: 'Maydon nomi', type: 'Turi', options: 'Variantlar', optionsHint: 'Har qatorda bittadan', warn: 'Qizil bilan belgilash',
    warnHint: 'Eʼtibor talab qiladigan qiymatlar (masalan, minimal buyurtmadan kam)', empty: 'Hali qoʻshimcha maydon yoʻq', saved: 'Maydon saqlandi',
    deleted: 'Maydon oʻchirildi', deleteTitle: '«{{name}}» oʻchirilsinmi?', deleteDesc: 'Uning qiymatlari barcha bitimlardan oʻchadi.',
    types: { text: 'Matn', number: 'Raqam', select: 'Roʻyxat', multiselect: 'Koʻp tanlovli', date: 'Sana' },
  },
  lostReasons: {
    deleteTitle: 'Bu sabab oʻchirilsinmi?', title: 'Rad etish sabablari', description: 'Qatʼiy roʻyxat yutish/yutqazish hisobotini aniq qiladi.', add: 'Sabab qoʻshish', placeholder: 'masalan, Narx qimmat',
    empty: 'Oʻz sabablaringizni qoʻshmaguningizcha standart sabablar ishlatiladi', saved: 'Sabab qoʻshildi', deleted: 'Sabab oʻchirildi',
  },
  importer: {
    button: 'Import', title: 'Excel / CSV dan bitimlarni import qilish', pick: '.xlsx yoki .csv faylni tanlang', pickHint: 'Meta lid eksporti va oʻz jadvallaringiz. 5 MB gacha.',
    reading: 'Fayl oʻqilmoqda…', rows_one: '{{count}} qator', rows_other: '{{count}} qator', pipeline: 'Voronka', column: 'Ustun', sample: 'Namuna', target: 'Qayerga',
    newField: 'Yangi maydon', newFieldType: 'Turi', existingField: 'Maydon', run: '{{count}} qatorni import qilish', running: 'Import qilinmoqda…',
    doneTitle: 'Import tugadi', created: 'Yangi bitimlar', updated: 'Yangilandi', skipped: 'Oʻtkazib yuborildi (boʻsh yoki test)', tasks: 'Yaratilgan vazifalar',
    stagesCreated: 'Yangi bosqichlar', fieldsCreated: 'Yangi maydonlar', unmatched: 'Topilmagan menejerlar — ularni Sozlamalar → Jamoa boʻlimida qoʻshib, qayta import qiling (bitimlar dublikat boʻlmaydi, yangilanadi):',
    again: 'Boshqa fayl', close: 'Yopish', reimportHint: 'Shu faylni qayta import qilsangiz, bitimlar dublikat boʻlmaydi — yangilanadi.',
    targets: {
      ignore: 'Oʻtkazib yuborish', external_id: 'Lid ID', title: 'Bitim nomi', contact_name: 'Mijoz ismi', phone: 'Telefon', email: 'E-mail', created_at: 'Yaratilgan sana',
      stage: 'Bosqich', owner: 'Menejer', amount: 'Summa', source: 'Manba', lost_reason: 'Rad etish sababi', note: 'Izoh', next_contact: 'Keyingi aloqa (vazifa)',
      platform: 'Platforma', campaign: 'Kampaniya', adset: 'Reklama guruhi', ad_name: 'Reklama', form_name: 'Forma', custom: 'Mavjud maydon', new_custom: 'Yangi maydon',
    },
  },
  reports: {
    nav: 'Hisobotlar', title: 'Lidlar hisoboti', description: 'Tanlangan davr boʻyicha voronka, manbalar va menejerlar — jadvaldagi hisobot kabi, jonli.',
    from: 'Dan', to: 'Gacha', presets: { today: 'Bugun', week: '7 kun', month: '30 kun', quarter: '90 kun' },
    total: 'Lidlar', won: 'Sotuv', lost: 'Rad etildi', open: 'Jarayonda', conversion: 'Konversiya', warnings: 'Eʼtibor kerak', overdue: 'Muddati oʻtgan aloqalar',
    today: 'Bugungi aloqalar', noTask: 'Vazifasiz', funnel: 'Sotuv voronkasi', funnelDesc: 'Lidlar hozirgi bosqich boʻyicha', stage: 'Bosqich', count: 'Lidlar',
    share: 'Jamidan %', warnCol: 'Eʼtibor kerak', label: 'Qiymat', empty: 'Bu davrda lid yoʻq', emptyDesc: 'Boshqa davr yoki voronkani tanlang.',
    unset: 'Belgilanmagan', totalRow: 'Jami',
    groups: { owner: 'Menejerlar', platform: 'Platformalar', campaign: 'Reklama kampaniyalari', adset: 'Reklama guruhlari', ad_name: 'Reklamalar', source: 'Manbalar', lost_reason: 'Rad etish sabablari' },
  },
}
