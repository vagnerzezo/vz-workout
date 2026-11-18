import { expect, test } from '@playwright/test'
import { expectAccessible } from '../a11y'

// Auditoria: todas as telas do painel (no celular e no desktop), já carregadas, sem violação do axe
const routes = ['/', '/alunos', '/alunos/novo', '/alunos/stu_renato', '/alunos/stu_renato?aba=treino', '/alunos/stu_renato?aba=dieta', '/alunos/stu_renato?aba=avaliacao', '/fichas', '/fichas/tpl_ppl', '/dietas', '/dietas/diet_recomp_treino', '/check-ins', '/check-ins/revisar/ci_renato_9', '/chat', '/chat/conv_ana', '/notificacoes', '/notificacoes?aba=historico', '/notificacoes/nova', '/financeiro', '/financeiro?aba=pix', '/financeiro/comprovantes/chg_julia', '/biblioteca', '/biblioteca?aba=alimentos', '/biblioteca?aba=materiais', '/biblioteca/exercicios/ex_coach_bulgarian_pause', '/configuracoes', '/configuracoes?secao=equipe', '/configuracoes?secao=conta', '/configuracoes/marca', '/pagina-que-nao-existe']

for (const path of routes) {
  test(`axe ${path}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('h1, [role="dialog"]').first()).toBeVisible() // no desktop, o Novo aluno abre como folha
    await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0)
    await expectAccessible(page, path)
  })
}
