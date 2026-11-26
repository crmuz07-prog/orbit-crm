import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Bell, BellRing, Check } from 'lucide-react'
import { EmptyState } from '@/components/common/states'
import { IconButton } from '@/components/common/icon-button'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ActivityIcon } from '@/features/activities/ActivityIcon'
import { useOpenActivity } from '@/features/activities/useOpenActivity'
import { useSubject } from '@/features/activities/useSubject'
import { SNOOZE_OPTIONS } from '@/lib/reminders'
import type { Activity } from '@/lib/types'
import { relativeDay } from '@/lib/utils'
import { useReminderActions, useReminders } from './useReminders'

function ReminderItem({ reminder: r, due, onOpen }: { reminder: Activity; due: boolean; onOpen: (r: Activity) => void }) {
  const { t } = useTranslation()
  const subject = useSubject()
  const actions = useReminderActions()
  return (
    <motion.li layout initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 px-2 py-1">
      <button type="button" onClick={() => onOpen(r)} title={t('reminder.openRecord')}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-foreground/[0.05] focus-visible:bg-foreground/[0.05] focus-visible:outline-none">
        <ActivityIcon type={r.type} className="size-6" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{subject(r)}</span>
          <span className={due ? 'block text-xs font-medium text-rose-600 dark:text-rose-400' : 'block text-xs text-muted-foreground'}>{relativeDay(r.remind_at!)}</span>
        </span>
      </button>
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

function Group({ title, items, due, onOpen }: { title: string; items: Activity[]; due: boolean; onOpen: (r: Activity) => void }) {
  if (items.length === 0) return null
  return (
    <section>
      <h4 className="px-4 pt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h4>
      <ul><AnimatePresence initial={false}>{items.map((r) => <ReminderItem key={r.id} reminder={r} due={due} onOpen={onOpen} />)}</AnimatePresence></ul>
    </section>
  )
}

const canAskPermission = () => typeof Notification !== 'undefined' && Notification.permission === 'default'

/** Top-bar reminder centre with due badge, snooze and complete. */
export function ReminderBell() {
  const { t } = useTranslation()
  const { reminders, due, upcoming } = useReminders()
  const [open, setOpen] = useState(false)
  const openActivity = useOpenActivity()
  // The popover closes on the way, so the card (or the task dialog) is not hidden behind it.
  const openItem = (r: Activity) => { setOpen(false); openActivity(r) }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Group title={t('reminder.due')} items={due} due onOpen={openItem} />
        <Group title={t('reminder.upcoming')} items={upcoming.slice(0, 10)} due={false} onOpen={openItem} />
        {canAskPermission() && (
          <Button variant="link" size="sm" className="mx-2 mt-1" onClick={() => void Notification.requestPermission()}>{t('reminder.enableNotifications')}</Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
