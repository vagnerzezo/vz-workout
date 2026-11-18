import { expect, test } from '@playwright/test'
import { expectAccessible } from '../a11y'

test('conferir 4 comprovantes, com uma recusa', async ({ page }) => {
  await page.goto('/financeiro')
  await expectAccessible(page, 'financeiro')
  await page.getByRole('link', { name: /Conferir 4 comprovantes/ }).click()

  await expect(page).toHaveURL(/comprovantes\/chg_julia$/)
  await expect(page.getByRole('region', { name: 'Conferência' })).toContainText('Valor confere')
  await expectAccessible(page, 'comprovante')
  await page.getByRole('button', { name: 'Confirmar e renovar' }).click()

  await expect(page).toHaveURL(/comprovantes\/chg_camila$/)
  await expect(page.getByText('Valor diferente da cobrança')).toBeVisible()
  await page.getByRole('button', { name: 'Recusar' }).click()
  const reasons = page.getByRole('region', { name: 'Motivo da recusa' })
  await expect(reasons.getByRole('button', { name: /Valor diferente/ })).toContainText('sugerido')
  await expectAccessible(page, 'motivo da recusa')
  await reasons.getByRole('button', { name: /Valor diferente/ }).click()

  await expect(page).toHaveURL(/comprovantes\/chg_pedro$/)
  await page.getByRole('button', { name: 'Confirmar e renovar' }).click()
  await expect(page).toHaveURL(/comprovantes\/chg_ana$/)
  await page.getByRole('button', { name: 'Confirmar e renovar' }).click()

  await expect(page.getByRole('heading', { name: 'Comprovantes conferidos' })).toBeVisible()
  await expect(page.getByText('3 confirmados (R$ 1.060,00) e 1 recusado. Os alunos já foram avisados no app.')).toBeVisible()
  await expectAccessible(page, 'conferência concluída')
})
