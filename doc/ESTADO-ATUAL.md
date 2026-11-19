# Estado atual do projeto — ponto de retomada

**Atualizado em:** 19/11/2026
**Branch:** `main`
**Publicado em:** https://vzworkout.vercel.app (aluno na raiz, painel em `/admin`)

## ▶ Onde paramos (19/11/2026)

- **Último commit:** `476756f feat(painel): editar e excluir exercício próprio na biblioteca`. Árvore limpa na `main`, **ainda não enviada** ao GitHub (sem `git push`) nem publicada na Vercel.
- **Etapas 1, 2 e 3 do plano concluídas** (detalhes abaixo).
- **Próximo passo: Etapa 4 — fichas de treino** (`doc/PLANO-ETAPA-1-GERENCIAMENTO-PAINEL.md`, seção "Etapa 4"):
  1. Exclusão protegida: só modelo sem alunos usando (`studentsUsing === 0`); com vínculo, só arquivar.
  2. Estados rascunho / publicada / arquivada.
  3. Publicar e despublicar.
  4. Versionamento.
  5. Separar visualização e edição ("Ver" e "Editar" hoje abrem o mesmo editor).
  6. Atualizar atribuições após alteração.
  7. Testes de dependências e publicação.
- **Decidir antes de começar a etapa 4** (muda o comportamento atual: hoje "Salvar" no editor já vale direto para quem usa a ficha):
  - Publicar uma versão nova atualiza as cópias dos alunos, ou só vale para novas atribuições?
  - Quantas versões guardar e se dá para voltar a uma anterior.
- Onde mexer: `apps/painel/src/features/plans/` (lista, cards), `features/plan-editor/` (editor), `packages/mocks/src/handlers/coach-plans.ts` (API simulada), schemas em `packages/core/src/schemas/`.
- Reaproveitar o que a etapa 1 criou: `ResourceActionMenu`, `ResourceConfirmDialog` (`intent="delete"`), `runAction`.

### Como validar (o mesmo usado nas etapas 1–3)

```bash
pnpm exec tsc -b apps/painel apps/aluno --noEmit   # typecheck de verdade (ver pendências)
(cd packages/mocks && pnpm exec tsc --noEmit -p .)
pnpm lint && pnpm test
pnpm e2e --project=painel --project=painel-desktop  # Chromium do Playwright já instalado
```

Última rodada: painel 114 testes, aluno 134, core 312; e2e do painel 63/63.

## Já feito

- Painel completo sobre a API simulada (MSW): alunos, fichas, dietas, check-ins, chat, notificações, financeiro, biblioteca, configurações/marca.
- Rodada de qualidade commitada (`13f724a`): e2e com Playwright, `pnpm dev`, `pnpm budget`, ajustes de a11y/performance.
- Deploy único na Vercel (`4c33a2a`).
- Etapas 1–3 do plano de gerenciamento: `7c12fea`, `d4be080`, `476756f`.

## Plano de gerenciamento (`doc/PLANO-ETAPA-1-GERENCIAMENTO-PAINEL.md`)

### Etapa 1 — padronização visual: concluída (19/11)

Componentes em `apps/painel/src/shared/`:
- `components/resource-actions.tsx`
  - `ResourceActionMenu`: menu ⋯ com ícone padrão por ação (`edit`, `duplicate`, `archive`, `restore`, `delete`…) e ações destrutivas separadas no fim.
  - `ActionIconButton`: botão só com ícone, com `aria-label` e tooltip.
- `components/resource-confirm-dialog.tsx` — `ResourceConfirmDialog` (`intent`: `archive` | `restore` | `delete`), com estado "…ando" e botões travados enquanto salva.
- `lib/run-action.ts` — `runAction`: toast de sucesso, ou de erro com "Tente de novo."

Aplicado em: cards de ficha e dieta, menu da linha de alunos, cabeçalho do perfil do aluno, `ArchiveDialog` de alunos.
Novo: arquivar ficha/dieta agora pede confirmação (antes arquivava direto).
Não foi criada nenhuma ação sem contrato de dados (ex.: excluir) — entra nas etapas seguintes.

Validação: `tsc -b`, lint, testes unitários e e2e do painel passando.

### Etapa 2 — alunos: concluída (19/11)

- **Editar dados** (`student-profile/components/edit-student-drawer.tsx`): nome, WhatsApp, e-mail, nascimento, altura, sexo e cidade.
  - Schema `StudentProfileEdit` no core reaproveita as regras do Novo aluno (nome e sobrenome, 11 dígitos, e-mail).
  - Avisa e bloqueia WhatsApp que já é de outro aluno (lookup + 409 da API).
  - Plano e cobrança ficam fora: mudam no Financeiro.
  - Entradas: botão "Editar" em Info › Dados pessoais, "Editar dados" no menu ⋯ do perfil e da lista (abre `/alunos/:id?aba=info&editar=1`).
- **Política de exclusão**: só **convite pendente** pode ser excluído de vez ("Excluir convite", com confirmação). Quem já tem cadastro/histórico só é arquivado (a API devolve 409).
- API simulada: `PATCH /api/coach/students/:id` e `DELETE /api/coach/students/:id`; edições e exclusões refletem na lista, perfil, contadores e dashboard.
- Peças de formulário (`field`, `Hint`, `Chips`…) movidas para `shared/components/form-parts.tsx`.
- Limitação: no celular a lista não tem menu ⋯ e o menu do perfil é só desktop; no celular edita-se pela aba Info, e excluir convite/arquivar pelo perfil não aparece (arquivar no celular já era assim).
- Tags: continua só adicionar (remover tag fica para depois).

### Etapa 3 — exercícios: concluída (19/11)

- **Editar exercício próprio** (o placeholder "chega em breve" saiu): nome, músculos, equipamento, nível, passo a passo, substituições (do mesmo músculo principal, até 5) e vídeo (manter, remover ou trocar por arquivo/link).
  - `new-exercise-form.tsx` virou `exercise-form.tsx` (criar e editar); o Novo exercício também ganhou nível e substituições.
  - Core: `NewExercise` com `level`/`alternatives` (com padrão) e `ExerciseEdit` (`keepVideo`).
- **Excluir exercício próprio** com confirmação. Bloqueado se alguma ficha usa — modelo ativo, **arquivado** (pode voltar) ou ficha de aluno; a tela desabilita o botão quando o "Usado em" > 0 e explica o 409 no caso da ficha arquivada.
- Exercícios da base: só "Duplicar e personalizar" (a API recusa editar/excluir com 403).
- API simulada: `PUT` e `DELETE /api/coach/library/exercises/:id`; excluído some também das substituições dos outros.
- Mídia continua simulada (só o nome do arquivo); upload real depende do backend.

### Próximas etapas
- Etapas 4/5 — excluir fichas/dietas sem vínculos; rascunho/publicação/versões.
- Etapa 6 — notificações e financeiro.
- Etapa 7 — convite de equipe, logout, upload de logo.
- Etapa 8 — validação final.

## Pendências conhecidas
- `pnpm budget` falha: JS da primeira tela do app do aluno em 193 KB gzip (meta 170 KB). Já estava assim antes da etapa 1.
- O script `typecheck` dos apps (`tsc --noEmit`) não verifica nada, porque o `tsconfig.json` tem `files: []` e só referências. Use `tsc -b` (o `build` já usa).
- Projeto ainda sem backend, banco ou autorização server-side.
