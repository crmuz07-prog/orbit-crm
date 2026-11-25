import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'framer-motion'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/auth/AuthProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ConfirmProvider } from '@/components/common/confirm-provider'
import { TaskResultProvider } from '@/features/tasks/TaskResultProvider'
import { ErrorBoundary } from '@/components/common/error-boundary'
import { reloadOnStaleBuild } from '@/lib/stale-build'
import App from './App'
import '@/i18n'
import './index.css'

reloadOnStaleBuild()

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* startTransition: while a page's code loads, the current page stays on screen instead of a fallback. */}
      <BrowserRouter>
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={300}>
            <AuthProvider>
              <ConfirmProvider>
                <TaskResultProvider>
                  <ErrorBoundary>
                    <App />
                  </ErrorBoundary>
                </TaskResultProvider>
              </ConfirmProvider>
              <Toaster position="bottom-right" richColors closeButton />
            </AuthProvider>
          </TooltipProvider>
        </MotionConfig>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
