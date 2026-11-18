import { expect, test } from '@playwright/test'
import { expectAccessible } from '../a11y'

// Auditoria: todas as telas do app do aluno, já carregadas, sem violação do axe
const signedIn = ['/', '/treinos', '/treinos/day_c/ativo', '/treinos/historico', '/dieta', '/dieta/refeicoes/almoco', '/dieta/lista-de-compras', '/chat', '/notificacoes', '/perfil', '/perfil/pagamento', '/perfil/check-in', '/perfil/progresso', '/perfil/configuracoes', '/perfil/configuracoes/dados-pessoais', '/perfil/configuracoes/objetivo', '/perfil/configuracoes/acesso', '/perfil/configuracoes/meus-dados', '/perfil/configuracoes/ajuda', '/perfil/configuracoes/termos', '/?cenario=pausado', '/pagina-que-nao-existe']
const signedOut = ['/entrar', '/recuperar-senha', '/primeiro-acesso']

const settle = async (page: import('@playwright/test').Page) => {
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
}

for (const path of signedIn) {
  test(`axe ${path}`, async ({ page }) => {
    await page.goto(path)
    await settle(page)
    await expectAccessible(page, path)
  })
}

for (const path of signedOut) {
  test(`axe ${path} (sem sessão)`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('mock-sessao', 'fora'))
    await page.goto(path)
    await settle(page)
    await expectAccessible(page, path)
  })
}
