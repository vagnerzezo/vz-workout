# vz-workout

Plataforma de consultoria online de treino e dieta, com dois apps web:

- **App do aluno** (`apps/aluno`): PWA que o aluno instala no celular para seguir o treino e a dieta do dia, mandar check-ins e falar com o personal.
- **Painel do personal** (`apps/painel`): onde o personal cadastra alunos, monta fichas de treino e dieta, revisa check-ins, conversa com os alunos e acompanha o financeiro.

A API real ainda não existe. Por enquanto, os dois apps usam uma **API simulada com [MSW](https://mswjs.io)** (`packages/mocks`), que roda tanto no dev quanto no site publicado.

## Stack

- React 19, Vite, TypeScript
- React Router, TanStack Query, Zustand, React Hook Form + Zod
- Tailwind CSS 4 + shadcn/ui (Base UI)
- MSW para a API simulada
- Vitest + Testing Library
- pnpm workspaces + Turborepo
- Deploy na Vercel

## Estrutura

```
apps/
  aluno/      App do aluno (PWA). Porta 5173
  painel/     Painel do personal. Porta 5174
packages/
  core/       Tipos, schemas Zod e regras de negócio compartilhadas (treino, dieta, check-in, pagamento…)
  mocks/      API simulada: handlers MSW, fixtures e estado em memória
  ui/         Componentes shadcn/ui, blocos compartilhados e estilos globais
```

Dentro de cada app, o código fica separado por funcionalidade em `src/features/*`, com o que é comum em `src/shared/*` e a montagem do app (rotas, providers, layout) em `src/app/*`.

## Funcionalidades

**App do aluno**

- Login, recuperar senha e primeiro acesso por convite
- Home, treino do dia (com registro das séries) e dieta do dia
- Detalhe da refeição e lista de compras
- Perfil, progresso (peso e fotos) e check-in
- Chat com o personal e notificações
- Pagamento da renovação via Pix e bloqueio de acesso pausado
- Configurações e instalação como PWA

**Painel do personal**

- Dashboard e lista de alunos
- Perfil do aluno (resumo, treino, dieta, histórico, avaliação, check-ins)
- Cadastro de aluno com convite de primeiro acesso e QR Code
- Fichas de treino e editor (fases, séries, volume)
- Fichas de dieta e editor (metas, refeições em gramas, substituições)
- Fila de check-ins com revisão em sequência
- Chat (conversas, transmissão, notas privadas)
- Notificações (automações, histórico, agendamento)
- Financeiro (recebimentos, comprovantes, cobrança Pix, planos)
- Biblioteca (exercícios, alimentos, materiais) e configurações da marca

## Como rodar

Requisitos: Node.js `>= 20.19` e pnpm 11.

```bash
pnpm install
pnpm dev
```

Isso sobe os dois apps juntos:

- Aluno: http://localhost:5173
- Painel: http://localhost:5174

Para rodar só um deles:

```bash
pnpm --filter aluno dev
pnpm --filter painel dev
```

### Acesso de teste (API simulada)

Os dados são fictícios e voltam ao estado inicial quando a página recarrega.

| O quê | Valor |
| --- | --- |
| Login do aluno | celular `(51) 99734-2201` ou e-mail `renato@email.com` |
| Senha | `Treino2026` |
| Código de recuperação de senha | `482913` |
| Convite de primeiro acesso | `/primeiro-acesso/K7M-2QX` |

## Scripts

Na raiz (rodam em todos os pacotes via Turborepo):

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Sobe os apps em modo desenvolvimento |
| `pnpm build` | Gera o build de produção (`dist/`) |
| `pnpm lint` | Roda o ESLint |
| `pnpm typecheck` | Checa os tipos com o TypeScript |
| `pnpm format` | Formata o código com o Prettier |

Testes (por pacote):

```bash
pnpm --filter aluno test
pnpm --filter painel test
pnpm --filter @workspace/core test
```

## API simulada e variáveis de ambiente

A API simulada fica ligada sempre no dev e, por padrão, também no build publicado. Quando a API real existir, desligue no ambiente de produção:

```
VITE_USE_MOCKS=false
```

No app do aluno, o service worker do PWA só é registrado quando a API simulada está desligada, porque o service worker do MSW precisa ficar com as requisições `/api`.

## Componentes de UI

Os componentes shadcn/ui ficam em `packages/ui`. Para adicionar um novo:

```bash
pnpm dlx shadcn@latest add <componente> -c apps/painel
```

O componente vai para `packages/ui/src/components` e é importado assim:

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Deploy

Cada app é publicado como um projeto separado na Vercel, com o diretório raiz apontando para `apps/aluno` ou `apps/painel`. O `vercel.json` de cada um redireciona todas as rotas para o `index.html`, para que os links diretos funcionem.
