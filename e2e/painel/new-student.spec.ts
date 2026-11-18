import { expect, test } from '@playwright/test'
import { expectAccessible } from '../a11y'

test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

test('cadastrar aluno e copiar o acesso', async ({ page }) => {
  await page.goto('/alunos')
  await page.getByRole('link', { name: 'Cadastrar aluno' }).click()
  await expect(page.getByRole('form', { name: 'Novo aluno' })).toBeVisible()
  await expectAccessible(page, 'novo aluno')

  await page.getByLabel('Nome completo').fill('Joana Prado')
  await page.getByLabel('WhatsApp').fill('51991234567')
  await page.getByRole('button', { name: 'Criar aluno e gerar acesso' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Aluno cadastrado' })).toBeVisible()
  const code = (await page.getByRole('region', { name: 'Acesso criado' }).getByText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/).textContent())!
  await expectAccessible(page, 'aluno cadastrado')
  await page.getByRole('button', { name: 'Copiar mensagem' }).click()
  await expect(page.getByRole('button', { name: 'Copiada!' })).toBeVisible()
  const copied = await page.evaluate(() => navigator.clipboard.readText())
  expect(copied).toMatch(/^Oi, Joana!/)
  expect(copied).toContain(`Código: ${code}`)
})
