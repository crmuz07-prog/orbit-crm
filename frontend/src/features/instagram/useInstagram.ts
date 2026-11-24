import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { instagramApi } from '@/lib/api'
import type { InstagramPatch, InstagramSettings, SimulateKind } from '@/lib/types'
import { errorMessage } from '@/lib/utils'

const KEY = ['instagram']
// A simulated lead creates a contact, a deal and messages, and changes the analytics.
const AFFECTED = [['contacts'], ['deals'], ['activities'], ['instagram-stats'], ['events']]

export function useInstagramSettings() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const store = (data: InstagramSettings) => qc.setQueryData(KEY, data)
  const fail = (e: unknown) => toast.error(errorMessage(e))
  return {
    settings: useQuery({ queryKey: KEY, queryFn: instagramApi.settings }).data,
    update: useMutation({ mutationFn: (patch: InstagramPatch) => instagramApi.update(patch), onSuccess: (d) => { store(d); toast.success(t('igSettings.saved')) }, onError: fail }),
    rotate: useMutation({ mutationFn: instagramApi.rotate, onSuccess: (d) => { store(d); toast.success(t('igSettings.rotated')) }, onError: fail }),
    simulate: useMutation({
      mutationFn: (kind: SimulateKind) => instagramApi.simulate(kind),
      onSuccess: () => { toast.success(t('instagram.simulated')); return Promise.all(AFFECTED.map((queryKey) => qc.invalidateQueries({ queryKey }))) },
      onError: fail,
    }),
  }
}
