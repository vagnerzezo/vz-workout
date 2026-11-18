# Auditoria Completa do Projeto

**Data:** 04/11/2026  
**Repositório:** `vagnerzezo/vz-workout`  
**Status geral:** não pronto para produção

## Resumo executivo

O projeto possui uma base frontend bem estruturada, com duas aplicações Vite em monorepo:

- Aplicativo do aluno.
- Painel administrativo do treinador.

Há boa cobertura de telas, componentes, validações de domínio, testes unitários e testes de componentes. Entretanto, a aplicação ainda funciona principalmente sobre uma API simulada com MSW, estado em memória e fixtures. Não existe backend, banco de dados, migração, persistência real ou autorização server-side no repositório.

O painel atual é operacional, mas ainda não é um CMS completo. Diversos elementos apresentados ao usuário continuam definidos no código e não podem ser criados, editados, reorganizados ou removidos pelo administrador.

## Validações executadas

Os seguintes comandos foram executados com sucesso:

```text
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm typecheck:e2e
```

O comando `pnpm e2e` não conseguiu executar os testes porque o navegador Chromium do Playwright não estava instalado no ambiente:

```text
Executable doesn't exist at .../ms-playwright/.../headless_shell
```

Portanto, os testes E2E, de responsividade e de acessibilidade em navegador real ainda precisam ser executados após a instalação dos browsers do Playwright.

---

## 1. Telas e páginas encontradas

### 1.1 Aplicativo do aluno

Rotas principais definidas em `apps/aluno/src/app/router.tsx`:

- Login.
- Primeiro acesso.
- Recuperação de senha.
- Acesso pausado.
- Home.
- Lista de treinos.
- Treino ativo.
- Histórico de treinos.
- Resumo de sessão.
- Dieta.
- Refeição.
- Lista de compras.
- Chat.
- Notificações.
- Perfil.
- Pagamento.
- Check-in.
- Progresso.
- Configurações.

### 1.2 Páginas incompletas do aluno

As seguintes rotas utilizam a tela genérica `ComingSoon`:

- Dados pessoais.
- Objetivo e nível.
- E-mail e senha.
- Meus dados.
- Central de ajuda.
- Termos e privacidade.

Localização: `apps/aluno/src/app/router.tsx:41-47`.

Essas páginas precisam ser implementadas ou substituídas por fluxos administrativos/conteúdo real.

### 1.3 Painel administrativo

Rotas principais definidas em `apps/painel/src/app/router.tsx`:

- Dashboard.
- Lista de alunos.
- Cadastro de aluno.
- Perfil do aluno.
- Fichas de treino.
- Editor de ficha.
- Nova ficha.
- Dietas.
- Editor de dieta.
- Nova dieta.
- Check-ins.
- Revisão de check-in.
- Chat.
- Notificações.
- Nova notificação.
- Financeiro.
- Comprovantes.
- Biblioteca.
- Detalhes de exercício.
- Configurações.
- Marca do aplicativo.

O painel possui maior cobertura funcional que o aplicativo do aluno, mas ainda há operações incompletas e ausência de infraestrutura real.

---

## 2. Problemas críticos

| # | Prioridade | Local | Problema | Ação necessária |
|---|---|---|---|---|
| 1 | Crítica | `apps/aluno/src/shared/config.ts:2-5` e `apps/painel/src/shared/config.ts:2-5` | A aplicação usa MSW por padrão, inclusive em produção, quando `VITE_USE_MOCKS` não está explicitamente configurado como `false`. | Criar backend real e restringir mocks a desenvolvimento e testes. |
| 2 | Crítica | `packages/mocks/src/db.ts:9-10, 99-104` | Toda a base de dados é estado em memória e reinicia ao recarregar a página. | Implementar banco de dados real, persistência, transações e migrações. |
| 3 | Crítica | `packages/mocks/src/handlers/coach.ts:39-44` | Os handlers administrativos simulados não comprovam proteção por sessão, papel ou permissão. | Implementar autorização no backend e nunca confiar apenas no frontend. |
| 4 | Crítica | Todo o projeto | Não existe backend, esquema de banco, migração, upload real, filas, envio de e-mail, push ou integração de pagamento. | Definir e implementar a arquitetura de produção. |

