import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Instagram, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { instagramApi } from '@/lib/api'
import { errorMessage } from '@/lib/utils'

/** Reply box shown on records of people who came from Instagram; sends through Meta inside the 24-hour window. */
export function InstagramReply({ contactId }: { contactId: string }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const send = useMutation({
    mutationFn: () => instagramApi.reply(contactId, text.trim()),
    onSuccess: () => {
      setText('')
      toast.success(t('igReply.sent'))
      return qc.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (text.trim()) send.mutate()
  }
  return (
    <form onSubmit={submit} className="mb-2 flex items-center gap-2" title={t('igReply.window')}>
      <Instagram className="size-4 shrink-0 text-pink-500" />
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('igReply.placeholder')} aria-label={t('igReply.placeholder')} maxLength={1000} />
      <Button type="submit" size="icon" className="size-9 shrink-0" disabled={send.isPending || !text.trim()} aria-label={t('igReply.send')}><Send /></Button>
    </form>
  )
}
