import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useMocks } from '../shared/config'
import { listenForInstallPrompt } from '../shared/pwa/install'
import { Providers } from './providers'
import '@workspace/ui/globals.css'

listenForInstallPrompt()

async function enableMocking() {
  if (!useMocks) return
  const { worker } = await import('@workspace/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: !import.meta.env.DEV })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers />
    </StrictMode>,
  )
})
