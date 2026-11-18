# Estado atual do projeto — ponto de retomada

**Atualizado em:** 17/11/2026
**Branch:** `main`
**Último commit:** `43b0ab9 feat(painel): configurações e marca do app`

## O que já está commitado

Painel completo sobre a API simulada (MSW): alunos (lista, perfil, novo aluno com convite/QR), fichas de treino (lista e editor), dietas (lista e editor), check-ins, chat, notificações, financeiro, biblioteca e configurações/marca.

## Trabalho pendente de commit (rodada de qualidade e testes, 29/10–04/11)

### Infra de testes e scripts
- `playwright.config.ts` — e2e no build de produção (portas 4173 aluno / 4174 painel), projetos `aluno`, `painel` e `painel-desktop`.
- `e2e/aluno/`: `first-access`, `offline-workout`, `performance`, `recover-password`, `routes`.
- `e2e/painel/`: `check-ins`, `new-student`, `proofs`, `routes`.
- `e2e/a11y.ts` — checagem com `@axe-core/playwright`.
- `scripts/dev.mjs` — novo `pnpm dev`.
- `scripts/bundle-budget.mjs` — `pnpm budget` (orçamento de tamanho do bundle).
- `package.json`: scripts `test`, `e2e`, `budget`, `typecheck:e2e`; devDeps Playwright, axe, `@types/node`.
- `turbo.json`: tarefa `test`. `.gitignore`: `test-results`, `playwright-report`.

### Correções no app do aluno
- `diet/components/day-balance.tsx` — `dl` válido (barra dentro de `dd` oculto).
- `home/components/quick-actions.tsx` + `shared/components/log-weight-drawer.tsx` — gaveta "Registrar peso" com carregamento sob demanda (`defaultOpen`), economiza ~28 KB.
- `workout/components/history/history-calendar.tsx` — contraste dos dias.
- `test/setup.ts` — `asyncUtilTimeout: 3000`.

### Ajustes no painel
- `app/router.tsx` — `basename` a partir de `BASE_URL`.
- Pequenos ajustes em `plans-rules.tsx`, `plan-editor-page.tsx`, `students-table.tsx`, `students-page.test.tsx`, `test/setup.ts`, `vite.config.ts`.
- `packages/ui/src/components/skeleton.tsx`.

## Documentos de referência
- `doc/AUDITORIA-COMPLETA.md` — test/typecheck/lint/build passaram; `pnpm e2e` não rodou (Chromium do Playwright não instalado). Projeto **não pronto para produção**: sem backend, banco ou autorização server-side.
- `doc/PLANO-ETAPA-1-GERENCIAMENTO-PAINEL.md` — diagnóstico concluído, **implementação não iniciada**. 8 etapas.

## Próximos passos (em ordem)

1. **Validar a rodada pendente**
   ```bash
   pnpm exec playwright install chromium
   pnpm test && pnpm typecheck && pnpm lint && pnpm typecheck:e2e
   pnpm e2e
   pnpm budget
   ```
2. **Commitar** o trabalho pendente (sugestão: separar em `test(e2e)`, `perf(aluno)`, `fix(a11y)`, `chore`).
3. **Executar o plano** `PLANO-ETAPA-1-GERENCIAMENTO-PAINEL.md`:
   - Etapa 1 — padronização visual (ícones nos menus, diálogo de confirmação padrão).
   - Etapa 2 — edição completa de alunos (reusar `new-student-form` em modo edição).
   - Etapa 3 — editar/excluir exercício próprio (hoje `exercise-detail.tsx` mostra "Editar o exercício chega em breve" — **crítico**).
   - Etapa 4/5 — excluir fichas/dietas sem vínculos; rascunho/publicação/versões.
   - Etapa 6 — notificações (editar, duplicar, excluir) e financeiro.
   - Etapa 7 — convite de equipe, logout e upload de logo (hoje placeholders).
   - Etapa 8 — validação final.
