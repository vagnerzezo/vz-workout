import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { resetDb, setLatency, setScenario } from '@workspace/mocks/handlers'
import { server } from '@workspace/mocks/node'

// A primeira busca de cada teste espera a rota (lazy) compilar; com os pacotes rodando juntos passa de 1 s
configure({ asyncUtilTimeout: 3000 })

beforeAll(() => {
  setLatency(0)
  server.listen({ onUnhandledRequest: 'error' })
})

// Relógio fixo na quarta, 21/10/2026, 20h: o mesmo dia do canvas (Treino C hoje, A e B feitos).
// Só o Date é falso; os timers continuam reais para o MSW e o userEvent.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 21, 20, 0))
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
  server.resetHandlers()
  resetDb()
  setScenario(null)
})

afterAll(() => server.close())
