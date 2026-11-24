import { useTranslation } from 'react-i18next'
import { useCrm } from '@/hooks/useData'
import type { Activity } from '@/lib/types'
import { fullName } from '@/lib/utils'

const CALL_BACK = 'Call back '

/**
 * The PBX integration writes English subjects ("Inbound call · Name", "Call back +998…"); they are shown in the
 * user's language, built from the call's own data. Subjects people typed are shown as written.
 */
export function useSubject() {
  const { t } = useTranslation()
  const { contactById } = useCrm()
  return (a: Activity): string => {
    if (a.type === 'call' && a.auto_logged && a.call_direction) {
      const contact = a.contact_id ? contactById.get(a.contact_id) : undefined
      return t('misc.autoCall', { direction: t(`enums.direction.${a.call_direction}`), name: contact ? fullName(contact) : a.phone ?? '' })
    }
    if (a.type === 'task' && a.subject.startsWith(CALL_BACK)) return t('misc.callBack', { phone: a.subject.slice(CALL_BACK.length) })
    return a.subject
  }
}
