import { expect, test, type Page } from '@playwright/test'
import { expectAccessible } from '../a11y'

const hack = (page: Page) => page.getByRole('region', { name: 'Agachamento hack (máquina)' })

test('treino offline: registra séries sem internet, fecha e reabre o app, conclui', async ({ page, context }) => {
  await page.goto('/treinos/day_c/ativo')
  await expect(page.getByRole('heading', { level: 1, name: 'Treino C — Legs' })).toBeVisible()
  await expectAccessible(page, 'treino em andamento')

  await context.setOffline(true)
  await hack(page).getByRole('button', { name: 'Concluir aquecimento 1' }).click()
  await hack(page).getByRole('button', { name: 'Concluir série válida 1' }).click()
  await expect(page.getByText('2 de 22')).toBeVisible()
  const pending = await page.evaluate(() => JSON.parse(localStorage.getItem('treino-ativo') ?? '{}'))
  expect(Object.keys(pending.state?.pendingSync ?? {})).toHaveLength(2)

  // Fecha o app sem internet e abre de novo (sem o service worker do PWA, a reabertura precisa da rede)
  await page.close()
  await context.setOffline(false)
  const again = await context.newPage()
  await again.goto('/treinos/day_c/ativo')
  await expect(hack(again).getByRole('button', { name: 'Desmarcar série válida 1' })).toHaveAttribute('aria-pressed', 'true')
  await expect(again.getByText('2 de 22')).toBeVisible()
  // Com a internet de volta, a fila é enviada
  await expect.poll(async () => again.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('treino-ativo') ?? '{}').state?.pendingSync ?? {}).length)).toBe(0)

  await again.getByRole('button', { name: 'Concluir', exact: true }).click()
  await expect(again).toHaveURL(/\/resumo$/)
  await expectAccessible(again, 'resumo do treino')
  await again.getByRole('button', { name: 'Salvar treino' }).click()
  await expect(again).toHaveURL(/\/$/)
})
