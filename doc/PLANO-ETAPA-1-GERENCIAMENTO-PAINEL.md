# Plano de Execução — Etapa 1

## Completar ações de gerenciamento e edição do painel

**Data:** 04/11/2026  
**Repositório:** `vagnerzezo/vz-workout`  
**Status:** diagnóstico concluído; implementação ainda não iniciada

## Diagnóstico geral

A maior parte do painel já possui ações operacionais funcionais:

- Arquivar e reativar alunos.
- Editar, duplicar, arquivar e restaurar fichas.
- Editar, duplicar, arquivar e restaurar dietas.
- Criar e duplicar exercícios.
- Atribuir fichas e dietas.
- Responder check-ins.
- Confirmar ou recusar comprovantes.
- Alternar automações.
- Editar configurações.

As principais lacunas são:

- Cadastro de alunos sem edição completa.
- Exercícios próprios sem edição real.
- Ausência de exclusão nos principais cadastros.
- Ausência de confirmação em algumas ações destrutivas.
- Notificações sem edição ou exclusão.
- Convite de equipe ainda é placeholder.
- Logout do painel ainda é placeholder.
- Logo apenas pré-visualizado, sem upload persistente.
- Ausência de publicação/versionamento de fichas e dietas.
- Operações persistem somente no estado MSW em memória.
- Não existe backend real para garantir permissões e dependências.

---

## Matriz de ações por módulo

