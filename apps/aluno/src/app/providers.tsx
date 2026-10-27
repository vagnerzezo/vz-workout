import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { Toaster } from '@workspace/ui/components/sonner'
import { pwaEnabled } from '../shared/config'
import { router } from './router'

// Só entra no bundle (e só registra o service worker) quando o PWA está ligado
const UpdatePrompt = lazy(() => import('../shared/pwa/update-prompt').then((m) => ({ default: m.UpdatePrompt })))

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  })
}

const queryClient = createQueryClient()

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
      {pwaEnabled && (
        <Suspense>
          <UpdatePrompt />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}
