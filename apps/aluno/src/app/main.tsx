import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './providers'
import '@workspace/ui/globals.css'

// Enquanto a API não existe, a API simulada (MSW) roda também no site publicado.
// Quando a API real chegar, defina VITE_USE_MOCKS=false no ambiente de produção.
const useMocks = import.meta.env.DEV || import.meta.env.VITE_USE_MOCKS !== 'false'

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
