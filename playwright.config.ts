import { defineConfig, devices } from '@playwright/test'

/**
 * Fluxos ponta a ponta (seção 11.3 do guia) no build de produção com a API simulada.
 * Portas próprias (4173/4174) para não brigar com o `pnpm dev` (5173/5174).
 */
const aluno = 'http://localhost:4173'
const painel = 'http://localhost:4174'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure', locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' },
  projects: [
    { name: 'aluno', testMatch: /aluno\/.*\.spec\.ts/, use: { ...devices['Pixel 7'], baseURL: aluno } },
    { name: 'painel', testMatch: /painel\/.*\.spec\.ts/, use: { ...devices['Pixel 7'], baseURL: painel } },
    { name: 'painel-desktop', testMatch: /painel\/routes\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, baseURL: painel } },
  ],
  webServer: [
    { command: 'pnpm --filter aluno build && pnpm --filter aluno preview --port 4173 --strictPort', url: aluno, reuseExistingServer: !process.env.CI, timeout: 180_000 },
    { command: 'pnpm --filter painel build && pnpm --filter painel preview --port 4174 --strictPort', url: painel, reuseExistingServer: !process.env.CI, timeout: 180_000 },
  ],
})
