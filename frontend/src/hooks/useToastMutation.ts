import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/utils'

/** A mutation that refetches the given queries and confirms (or reports the error) with a toast. */
export function useToastMutation<A, R>(fn: (arg: A) => Promise<R>, success: string, invalidate: QueryKey[]) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success)
      return Promise.all(invalidate.map((queryKey) => qc.invalidateQueries({ queryKey })))
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
}
