# Coup Online

## What This Is

Plataforma web para jogar o jogo de cartas Coup online com amigos. Um jogador cria uma sala e compartilha o link de convite; os demais entram e jogam uma partida completa em tempo real. O foco é uso pessoal — não é um serviço público.

## Core Value

Amigos conseguem jogar Coup online de forma simples: cria sala, compartilha link, joga.

## Requirements

### Validated

- [x] Monorepo npm workspaces with Next.js frontend + Express/Socket.IO backend running locally — *Validated in Phase 1: Foundation*
- [x] UUID session token persists across page refresh (localStorage `coup_player_id`) — *Validated in Phase 1: Foundation*
- [x] WebSocket connection established; badge shows Conectado/Desconectado — *Validated in Phase 1: Foundation*
- [x] `projectStateForPlayer()` pure function exists with 6 unit tests — *Validated in Phase 1: Foundation*
- [x] CI runs `npm run test` on push to main (all 10 tests pass) — *Validated in Phase 1: Foundation*

### Active

- [ ] Criação de sala com link de convite compartilhável
- [ ] Entrada na sala via link sem necessidade de cadastro complexo
- [ ] Partida completa do Coup base (Duke, Assassin, Captain, Ambassador, Contessa)
- [ ] Comunicação em tempo real via WebSocket (ações visíveis instantaneamente para todos)
- [ ] Interface simples e funcional: cartas, botões de ação, log de jogadas
- [ ] Fluxo completo de jogo: turnos, ações, blefe, contestação, eliminação e vitória
- [ ] Suporte para 2–6 jogadores por sala

### Out of Scope

- Expansões (Reformation, Anarchy, Inquisitor) — v1 apenas com jogo base; podem ser adicionadas futuramente
- Matchmaking público — plataforma privada para uso entre amigos
- Sistema de contas completo (perfis, histórico, ranking) — fora do escopo do v1
- Aplicativo mobile nativo — web responsivo é suficiente

## Context

- O Coup é um jogo de blefe e dedução social para 2–6 jogadores. Cada jogador começa com 2 cartas de influência (ocultas) e 2 moedas. O objetivo é eliminar as influências dos adversários. A mecânica central é que qualquer ação pode ser bloqueada ou contestada — e blefar sobre qual carta você tem é fundamental.
- Uso restrito a um grupo pequeno de amigos; não precisa escalar para milhares de usuários.
- Stack prevista: React/Next.js no frontend, Node.js no backend, WebSocket para tempo real.

## Constraints

- **Escopo**: Apenas Coup base no v1 — manter implementação simples e funcional
- **Usuários**: Pequeno grupo fixo; não projetar para escala pública
- **Stack**: React/Next.js + TypeScript (frontend), Node.js + TypeScript (backend)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Link de convite sem cadastro obrigatório | Reduz fricção para amigos entrarem rapidamente | — Pending |
| WebSocket para tempo real | Jogo interativo exige sincronização instantânea entre jogadores | — Pending |
| Apenas Coup base no v1 | Entregar algo jogável primeiro; expansões depois | — Pending |

## Evolution

Este documento evolui a cada transição de fase e marco de milestone.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after Phase 1 completion*
