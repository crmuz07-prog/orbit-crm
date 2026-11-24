import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'

/** Resolves to the result text ("" when none was written), or null when the person cancelled. */
type AskResult = (subject: string) => Promise<string | null>

const ResultContext = createContext<AskResult | null>(null)

/** amoCRM closes a task with its result ("agreed on a demo", "no answer, call Friday"); one dialog for the whole app. */
export function TaskResultProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [subject, setSubject] = useState<string | null>(null)
  const [text, setText] = useState('')
  const resolver = useRef<(value: string | null) => void>(() => {})
  const ask = useCallback<AskResult>((s) => {
    setSubject(s)
    setText('')
    return new Promise((resolve) => { resolver.current = resolve })
  }, [])
  const settle = (value: string | null) => {
    resolver.current(value)
    setSubject(null)
  }
  return (
    <ResultContext.Provider value={ask}>
      {children}
      <Dialog open={subject !== null} onOpenChange={(o) => !o && settle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('tasks.complete.title')}</DialogTitle>
            <DialogDescription>{subject}</DialogDescription>
          </DialogHeader>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); settle(text.trim()) }}>
            <Textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder={t('tasks.complete.placeholder')} rows={3} maxLength={2000}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); settle(text.trim()) } }} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => settle(null)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('tasks.complete.action')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ResultContext.Provider>
  )
}

export function useTaskResult() {
  const ask = useContext(ResultContext)
  if (!ask) throw new Error('useTaskResult must be used inside <TaskResultProvider>')
  return ask
}
