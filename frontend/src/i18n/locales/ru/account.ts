import type { Locale } from '../../types'
import type { account as en } from '../en/account'

export const account: Locale<typeof en> = {
  roles: { owner: 'Владелец', admin: 'Администратор', member: 'Участник' },
  account: {
    forgot: 'Забыли пароль?', forgotTitle: 'Восстановление пароля', forgotSub: 'Введите рабочий email — мы отправим ссылку для сброса пароля.',
    sendLink: 'Отправить ссылку', sentTitle: 'Проверьте почту', backToSignIn: 'Вернуться ко входу',
    sentSub: 'Если для {{email}} есть аккаунт, ссылка уже в пути. Письма нет? Попросите ссылку у администратора пространства.',
    resetTitle: 'Новый пароль', newPassword: 'Новый пароль', confirmPassword: 'Повторите пароль', mismatch: 'Пароли не совпадают',
    savePassword: 'Сохранить пароль', resetDone: 'Пароль обновлён — вы вошли в систему',
    verifyTitle: 'Подтверждаем email…', verified: 'Email подтверждён', verifiedSub: 'Спасибо! Ваш email подтверждён.',
    verifyFailed: 'Ссылка недействительна или устарела', openApp: 'Открыть Orbit',
    banner: 'Подтвердите email — мы отправили ссылку на {{email}}.', resend: 'Отправить снова', resent: 'Письмо отправлено',
    profile: 'Профиль', name: 'Полное имя', saveProfile: 'Сохранить', profileSaved: 'Профиль обновлён', security: 'Пароль',
    currentPassword: 'Текущий пароль', changePassword: 'Сменить пароль', passwordChanged: 'Пароль изменён', setFirstPassword: 'Задать пароль',
    workspaces: 'Пространства', switched: 'Переключено на {{workspace}}',
  },
  team: {
    title: 'Команда', description: 'Выдавайте коллегам логин и управляйте их доступом.', member: 'Участник', role: 'Роль',
    addUser: 'Добавить пользователя', added: 'Пользователь добавлен', fullName: 'Полное имя', email: 'Логин (email)', tempPassword: 'Временный пароль',
    generate: 'Сгенерировать', credentials: 'Данные для входа (передайте сотруднику)', credentialsHint: 'При первом входе система попросит задать свой пароль.',
    you: 'вы', temporary: 'временный пароль', inactive: 'отключён', remove: 'Удалить из пространства', removeConfirm: 'Удалить {{name}}?',
    removeConfirmDesc: 'Доступ к пространству будет закрыт сразу.', removed: 'Участник удалён', roleChanged: 'Роль обновлена',
    setPassword: 'Задать пароль', setPasswordHint: 'Выдайте {{name}} временный пароль — при следующем входе его нужно сменить.',
    passwordSet: 'Пароль обновлён', readOnly: 'Командой управляют только владельцы и администраторы.', demoReadOnly: 'В демо-пространстве управление командой отключено.',
  },
}
