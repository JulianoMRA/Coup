# Phase 1: Foundation - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Estabelecer a infraestrutura base do projeto: monorepo com dois serviços (Next.js frontend + Express/Socket.IO backend), sessão de jogador persistida via UUID no localStorage, conexão WebSocket confirmada no UI, e a função `projectStateForPlayer()` implementada e testada em isolamento antes de qualquer broadcast. CI configurado no GitHub Actions. Nenhuma lógica de jogo nesta fase.

</domain>

<decisions>
## Implementation Decisions

### Estrutura do Monorepo
- **D-01:** npm workspaces simples — sem Turborepo ou ferramentas de build extras
- **D-02:** Estrutura: `apps/frontend` (Next.js), `apps/backend` (Express + Socket.IO), `packages/shared` (tipos TypeScript)
- **D-03:** `packages/shared` contém **apenas tipos TypeScript** (interfaces, enums, tipos do GameState) — sem dependências, sem lógica compartilhada

### Dev Runner
- **D-04:** `concurrently` instalado na raiz — `npm run dev` na raiz inicia os dois serviços simultaneamente

### Indicador de Conexão WebSocket
- **D-05:** Badge discreto no canto da página (ponto verde/vermelho) indicando status da conexão — visível durante desenvolvimento, pode ser removido ou refinado na Fase 7

### CI / GitHub Actions
- **D-06:** CI roda `tsc --noEmit` (typecheck em todos os pacotes) + `vitest` (testes unitários)
- **D-07:** CI dispara em push para `main` apenas

### Claude's Discretion
- Configuração exata do tsconfig (paths, strictness) desde que seja `strict: true`
- Estrutura interna de arquivos dentro de cada `apps/` (ex: pastas routes/, lib/, etc.)
- Escolha da porta padrão de cada serviço (ex: frontend :3000, backend :3001)
- Implementação interna do `projectStateForPlayer()` — apenas a assinatura e comportamento são fixos

</decisions>

<specifics>
## Specific Ideas

- O critério de sucesso exige que `projectStateForPlayer(gameState, playerId)` strip hidden cards de outros jogadores e passe testes unitários **antes** de qualquer lógica de broadcast ser escrita
- A confirmação de WebSocket no UI pode ser um simples ping/pong — o que importa é que a conexão seja visível para verificar que os dois serviços estão se comunicando

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos do projeto
- `.planning/REQUIREMENTS.md` — Requisitos ROOM-04, INIT-03, SYNC-01, SYNC-02 que esta fase deve cobrir
- `.planning/PROJECT.md` — Contexto geral, stack decidida, decisões de arquitetura

### Roadmap e sucesso
- `.planning/ROADMAP.md` §Phase 1 — Goal, success criteria e dependências da fase

### Pesquisa de domínio
- `.planning/research/STACK.md` — Stack recomendada com versões (Socket.IO, Express, Vitest, etc.)
- `.planning/research/ARCHITECTURE.md` — Padrão server-autoritativo, `projectStateForPlayer()`, UUID session model
- `.planning/research/PITFALLS.md` — Armadilhas específicas: usar socket.id como identidade do jogador (errado), information leakage

No external ADRs or design specs — decisions fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Nenhum — projeto greenfield

### Established Patterns
- Nenhum — esta é a fase que estabelece os padrões

### Integration Points
- Esta fase é a base; todas as fases futuras dependem da estrutura de monorepo e dos tipos em `packages/shared`

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-01*
