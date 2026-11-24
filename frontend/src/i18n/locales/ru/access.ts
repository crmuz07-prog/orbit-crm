import type { Locale } from '../../types'
import type { access as en } from '../en/access'

export const access: Locale<typeof en> = {
  access: {
    title: 'Роли и доступ', description: 'Что участники видят и могут делать. У владельцев и администраторов всегда полный доступ.',
    newRole: 'Новая роль', editRole: 'Редактировать роль', roleName: 'Название роли', default: 'По умолчанию', makeDefault: 'Сделать по умолчанию',
    members_one: '{{count}} участник', members_few: '{{count}} участника', members_many: '{{count}} участников', members_other: '{{count}} участника',
    saved: 'Роль сохранена', created: 'Роль создана', deleted: 'Роль удалена',
    deleteConfirm: 'Удалить роль «{{name}}»?', deleteDesc: 'Её участники перейдут на роль по умолчанию.', module: 'Раздел', scope: 'Записи',
    accessRole: 'Роль доступа', fullAccess: 'Полный доступ', noTeam: 'Без команды', team: 'Команда продаж',
    modules: { companies: 'Компании', contacts: 'Контакты', deals: 'Сделки', activities: 'Активности и звонки', reports: 'Отчёты и дашборд' },
    actions: { view: 'Просмотр', create: 'Создание', edit: 'Изменение', delete: 'Удаление', export: 'Экспорт' },
    scopes: { own: 'Свои', team: 'Команды', all: 'Все' },
    scopeHint: 'Свои — записи, где он ответственный · Команды — его команда и записи без ответственного · Все — всё пространство.',
  },
  teams: {
    title: 'Команды продаж', description: 'Объедините менеджеров, чтобы руководители видели воронку своей команды.', name: 'Название команды', add: 'Добавить команду',
    created: 'Команда создана', renamed: 'Команда переименована', deleted: 'Команда удалена', deleteConfirm: 'Удалить команду «{{name}}»?',
    deleteDesc: 'Участники останутся в пространстве без команды.', empty: 'Команд пока нет',
  },
  owner: { label: 'Ответственный', unassigned: 'Не назначен', me: 'Я' },
  settingsTabs: { account: 'Аккаунт', team: 'Команда и доступ', workspace: 'Пространство' },
  noAccess: { title: 'Нет доступа к разделу', desc: 'Попросите администратора изменить вашу роль доступа.' },
  crash: { title: 'Что-то пошло не так', desc: 'Страницу не удалось показать. Обычно помогает перезагрузка.', reload: 'Перезагрузить' },
  exportCsv: 'Экспорт CSV', exported: 'Файл экспорта загружен',
  security: { tab: 'Безопасность', title: 'Попытки входа', email: 'Логин', ip: 'IP-адрес', result: 'Результат', time: 'Время', success: 'Успешно', failed: 'Ошибка', empty: 'Попыток входа пока нет' },
}
