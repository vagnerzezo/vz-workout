import { expect, test, type Locator } from '@playwright/test'
import { fernandaInvite } from '../../packages/mocks/src/fixtures/renato-auth'
import { expectAccessible } from '../a11y'

// A caixa fica escondida dentro do rótulo: toca no rótulo, como a pessoa faria
const tick = (box: Locator) => box.locator('xpath=ancestor::label').click()
const code = `${fernandaInvite.code.slice(0, 3)}-${fernandaInvite.code.slice(3)}`

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock-sessao', 'fora'))
})

test('primeiro acesso: código → senha → anamnese → instalar → lembretes → Home', async ({ page }) => {
  await page.goto(`/primeiro-acesso/${code}`)
  await expect(page.getByText(`Código válido · acesso de ${fernandaInvite.fullName}`)).toBeVisible()
  await expectAccessible(page, 'código')
  await page.getByRole('button', { name: 'Continuar' }).click()

  await expect(page.getByRole('heading', { name: 'Crie sua senha' })).toBeVisible()
  await page.getByLabel('Senha', { exact: true }).fill('Corrida2026')
  await page.getByLabel('Repita a senha').fill('Corrida2026')
  await tick(page.getByRole('checkbox', { name: /Termos de uso/ }))
  await tick(page.getByRole('checkbox', { name: /dados de saúde/ }))
  await expectAccessible(page, 'senha')
  await page.getByRole('button', { name: 'Criar senha' }).click()

  await expect(page.getByRole('heading', { name: 'Conte sobre você' })).toBeVisible()
  await tick(page.getByRole('radio', { name: 'Emagrecer' }))
  await page.getByLabel('Peso (kg)').fill('64,5')
  await page.getByLabel('Altura (cm)').fill('165')
  await tick(page.getByRole('checkbox', { name: 'Nenhuma' }))
  await expectAccessible(page, 'anamnese')
  await page.getByRole('button', { name: 'Enviar respostas' }).click()

  await expect(page.getByRole('heading', { name: 'Coloque o app na tela inicial' })).toBeVisible()
  await expectAccessible(page, 'instalar')
  await page.getByRole('button', { name: 'Depois' }).click()

  await expect(page.getByRole('heading', { name: 'Quer receber lembretes?' })).toBeVisible()
  await expectAccessible(page, 'lembretes')
  await page.getByRole('button', { name: 'Agora não' }).click()

  await expect(page.getByRole('heading', { name: 'Tudo pronto, Fernanda!' })).toBeVisible()
  await page.getByRole('link', { name: 'Ir para o app' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Fernanda')
  await expectAccessible(page, 'Home')
})