| Módulo | Tela/Local | Problema encontrado | Ação necessária | Arquivos envolvidos | Prioridade |
|---|---|---|---|---|---|
| Alunos | `/alunos` | A listagem possui visualizar, arquivar, reativar, tags e reenvio de convite, mas não possui edição completa do cadastro. | Criar ação **Editar aluno**, com formulário completo, validação, salvamento e atualização da lista/perfil. | `students-page.tsx`, `row-menu.tsx`, `student-page.tsx`, `students/api/queries.ts`, `packages/mocks/src/handlers/coach-student.ts` | Alta |
| Alunos | Menu de ações | O menu possui “Ver perfil”, “Conversar”, “Reenviar convite”, “Arquivar” e “Reativar”, mas não possui ícone contextual nas opções. | Padronizar ícones, tooltips e estados mobile/desktop. | `students/components/row-menu.tsx` | Média |
| Alunos | Arquivamento | Arquivamento existe e possui confirmação, mas não há exclusão lógica explícita nem restauração com informação de dependências. | Definir política de arquivamento, restauração e eventual exclusão definitiva. Bloquear exclusão quando houver histórico financeiro, treinos ou check-ins. | `archive-dialog.tsx`, `students-page.tsx`, handlers de alunos | Alta |
| Alunos | Cadastro | O cadastro cria aluno e convite, mas não permite editar todos os dados posteriormente. | Reutilizar o formulário de novo aluno para modo edição. | `new-student-form.tsx`, `new-student-page.tsx`, `student-profile/components/info-tab.tsx` | Alta |
| Perfil do aluno | `/alunos/:id` | A visualização existe e permite editar treino, dieta e configurações, mas dados cadastrais não são totalmente editáveis. | Adicionar edição de dados pessoais, contato, status, tags e preferências permitidas. | `student-page.tsx`, `info-tab.tsx`, `student-profile/api/queries.ts` | Alta |
| Perfil do aluno | Aba treino | Permite editar plano, visibilidade, séries e remover exercícios. | Adicionar confirmação padronizada para remoção e feedback de dependências. | `workout-tab.tsx`, `plan-editor`, `coach-student.ts` | Média |
| Fichas | `/fichas` | Já possui editar, duplicar, arquivar e restaurar através do menu de três pontos. Não existe excluir. | Adicionar exclusão somente quando a ficha não tiver alunos vinculados; caso contrário, exigir arquivamento. | `plans-page.tsx`, `template-card.tsx`, `plans/api/queries.ts`, `coach-plans.ts` | Alta |
| Fichas | Card da ficha | “Ver” e “Editar” usam a mesma navegação para o editor. | Separar visualização somente leitura de edição, caso o requisito exija consulta sem risco de alteração. | `template-card.tsx`, `plan-editor-page.tsx` | Média |
| Fichas | Publicação | Não há estado explícito de rascunho, publicada, desativada ou versão. | Criar estados de ciclo de vida, publicação, despublicação e histórico de versões. | `plan-editor-page.tsx`, schemas de planos, handlers de planos | Alta |
| Fichas | Editor | O editor permite alterar dias, exercícios, ordem e séries, mas a ação de salvar é concentrada no editor. | Garantir todos os metadados editáveis: nome, objetivo, nível, duração, frequência, fases e status. | `plan-editor-page.tsx`, `use-plan-draft.ts`, `coach-plans.ts` | Alta |
| Dietas | `/dietas` | Já possui editar, duplicar, arquivar e restaurar. Não possui exclusão. | Permitir exclusão somente para modelos sem atribuições; utilizar arquivamento quando houver dependências. | `diets-page.tsx`, `diet-card.tsx`, `diets/api/queries.ts`, `coach-diets.ts` | Alta |
| Dietas | Editor | A edição do conteúdo existe, mas o ciclo de publicação/versionamento não está definido. | Adicionar rascunho, publicação, desativação e versões anteriores. | `diet-editor-page.tsx`, `use-diet-draft.ts`, `coach-diets.ts` | Alta |
| Dietas | Dieta atribuída a aluno | Há regra que impede editar dieta de nutricionista sem permissão adequada. | Preservar a regra e exibir claramente o motivo do bloqueio, responsável e ação disponível. | `diet-tab.tsx`, `diet-editor-page.tsx`, settings/permissões | Alta |
| Exercícios | `/biblioteca` | Exercícios podem ser visualizados, criados, duplicados e enviados, mas não podem ser editados de verdade. | Criar editor de exercício próprio com nome, equipamento, nível, músculos, passos, alternativas e mídia. | `exercise-detail.tsx`, `new-exercise-form.tsx`, `exercise-page.tsx` | Alta |
| Exercícios | Detalhes | O botão “Editar” mostra apenas `Editar o exercício chega em breve`. | Substituir placeholder por rota/modal de edição real. | `library/components/exercise-detail.tsx` | Crítica |
| Exercícios | Exclusão | Não existe exclusão de exercícios próprios. | Adicionar exclusão com confirmação e bloqueio se o exercício estiver sendo usado em fichas. | `library/api/queries.ts`, `coach-library.ts`, `exercise-detail.tsx` | Alta |
| Exercícios | Mídia | O vídeo é apenas representado visualmente; não há upload, substituição ou remoção de arquivo. | Implementar upload de vídeo/imagem ou declarar claramente o recurso indisponível até existir backend. | `exercise-detail.tsx`, `coach-library.ts`, armazenamento futuro | Alta |
| Check-ins | `/check-ins` | O fluxo de revisão e lembrete existe. Não há edição/exclusão porque o registro representa uma resposta enviada pelo aluno. | Manter sem exclusão comum; adicionar visualizar histórico, marcar como resolvido, responder novamente conforme política e confirmação de envio. | `check-ins-page.tsx`, `review-page.tsx`, `check-in-review.tsx` | Média |
| Check-ins | Resposta | O envio de resposta existe, mas não há edição posterior da resposta enviada. | Definir se respostas podem ser editadas; se sim, criar endpoint e histórico. | `coach-checkins.ts`, `check-ins/api/queries.ts` | Média |
| Notificações | Histórico | É possível cancelar envio agendado, mas não editar, duplicar ou excluir notificações. | Adicionar visualizar detalhes, editar agendamento antes do envio, duplicar campanha e excluir/cancelar conforme status. | `notifications-page.tsx`, `new-notification-page.tsx`, `notifications/api/queries.ts`, `coach-notifications.ts` | Alta |
| Notificações | Automações | É possível ativar/desativar, mas não editar texto, público ou regras pelo mobile. | Criar editor de automação no desktop e acesso coerente no mobile. | `notifications-page.tsx`, `coach-notifications.ts` | Alta |
| Notificações | Inbox | As ações existentes são ler e marcar todas como lidas. | Não adicionar exclusão se a central for histórica; documentar retenção e incluir visualização completa. | `notifications-page.tsx` | Baixa |
| Financeiro | Recebimentos | Confirmar, recusar e lembrar cobrança existem. | Adicionar confirmação explícita para decisões irreversíveis e histórico da decisão. | `finance-page.tsx`, `proof-review.tsx`, `coach-finance.ts` | Alta |
| Financeiro | Cobranças | Não há edição completa de cobrança, cancelamento ou estorno. | Definir quais campos podem ser editados e implementar cancelamento/estorno conforme regra financeira. | `charge-sheet.tsx`, `finance-page.tsx`, `coach-finance.ts` | Alta |
| Financeiro | Planos e regras | Há edição de regras e ativação/desativação de planos. | Adicionar confirmação ao desativar plano e impedir alteração incompatível com cobranças existentes. | `plans-rules.tsx`, `coach-finance.ts` | Média |
| Comprovantes | `/financeiro/comprovantes/:id` | Visualização e decisão existem; não há reprocessamento, substituição ou exclusão de comprovante. | Permitir substituição apenas pelo aluno ou marcar como inválido, mantendo trilha de auditoria. | `proof-page.tsx`, `proof-review.tsx`, handlers financeiros | Média |
| Biblioteca | `/biblioteca` | Materiais e alimentos são principalmente consulta; não há CRUD completo para arquivos e materiais. | Definir entidades administráveis e implementar adicionar, editar, substituir, compartilhar, arquivar e excluir. | `library-page.tsx`, `library/api/queries.ts`, `coach-library.ts` | Alta |
| Biblioteca | Exercícios base | Exercícios da plataforma podem ser duplicados, mas não editados ou excluídos. | Manter somente duplicação para itens base; exibir claramente a restrição. | `exercise-detail.tsx` | Baixa |
| Chat | `/chat` | Mensagens, notas, mute, somente treinador e resposta automática existem. | Não aplicar CRUD tradicional às mensagens; adicionar excluir/editar apenas se houver requisito de moderação e política de auditoria. | `chat-page.tsx`, `context-panel.tsx`, `coach-chat.ts` | Baixa |
| Equipe | Configurações | “Convidar membro” chama `soon()` e não funciona. | Criar convite, reenvio, cancelamento, aceite, expiração e remoção de membro. | `settings-page.tsx`, `account.tsx`, `coach-settings.ts` | Crítica |
| Equipe | Permissões | A tabela permite alternar permissões, mas não há gestão completa de membros. | Implementar edição de função, remoção, bloqueio e confirmação de alterações sensíveis. | `settings-page.tsx`, componentes de campos, schemas de settings | Alta |
| Configurações | Conta | “Sair desta conta” também é placeholder. | Implementar logout real, limpeza de cache e redirecionamento para login. | `settings-page.tsx`, API de autenticação inexistente no painel | Alta |
| Marca | `/configuracoes/marca` | Nome e cor são editáveis; logo só é pré-visualizado e salva apenas o nome do arquivo. | Implementar upload, substituir, remover, restaurar marca anterior e publicação. | `brand-page.tsx`, `brand-editor.tsx`, `settings-page.tsx`, API de upload futura | Crítica |
| Marca | Personalização | Fontes, ícones, favicon, banners e ordenação não são gerenciáveis. | Definir escopo de personalização e criar entidade de branding/conteúdo. | `brand-editor.tsx`, configurações, backend futuro | Alta |
| Dashboard | `/` | Existem atalhos e ações de atenção, mas não é um cadastro. | Manter ações operacionais; garantir que “resolver atenção” tenha reversão ou histórico. | `dashboard-page.tsx`, `attention-list.tsx`, `dashboard/api/queries.ts` | Baixa |

