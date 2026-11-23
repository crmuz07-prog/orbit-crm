import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { PhoneIncoming, PhoneOutgoing } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CALL_OUTCOMES } from '@/lib/constants'
import type { CallDirection, CallOutcome } from '@/lib/types'
import { cn } from '@/lib/utils'

export function OutcomePicker({ value, onChange }: { value: CallOutcome; onChange: (o: CallOutcome) => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('calls.outcome')}>
      {CALL_OUTCOMES.map(({ value: outcome }) => (
        <motion.button
          key={outcome}
          type="button"
          role="radio"
          aria-checked={value === outcome}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(outcome)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            value === outcome ? 'glass-glow text-primary-foreground' : 'glass-subtle text-muted-foreground hover:text-foreground',
          )}
        >
          {t(`enums.outcome.${outcome}`)}
        </motion.button>
      ))}
    </div>
  )
}

export function DirectionPicker({ value, onChange }: { value: CallDirection; onChange: (d: CallDirection) => void }) {
  const { t } = useTranslation()
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as CallDirection)}>
      <TabsList>
        <TabsTrigger value="outbound"><PhoneOutgoing /> {t('enums.direction.outbound')}</TabsTrigger>
        <TabsTrigger value="inbound"><PhoneIncoming /> {t('enums.direction.inbound')}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
