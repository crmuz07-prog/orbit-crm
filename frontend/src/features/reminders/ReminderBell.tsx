import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Bell, BellRing, Check } from 'lucide-react'
import { EmptyState } from '@/components/common/states'
import { IconButton } from '@/components/common/icon-button'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ActivityIcon } from '@/features/activities/ActivityIcon'
import { useSubject } from '@/features/activities/useSubject'
import { SNOOZE_OPTIONS } from '@/lib/reminders'
import type { Activity } from '@/lib/types'
import { relativeDay } from '@/lib/utils'
import { useReminderActions, useReminders } from './useReminders'

function ReminderItem({ reminder: r, due }: { reminder: Activity; due: boolean }) {
  const { t } = useTranslation()
  const subject = useSubject()
  const actions = useReminderActions()
  return (
    <motion.li layout initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3 px-4 py-3">
      <ActivityIcon type={r.type} className="size-6" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{subject(r)}</p>
        <p className={due ? 'text-xs font-medium text-rose-600 dark:text-rose-400' : 'text-xs text-muted-foreground'}>{relativeDay(r.remind_at!)}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">{t('reminder.snooze')}</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SNOOZE_OPTIONS.map((o) => <DropdownMenuItem key={o.key} onSelect={() => actions.snooze(r, o.until())}>{t(`reminder.${o.key}`)}</DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <IconButton label={t('reminder.done')} onClick={() => actions.done(r)}><Check /></IconButton>
    </motion.li>
  )
}

function Group({ title, items, due }: { title: string; items: Activity[]; due: boolean }) {
  if (items.length === 0) return null
  return (
    <section>
      <h4 className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h4>
      <ul><AnimatePresence initial={false}>{items.map((r) => <ReminderItem key={r.id} reminder={r} due={due} />)}</AnimatePresence></ul>
    </section>
  )
}

const canAskPermission = () => typeof Notification !== 'undefined' && Notification.permission === 'default'

/** Top-bar reminder centre with due badge, snooze and complete. */
export function ReminderBell() {
  const { t } = useTranslation()
  const { reminders, due, upcoming } = useReminders()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('reminder.open')}>
          {due.length ? <BellRing className="text-primary" /> : <Bell />}
          <AnimatePresence>
            {due.length > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                {due.length}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-[70vh] w-96 overflow-y-auto p-0 pb-2">
        <div className="border-b border-foreground/[0.06] px-4 py-3 text-sm font-semibold">{t('reminder.title')}</div>
        {reminders.length === 0 && <EmptyState icon={Bell} title={t('reminder.empty')} description={t('reminder.emptyDesc')} compact />}
        <Group title={t('reminder.due')} items={due} due />
        <Group title={t('reminder.upcoming')} items={upcoming.slice(0, 10)} due={false} />
        {canAskPermission() && (
          <Button variant="link" size="sm" className="mx-2 mt-1" onClick={() => void Notification.requestPermission()}>{t('reminder.enableNotifications')}</Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
