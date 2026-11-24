import type { Locale } from '../../types'
import type { admin as en } from '../en/admin'

export const admin: Locale<typeof en> = {
  admin: {
    nav: 'Админ-панель', title: 'Администрирование платформы', description: 'Компании, пользователи и доступы во всей CRM.',
    companies: 'Компании', users: 'Пользователи', newCompany: 'Новая компания', newUser: 'Новый пользователь', search: 'Поиск по имени или email',
    companyName: 'Название компании', owner: 'Владелец', ownerName: 'Полное имя владельца',
    members_one: '{{count}} участник', members_few: '{{count}} участника', members_many: '{{count}} участников', members_other: '{{count}} участника',
    created: 'Создана', rename: 'Переименовать', renamed: 'Компания переименована', companyCreated: 'Компания создана',
    noCompany: 'Без компании (только платформа)', company: 'Компания', userCreated: 'Пользователь создан', active: 'Активен', inactive: 'Отключён',
    superadmin: 'Суперадмин', activate: 'Включить', deactivate: 'Отключить', makeSuperadmin: 'Сделать суперадмином', removeSuperadmin: 'Снять права суперадмина',
    updated: 'Пользователь обновлён', addToCompany: 'Добавить в компанию', removeFromCompany: 'Удалить из {{company}}', membershipAdded: 'Добавлен в компанию',
    membershipRemoved: 'Удалён из компании', emptyUsers: 'Пользователей пока нет', emptyCompanies: 'Компаний пока нет', actions: 'Действия', status: 'Статус',
    noWorkspaceTitle: 'Вы вошли как суперадмин платформы', noWorkspaceDesc: 'Создайте компанию в админ-панели, чтобы начать работу в CRM.',
  },
  gate: {
    title: 'Задайте свой пароль', subtitle: 'Администратор выдал вам временный пароль. Чтобы продолжить, придумайте новый.',
    save: 'Сохранить и продолжить', done: 'Пароль сохранён — добро пожаловать!',
  },
  login: { askAdmin: 'Нет логина? Обратитесь к администратору.' },
}