---

## Ícones e padrão visual

### Padrões já existentes

O projeto já possui:

- `MoreHorizontal` para menus de ações.
- `Copy` para duplicação.
- `Archive` e `ArchiveRestore` para arquivar e restaurar.
- `Button` com `size="icon-sm"`.
- `DropdownMenu`.
- `AlertDialog`.
- `Drawer` para mobile.
- `Tooltip`.
- `UnsavedChangesDialog`.

Exemplos:

- `apps/painel/src/features/plans/components/template-card.tsx`
- `apps/painel/src/features/diets/components/diet-card.tsx`
- `apps/painel/src/features/students/components/row-menu.tsx`
- `apps/painel/src/features/students/components/bulk-actions.tsx`

### Padronização proposta

| Ação | Ícone sugerido | Uso |
|---|---|---|
| Visualizar | `Eye` | Abrir detalhes somente leitura |
| Editar | `Pencil` | Abrir formulário de edição |
| Excluir | `Trash2` | Exclusão definitiva ou lógica |
| Duplicar | `Copy` | Criar cópia independente |
| Arquivar | `Archive` | Retirar da circulação |
| Restaurar | `ArchiveRestore` | Retornar registro arquivado |
| Ativar | `Power` ou `ToggleRight` | Ativar recurso |
| Desativar | `PowerOff` ou `ToggleLeft` | Desativar recurso |
| Mais ações | `MoreHorizontal` | Menu contextual |
| Reordenar | `GripVertical` | Itens ordenáveis |
| Confirmar | `Check` | Confirmação de estado |
| Cancelar | `X` | Cancelar operação |