---

## 3. Editabilidade pelo painel administrativo

### 3.1 O que já pode ser editado

- Nome da aplicação.
- Cor principal da marca.
- Algumas configurações do treinador.
- Horários de atendimento.
- Regras de check-in.
- Permissões configuráveis.
- Fichas de treino.
- Dietas.
- Exercícios próprios.
- Atribuições para alunos.
- Notificações.
- Automações de notificações.
- Regras financeiras.
- Configurações de Pix.
- Configurações individuais de alunos.
- Tags de alunos.
- Estado de arquivamento de alunos.

### 3.2 O que ainda não pode ser editado

- Páginas do aplicativo.
- Seções das páginas.
- Textos institucionais.
- Títulos e descrições globais.
- Menus e estrutura de navegação.
- Botões e chamadas para ação.
- Layouts.
- Fontes.
- Ícones.
- Conteúdo da Home.
- Conteúdo das telas de autenticação.
- Termos e privacidade.
- Central de ajuda.
- Banners e campanhas.
- Ordenação geral dos componentes.
- Criação de novas páginas pelo administrador.
- Biblioteca geral de imagens e arquivos.
- Favicon e imagens de instalação.

### 3.3 Conclusão sobre o painel

O painel atual é um painel operacional, não um CMS completo. A regra de que todo elemento personalizável deve ser administrável ainda não é atendida.

---

## 4. Marca, imagens e uploads

A tela de marca permite escolher um arquivo de logo, mas o upload ainda não é real.

Evidências:

- `apps/painel/src/features/settings/pages/settings-page.tsx:29` informa que o arquivo é apenas pré-visualizado.
- `apps/painel/src/features/settings/pages/brand-page.tsx:44-45` salva apenas o nome do arquivo.
- Não existe endpoint efetivo de upload nos handlers.
- Não há integração com armazenamento de arquivos.

### Necessário implementar

- Upload multipart ou URL assinada.
- Armazenamento de arquivos.
- Validação de formato e tamanho.
- Redimensionamento e otimização.
- Exclusão e substituição de imagens.
- Controle de permissões.
- CDN ou estratégia de distribuição.
- Logo, favicon, ícone PWA e imagens de banners.

---

## 5. Análise de CRUD por módulo

| Módulo | Estado atual |
|---|---|
| Alunos | Criar, listar, filtrar, arquivar, reativar, adicionar tags e reenviar convite. |
| Alunos | Não há edição completa de dados cadastrais, exclusão definitiva, alteração ampla de perfil ou histórico real de alterações. |
| Fichas | Criar, editar, duplicar, arquivar, reativar e atribuir. |
| Fichas | Não há exclusão definitiva nem gerenciamento completo de versões/publicações. |
| Dietas | Criar, editar, duplicar, arquivar, reativar e atribuir. |
| Dietas | Não há exclusão definitiva, versionamento ou fluxo robusto de publicação. |
| Exercícios | Criar, duplicar e compartilhar. |
| Exercícios | Não há exclusão ou edição completa demonstrada. |
| Notificações | Criar, agendar, cancelar, marcar como lida e configurar automações. |
| Notificações | Não há edição completa de notificações já criadas nem histórico persistente real. |
| Financeiro | Confirmar, recusar, lembrar cobrança, configurar Pix e editar regras. |
| Financeiro | Não há integração real de cobrança, conciliação, webhook ou auditoria. |
| Equipe | Visualização e permissões. |
| Equipe | Convite de membro ainda está incompleto. |
| Configurações | Edição parcial de perfil, marca, horários e preferências. |
| Configurações | Logout e parte da gestão de equipe ainda são placeholders. |

### Requisitos gerais de CRUD ainda necessários

- Criar registros.
- Visualizar registros.
- Editar todos os campos permitidos.
- Excluir ou arquivar com política definida.
- Restaurar registros quando aplicável.
- Confirmar operações destrutivas.
- Pesquisar.
- Filtrar.
- Ordenar.
- Paginar no servidor.
- Registrar histórico.
- Atualizar todas as telas dependentes após salvar.

