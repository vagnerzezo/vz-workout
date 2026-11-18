import { expect, test } from '@playwright/test'
import { expectAccessible } from '../a11y'

test('revisar 6 check-ins em sequência até "Tudo respondido"', async ({ page }) => {
  await page.goto('/check-ins')
  await expect(page.getByRole('region', { name: 'Resumo dos check-ins' })).toContainText('Aguardando6')
  await expectAccessible(page, 'fila de check-ins')
  await page.getByRole('link', { name: /Revisar em sequência/ }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Renato Alves' })).toBeVisible()
  await expectAccessible(page, 'revisão do check-in')
  for (let left = 6; left > 0; left--) {
    await expect(page.getByText(new RegExp(`· ${left} aguardando$`))).toBeVisible()
    if (left === 6) await page.getByRole('group', { name: 'Respostas prontas' }).getByRole('button', { name: 'Atenção à dor' }).click()
    else await page.getByRole('textbox', { name: 'Resposta ao aluno' }).fill('Boa semana! Mantenha o plano e me avise de qualquer dor.')
    await page.getByRole('button', { name: /^Enviar/ }).click()
  }

  await expect(page.getByRole('heading', { name: 'Tudo respondido' })).toBeVisible()
  await expect(page.getByText('6 alunos receberam seu feedback no app.')).toBeVisible()
  await expectAccessible(page, 'tudo respondido')
})