### Regras de interface

- Usar `aria-label` descritivo.
- Usar tooltip em botões somente com ícone.
- Manter texto visível em ações destrutivas importantes.
- Usar menu de três pontos quando houver mais de duas ações.
- Utilizar `AlertDialog` para exclusão, arquivamento e alterações irreversíveis.
- Usar `Drawer` ou menu adaptado no mobile.
- Não transformar toda ação em ícone se o significado não for óbvio.

---

## Operações atualmente existentes

### Funcionando no frontend/mock

- Arquivar e reativar alunos.
- Ações em massa de alunos.
- Reenvio de convite.
- Criar aluno.
- Editar fichas.
- Duplicar fichas.
- Arquivar/restaurar fichas.
- Atribuir fichas.
- Editar dietas.
- Duplicar dietas.
- Arquivar/restaurar dietas.
- Atribuir dietas.
- Criar exercícios.
- Duplicar exercícios.
- Compartilhar exercício com alunos.
- Editar plano de treino individual.
- Remover exercício de treino individual.
- Alterar visibilidade de dias.
- Responder check-ins.
- Enviar lembrete de check-in.
- Enviar mensagens.
- Editar notas de conversa.
- Silenciar conversa.
- Ativar somente treinador.
- Ativar/desativar resposta automática.
- Criar notificações.
- Agendar notificações.
- Cancelar notificações agendadas.
- Alternar automações.
- Confirmar e recusar comprovantes.
- Editar Pix e regras financeiras.
- Editar configurações.
- Editar permissões existentes.
- Editar nome e cor da marca.

### Existentes visualmente, mas incompletas

- Editar exercício próprio.
- Upload do logo.
- Convite de equipe.
- Logout do painel.
- CRUD de materiais da biblioteca.
- CRUD de notificações já enviadas.
- Exclusão de fichas.
- Exclusão de dietas.
- Exclusão de exercícios.
- Versionamento/publicação.
- Gestão completa de alunos.
- Gestão completa de equipe.

---

## Dependências técnicas

### Persistência

As operações atuais usam MSW e estado em memória:

- `packages/mocks/src/db.ts`
- `packages/mocks/src/handlers/coach-*.ts`

Isso significa que uma ação pode funcionar durante a sessão de desenvolvimento, mas não representa persistência de produção.

Nesta etapa, as ações podem ter contratos e testes completos no mock para validar a interface. Porém, nenhuma operação deve ser apresentada como persistência real antes da implementação do backend.

### Backend inexistente

Não há endpoints reais para:

- Editar aluno.
- Excluir ou remover exercício.
- Gerenciar equipe.
- Upload de arquivos.
- Editar ou excluir notificações.
- Publicar versões.
- Logout administrativo.
- Auditoria.
- Permissões server-side.

Esses recursos exigirão uma etapa de backend antes de serem considerados prontos para produção.

### Dependências entre registros

As exclusões devem respeitar:

- Exercícios usados em fichas.
- Fichas atribuídas a alunos.
- Dietas atribuídas a alunos.
- Alunos com histórico de treinos.
- Alunos com cobranças ou comprovantes.
- Notificações já enviadas.
- Arquivos utilizados por outros registros.
- Membros responsáveis por configurações ou dados.

Regra recomendada:

- **Arquivar** quando houver dependências.
- **Excluir definitivamente** somente quando não houver dependências.
- **Bloquear exclusão** quando a remoção quebrar histórico ou referência.
- Exibir claramente quais vínculos impedem a ação.

---

## Etapas de implementação

### Etapa 1 — Padronização de infraestrutura visual

Criar ou consolidar componentes reutilizáveis:

- `ResourceActions`.
- `ResourceActionMenu`.
- `DeleteResourceDialog`.
- `ArchiveResourceDialog`.
- `RestoreResourceDialog`.
- `ActionIconButton`.
- Tooltips padronizados.
- Estado de carregamento e desabilitado.
- Tratamento uniforme de sucesso e erro.

Não implementar ações que não tenham contrato de dados definido.

### Etapa 2 — Completar alunos

1. Criar edição completa do cadastro.
2. Adicionar ação Editar ao menu.
3. Reutilizar validações do cadastro.
4. Adicionar confirmação e regras de arquivamento.
5. Definir exclusão lógica/definitiva.
6. Atualizar lista, perfil e contadores.
7. Criar testes de edição, erro, cancelamento e dependências.