---

## 6. Funcionalidades explicitamente incompletas

- Convite de membro da equipe:
  - `apps/painel/src/features/settings/pages/settings-page.tsx:77-80`.
- Sair da conta no painel:
  - `apps/painel/src/features/settings/pages/settings-page.tsx:308-311`.
- Páginas de configurações do aluno:
  - `apps/aluno/src/app/router.tsx:41-47`.
- Página de erro 404 real:
  - A rota genérica utiliza `ComingSoon`.
- Upload de logo:
  - Apenas pré-visualização local.
- Backend real.
- Persistência real.
- CMS.
- Gerenciamento de páginas e seções.
- Gerenciamento de mídia.
- Controle de fontes, ícones e temas.

---

## 7. Integrações e persistência

Os clientes HTTP estão implementados em:

- `apps/aluno/src/shared/api/client.ts`.
- `apps/painel/src/shared/api/client.ts`.

Eles utilizam `fetch`, cookies e validação com Zod. Entretanto, as respostas são fornecidas pelos handlers MSW em `packages/mocks/src/handlers`.

O estado simulado é explicitamente descrito como reiniciado ao recarregar em `packages/mocks/src/db.ts:9`.

### Consequências atuais

- Alterações desaparecem ao recarregar.
- Dados não são compartilhados entre usuários.
- Não há concorrência real.
- Não há logs ou auditoria.
- Não há cache distribuído.
- Não há controle transacional.
- Não há recuperação de falha de servidor real.
- Não há integração com serviços externos.
- Não há isolamento real entre treinadores.

---

## 8. Segurança e permissões

Há modelos de permissões e sessões na interface, mas não há comprovação de enforcement em backend.

### Riscos e lacunas

- Sem backend real para validar autorização.
- Sem RBAC/ABAC efetivo no servidor.
- Sem proteção comprovada para rotas administrativas.
- Sem isolamento por organização ou tenant.
- Sem trilha de auditoria.
- Sem rate limiting real.
- Sem política de sessão implementada no servidor.
- Recuperação de senha existente apenas no mock.
- Sem confirmação de isolamento entre treinadores.
- Sem comprovação de proteção contra acesso direto a endpoints.

Os controles exibidos no painel não são suficientes para segurança de produção.

---

## 9. Responsividade e acessibilidade

### Pontos positivos

- Existem versões mobile e desktop.
- Há testes com Axe.
- Existem testes para várias rotas.
- Há componentes de loading.
- Há estados de erro.
- Existem testes de fluxos de aluno, check-in, financeiro e cadastro.
- Existe fluxo de treino offline.

### Pendências

- Os testes E2E não foram executados por ausência do Chromium.
- Responsividade ainda precisa ser validada em navegadores reais.
- Acessibilidade precisa ser confirmada após execução do Playwright.
- O build emite avisos de chunks acima de 500 KB.
- É necessário validar teclado, leitores de tela, foco, contraste e touch em dispositivos reais.

---

## 10. Arquivos e áreas principais envolvidos

### Rotas

- `apps/aluno/src/app/router.tsx`
- `apps/painel/src/app/router.tsx`

### Configuração de mocks

- `apps/aluno/src/shared/config.ts`
- `apps/painel/src/shared/config.ts`

### Persistência simulada

- `packages/mocks/src/db.ts`

### Handlers

- `packages/mocks/src/handlers/*`

### Painel

- `apps/painel/src/features/*`

### Configurações

- `apps/painel/src/features/settings/pages/settings-page.tsx`
- `apps/painel/src/features/settings/pages/brand-page.tsx`
- `apps/painel/src/features/settings/components/brand-editor.tsx`

### Clientes da API

- `apps/aluno/src/shared/api/client.ts`
- `apps/painel/src/shared/api/client.ts`

### Testes

- `apps/aluno/src/**/*.test.tsx`
- `apps/painel/src/**/*.test.tsx`
- `packages/core/src/**/*.test.ts`
- `e2e/**/*.spec.ts`

