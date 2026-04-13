# Phase 9: Documentação do projeto - Context

**Gathered:** 2026-04-13
**Status:** Ready for planning

<domain>
## Phase Boundary

Criar a documentação principal do projeto: README raiz com visão geral e links de navegação, mais arquivos dedicados em `docs/` cobrindo instalação local detalhada, variáveis de ambiente, arquitetura do sistema, como contribuir e como fazer deploy. Nenhuma nova funcionalidade de jogo — apenas documentação.

</domain>

<decisions>
## Implementation Decisions

### Estrutura de arquivos
- **D-01:** README.md na raiz do projeto — visão geral, badges, links rápidos para as seções de docs
- **D-02:** Pasta `docs/` com arquivos dedicados:
  - `docs/INSTALL.md` — instalação e execução local detalhada
  - `docs/ARCHITECTURE.md` — arquitetura do sistema com diagrama
  - `docs/CONTRIBUTING.md` — como contribuir (setup + convenções)
  - `docs/DEPLOY.md` — guia de deploy Railway+Vercel passo a passo
- **D-03:** `.env.example` já existe e está bem documentado — não duplicar; referenciar a partir da doc de instalação e deploy

### Idioma
- **D-04:** Toda a documentação em **PT-BR** — projeto pessoal entre amigos brasileiros; textos do app já estão em PT-BR

### Instalação e execução local
- **D-05:** Passo a passo **detalhado** — sem assumir conhecimento prévio além de ter um terminal
- **D-06:** Cobrir: requisitos (Node.js versão mínima, npm), clone do repositório, instalação de dependências (`npm install` na raiz), configuração do `.env` (copiar `.env.example` e preencher), execução em modo dev (`npm run dev`), como rodar os testes (`npm run test`), como rodar typecheck (`npm run typecheck`)
- **D-07:** Indicar a versão mínima do Node.js (verificar no `package.json` ou `.nvmrc` — se não tiver, documentar a versão usada em desenvolvimento)
- **D-08:** Descrever os dois servidores que sobem com `npm run dev`: frontend em `localhost:3000`, backend em `localhost:3001`

### Arquitetura do sistema
- **D-09:** Usar **diagrama Mermaid** — o GitHub renderiza nativamente
- **D-10:** O diagrama deve mostrar: Browser ↔ Next.js (frontend) ↔ Express+Socket.IO (backend) ↔ GameState (in-memory Map)
- **D-11:** Complementar o diagrama com descrição textual das camadas: monorepo (`/apps/frontend`, `/apps/backend`, `/packages/shared`), comunicação WebSocket para estado de jogo em tempo real, estado de jogo em memória (sem banco de dados no v1), shared types em `/packages/shared`

### Como contribuir
- **D-12:** Cobrir setup local (mesmas instruções de INSTALL.md — referenciar, não duplicar)
- **D-13:** Documentar convenções já em uso:
  - Padrão de commits: **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.)
  - Hooks: husky + secretlint (roda automaticamente no pre-commit — não usar `--no-verify`)
  - Typecheck antes de abrir PR: `npm run typecheck`
  - Testes antes de abrir PR: `npm run test`
- **D-14:** Fluxo de PR: branch com nome descritivo → PR com descrição do que muda → todos os checks passando antes de merge

### Deploy (Railway + Vercel)
- **D-15:** Guia passo a passo — **backend primeiro, depois frontend** (o frontend precisa da URL do backend)
- **D-16:** Backend (Railway):
  1. Criar projeto no Railway e conectar ao GitHub repo
  2. Selecionar o diretório `/apps/backend` ou apontar para `railway.json` na raiz
  3. Configurar env var `FRONTEND_URL` (URL da Vercel — pode ser configurada depois ou usar wildcard)
  4. Railway injeta `PORT` automaticamente — não definir manualmente
  5. O deploy roda `npm install && npm run build` (conforme `railway.json`) e sobe com `node dist/index.js`
  6. Copiar a URL pública gerada pelo Railway (formato `https://xxx.up.railway.app`)
- **D-17:** Frontend (Vercel):
  1. Criar projeto na Vercel e conectar ao GitHub repo
  2. Configurar env var `NEXT_PUBLIC_BACKEND_URL` com a URL do Railway obtida no passo anterior
  3. Vercel detecta Next.js automaticamente — zero config
  4. Auto-deploy em push para `main`
  5. Copiar a URL pública da Vercel e atualizar `FRONTEND_URL` no Railway se necessário
- **D-18:** Alertar que `NEXT_PUBLIC_*` é embeddada no build — mudar o valor na Vercel requer um novo deploy (Redeploy)
- **D-19:** Referenciar `.env.example` para descrição completa de cada variável

### Claude's Discretion
- Badges a incluir no README (CI, licença, etc.) — usar os mais relevantes sem exagero
- Ordem exata das seções dentro de cada arquivo de docs
- Formatação dos blocos de código (linguagem nos code fences)

</decisions>

<specifics>
## Specific Ideas

- O `.env.example` já tem comentários explicativos detalhados — a doc deve apontar para ele, não repetir o conteúdo
- O `railway.json` já existe em `apps/backend/` com build e start commands — referenciar no guia de deploy
- O script `npm run dev` já sobe frontend e backend concorrentemente via `concurrently` — documentar isso explicitamente para evitar confusão de "preciso abrir dois terminais?"
- A ordem de deploy importa: Railway → pegar URL → Vercel com a URL → atualizar FRONTEND_URL no Railway se necessário

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Configuração do projeto
- `package.json` — scripts disponíveis (`dev`, `build`, `test`, `typecheck`, `scan:secrets`), workspaces, dependências de dev
- `.env.example` — todas as variáveis de ambiente com descrição (FRONTEND_URL, NEXT_PUBLIC_BACKEND_URL, NODE_ENV)
- `apps/backend/railway.json` — configuração de build e deploy do Railway

### Estrutura do monorepo
- `apps/frontend/package.json` — scripts do frontend, porta de dev
- `apps/backend/package.json` — scripts do backend, porta de dev
- `packages/shared/src/index.ts` — tipos compartilhados (referência para descrever a camada shared)

### Fases anteriores (contexto de decisões)
- `.planning/phases/07-ux-polish-and-deployment/07-CONTEXT.md` — decisões de deploy (Vercel+Railway), env vars, scripts de build

</canonical_refs>

<code_context>
## Existing Code Insights

### Ativos existentes relevantes para a documentação
- `.env.example` na raiz: já documentado com instruções em PT-BR e placeholders claros
- `apps/backend/railway.json`: define `buildCommand` e `startCommand` — confirma o fluxo de deploy
- `package.json` raiz: script `dev` usa `concurrently` para subir frontend + backend juntos
- Scripts relevantes: `dev`, `build`, `test`, `typecheck`, `scan:secrets`, `prepare` (husky)

### Padrões estabelecidos
- Commits: Conventional Commits (configurado via CLAUDE.md e husky)
- Hooks: husky + secretlint no pre-commit
- TypeScript em todo o projeto — typecheck obrigatório

### Pontos de integração (o que a doc deve cobrir)
- Frontend roda em `localhost:3000`, backend em `localhost:3001`
- Frontend se conecta ao backend via `NEXT_PUBLIC_BACKEND_URL` (env var)
- Estado de jogo 100% em memória — sem banco de dados para configurar

</code_context>

<deferred>
## Deferred Ideas

- Nenhuma ideia de escopo fora desta fase surgiu durante a discussão

</deferred>

---

*Phase: 09-documenta-o-do-projeto-readme-principal-com-vis-o-geral-inst*
*Context gathered: 2026-04-13*