### Etapa 3 — Completar exercícios e biblioteca

1. Criar editor de exercício.
2. Implementar edição de todos os campos.
3. Adicionar exclusão de exercícios próprios.
4. Bloquear exclusão quando houver uso em fichas.
5. Adicionar substituição/remoção de mídia.
6. Implementar CRUD de materiais, se confirmado no escopo.
7. Criar testes de duplicação, edição e exclusão protegida.

### Etapa 4 — Completar fichas

1. Adicionar exclusão protegida.
2. Definir rascunho, publicada e arquivada.
3. Implementar publicar e despublicar.
4. Adicionar versionamento.
5. Separar visualização e edição.
6. Atualizar atribuições após alteração.
7. Criar testes de dependências e publicação.

### Etapa 5 — Completar dietas

1. Adicionar exclusão protegida.
2. Definir estados de publicação.
3. Implementar versionamento.
4. Manter regras de permissão nutricional.
5. Adicionar edição clara de metadados.
6. Atualizar alunos atribuídos.
7. Criar testes de bloqueio e permissões.

### Etapa 6 — Notificações e financeiro

1. Adicionar edição de notificações agendadas.
2. Adicionar duplicação de campanhas.
3. Adicionar cancelamento com confirmação.
4. Definir retenção de notificações enviadas.
5. Adicionar histórico de decisões financeiras.
6. Implementar cancelamento/estorno conforme regra.
7. Proteger operações financeiras com confirmação.

### Etapa 7 — Equipe, conta e marca

1. Implementar convite de equipe.
2. Implementar reenvio e cancelamento de convite.
3. Implementar remoção e alteração de função.
4. Implementar logout real.
5. Implementar upload e remoção do logo.
6. Adicionar restauração da marca anterior.
7. Adicionar publicação da personalização.

### Etapa 8 — Validação final

Executar:

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm typecheck:e2e
pnpm e2e
```

Criar testes específicos para:

- Editar registro.
- Cancelar edição.
- Excluir com confirmação.
- Cancelar exclusão.
- Bloquear exclusão com dependências.
- Duplicar sem alterar o original.
- Arquivar.
- Restaurar.
- Atualizar listagens relacionadas.
- Permissões.
- Mobile e desktop.
- Estados de erro e carregamento.

---

## Ordem recomendada de prioridade

### Crítica

1. Editar exercícios próprios — atualmente é placeholder.
2. Gestão de equipe — convite ainda não funciona.
3. Upload e gerenciamento real da marca.
4. Definir estratégia de persistência e contratos para ações destrutivas.
5. Implementar edição completa de alunos.
6. Implementar logout do painel.

### Alta

1. Exclusão protegida de fichas.
2. Exclusão protegida de dietas.
3. Exclusão protegida de exercícios.
4. Publicação e versionamento de fichas.
5. Publicação e versionamento de dietas.
6. Edição e duplicação de notificações.
7. CRUD de materiais da biblioteca.
8. Histórico financeiro e operações de cancelamento/estorno.
9. Gestão completa de membros e permissões.

### Média

1. Padronização global de ícones e tooltips.
2. Separação entre visualizar e editar.
3. Melhorias de feedback e confirmação.
4. Reversão de ações do dashboard.
5. Histórico de alterações.
6. Melhor suporte mobile para menus de ação.

### Baixa

1. Melhorias de refinamento visual.
2. Relatórios de ações administrativas.
3. Métricas de uso.
4. Personalização avançada de ícones e temas.

---

## Critério de conclusão

A etapa será considerada concluída somente quando:

- Cada módulo possuir uma matriz de ações definida.
- Nenhuma ação visual apontar para placeholder.
- A edição carregar e salvar os dados atuais.
- A exclusão exigir confirmação.
- Exclusões respeitarem dependências.
- Duplicações criarem registros independentes.
- Arquivamento e restauração atualizarem o estado.
- Listagens e telas relacionadas forem invalidadas após mutações.
- Ações funcionarem em mobile e desktop.
- Permissões forem respeitadas no fluxo.
- Testes cobrirem as novas operações.
- Limitações causadas pela ausência de backend estiverem documentadas.
- Nenhuma operação simulada for tratada como persistência real.

Nenhum arquivo de código foi alterado nesta etapa. A implementação deve começar somente após aprovação do plano.
