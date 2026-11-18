import { expect, test } from '@playwright/test'
import { RECOVERY_CODE, renatoLogin } from '../../packages/mocks/src/fixtures/renato-auth'
import { expectAccessible } from '../a11y'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('mock-sessao', 'fora'))
})

test('recuperar senha: código errado, código certo, senha nova e entra', async ({ page }) => {
  await page.goto('/entrar')
  await page.getByRole('link', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByRole('heading', { name: 'Esqueceu a senha?' })).toBeVisible()
  await expectAccessible(page, 'esqueceu a senha')
  await page.getByLabel('Celular ou e-mail cadastrado').fill(renatoLogin.phone)
  await page.getByRole('button', { name: 'Enviar código' }).click()

  await expect(page.getByRole('heading', { name: 'Digite o código' })).toBeVisible()
  await page.getByLabel('Código de 6 números').fill('111111')
  await expect(page.getByRole('alert')).toHaveText('Código incorreto. Você tem mais 4 tentativas.')
  await expectAccessible(page, 'código errado')
  await page.getByLabel('Código de 6 números').fill(RECOVERY_CODE)

  await expect(page.getByRole('heading', { name: 'Nova senha' })).toBeVisible()
  await page.getByLabel('Nova senha').fill('NovaSenha9')
  await expectAccessible(page, 'nova senha')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()

  await expect(page.getByRole('heading', { name: 'Senha alterada' })).toBeVisible()
  await page.getByRole('link', { name: 'Entrar no app' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Renato')
})