---

## 11. Plano recomendado por prioridade

### Prioridade crítica

1. Definir backend, banco de dados e modelo multi-tenant.
2. Substituir MSW por API real.
3. Implementar autenticação, sessões, RBAC e autorização server-side.
4. Implementar persistência, migrações, transações e auditoria.
5. Implementar upload seguro de imagens e armazenamento.
6. Garantir isolamento dos dados entre treinadores e alunos.
7. Implementar logs, monitoramento e tratamento de falhas.

### Alta prioridade

1. Finalizar todas as páginas `ComingSoon`.
2. Implementar edição completa de alunos.
3. Implementar exclusão lógica e recuperação de registros.
4. Completar gestão de equipe e convites.
5. Implementar logout real.
6. Criar gerenciamento de páginas, seções e conteúdos.
7. Permitir editar menus, textos, botões, banners e ordenação.
8. Implementar biblioteca de mídia.
9. Adicionar versionamento e publicação de fichas e dietas.
10. Implementar integrações financeiras e notificações reais.
11. Implementar envio real de e-mail, WhatsApp, push ou outro canal definido.

### Média prioridade

1. Melhorar busca, filtros e ordenação avançada.
2. Adicionar paginação server-side.
3. Adicionar histórico de alterações.
4. Melhorar mensagens de erro de contrato/API.
5. Adicionar confirmações para operações destrutivas.
6. Configurar testes E2E no CI.
7. Reduzir tamanho dos bundles.
8. Validar acessibilidade em navegadores reais.
9. Criar testes de integração contra o backend real.
10. Adicionar cenários de concorrência e recuperação de falhas.

### Baixa prioridade

1. Melhorar estados vazios.
2. Refinar textos e mensagens.
3. Criar dashboard configurável.
4. Adicionar relatórios e exportações avançadas.
5. Permitir personalização de temas, fontes e ícones.
6. Adicionar métricas de uso e relatórios operacionais.

---

## 12. Ordem recomendada de execução

### Etapa 1 — Fundação de produção

- Definir stack do backend.
- Definir banco de dados.
- Criar migrações.
- Criar autenticação.
- Criar organizações, usuários, alunos e papéis.
- Implementar autorização server-side.
- Criar ambiente de desenvolvimento, staging e produção.

### Etapa 2 — Migração da API

- Reproduzir os contratos Zod no backend.
- Migrar endpoints de alunos.
- Migrar endpoints de fichas e dietas.
- Migrar check-ins, chat, notificações e financeiro.
- Substituir progressivamente os handlers MSW.
- Manter mocks apenas para testes.

### Etapa 3 — Persistência e arquivos

- Persistir configurações.
- Persistir alterações de treinos e dietas.
- Implementar uploads.
- Implementar mídia e armazenamento.
- Adicionar auditoria.

### Etapa 4 — Completar o painel

- Finalizar equipe.
- Finalizar logout.
- Completar CRUD de alunos.
- Completar CRUD de exercícios.
- Implementar versionamento.
- Implementar publicação.
- Implementar CMS de páginas e seções.

### Etapa 5 — Completar o aplicativo do aluno

- Finalizar dados pessoais.
- Finalizar objetivo e nível.
- Finalizar e-mail e senha.
- Finalizar exportação de dados.
- Criar ajuda.
- Publicar termos e privacidade gerenciáveis.

### Etapa 6 — Homologação

- Instalar browsers do Playwright.
- Executar todos os E2E.
- Validar mobile e desktop.
- Validar acessibilidade.
- Executar testes de segurança.
- Executar testes de carga.
- Validar backup e restauração.
- Validar monitoramento e logs.

---

## Conclusão

O projeto está em estágio avançado de protótipo funcional. As telas e muitos fluxos estão implementados e cobertos por testes, mas a infraestrutura necessária para produção ainda não existe.

A próxima etapa deve ser implementar a fundação de backend, autenticação, persistência e autorização. Depois disso, deve ser construído o CMS administrativo e finalizadas as funcionalidades incompletas.

Nenhuma alteração de código foi feita durante esta auditoria.
