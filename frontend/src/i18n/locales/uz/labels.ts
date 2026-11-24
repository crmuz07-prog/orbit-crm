import type { Locale } from '../../types'
import type { labels as en } from '../en/labels'

export const labels: Locale<typeof en> = {
  defaults: {
    stage: { leadIn: 'Yangi lid', qualified: 'Saralangan', discovery: 'Tanishuv / Demo', proposal: 'Taklif', negotiation: 'Muzokara', won: 'Yutildi', lost: 'Yoʻqotildi' },
    pipeline: { sales: 'Savdo voronkasi' },
    role: { salesRep: 'Sotuvchi', teamLead: 'Jamoa rahbari', viewer: 'Kuzatuvchi' },
  },
  options: {
    source: { inbound: 'Kiruvchi murojaat', outbound: 'Faol sotuv', referral: 'Tavsiya', partner: 'Hamkor', event: 'Tadbir', website: 'Veb-sayt' },
    industry: {
      saas: 'SaaS', fintech: 'Fintex', logistics: 'Logistika', manufacturing: 'Ishlab chiqarish', healthcare: 'Tibbiyot', energy: 'Energetika',
      retail: 'Chakana savdo', telecom: 'Telekom', education: 'Taʼlim', aerospace: 'Aviakosmik', food: 'Oziq-ovqat va ichimliklar', mining: 'Konchilik',
      cybersecurity: 'Kiberxavfsizlik', other: 'Boshqa',
    },
  },
  examples: {
    companyName: 'Ipak Yoʻli MChJ', domain: 'ipakyoli.uz', country: 'Oʻzbekiston', city: 'Toshkent', jobTitle: 'Xaridlar boʻlimi boshligʻi',
    dealName: 'Ipak Yoʻli — yillik litsenziya', personName: 'Aziz Karimov', email: 'siz@kompaniya.uz',
  },
  misc: { autoCall: '{{direction}} qoʻngʻiroq · {{name}}', callBack: '{{phone}} ga qayta qoʻngʻiroq qilish', demo: 'Demo', close: 'Yopish' },
}
