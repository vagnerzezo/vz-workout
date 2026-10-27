import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './providers'
import '@workspace/ui/globals.css'

async function enableMocking() {
  if (!import.meta.env.DEV) return
  const { worker } = await import('@workspace/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers />
    </StrictMode>,
  )
})
