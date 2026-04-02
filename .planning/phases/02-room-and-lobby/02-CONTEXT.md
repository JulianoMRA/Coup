# Phase 2: Room and Lobby - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementar o fluxo completo de criação e entrada em sala: host cria sala via POST → recebe link → redireciona para `/room/[roomId]`; outros jogadores entram pelo link digitando apenas um nome; lobby exibe todos presentes com status de prontidão; host inicia o jogo quando todos estão prontos. Nenhuma lógica de jogo nesta fase — apenas o pré-jogo.

</domain>

<decisions>
## Implementation Decisions

### Room URL Structure
- URL: rota dinâmica Next.js `/room/[roomId]` — URL limpa e fácil de compartilhar
- Room ID: 8 caracteres alfanuméricos aleatórios (ex: `a3f9xk2m`) — curto e URL-safe
- Fluxo de criação: botão na homepage → HTTP POST `/api/rooms` no backend → redirect para `/room/[id]`
- Estado do servidor: `Map<roomId, Room>` em memória — consistente com a abordagem do GameState (sem banco de dados no v1)

### Lobby UI Layout
- Lista de jogadores: círculo com inicial do nome + nome + indicador de prontidão — minimal, alinhado ao estilo simples do jogo
- Ready check: botão "Estou Pronto!" por jogador que fica verde ao clicar (toggle)
- Botão Iniciar: visível para o host, desativado (cinza) até todos estarem prontos
- Link de convite: botão "Copiar link" que copia para o clipboard + feedback "Copiado!" por 2s

### Username Entry
- Entrada do nome: formulário inline na página `/room/[id]` quando o jogador ainda não tem nome — sem modal
- Validação: 1–16 caracteres, letras/números/espaços/hífens permitidos
- Persistência: nome salvo no localStorage (`coup_player_name`) — reaproveitado em sessões futuras
- Host: digita o nome antes de a sala ser criada (mesma tela home, texto diferente)

### Backend Room Management
- Criação: HTTP POST `/api/rooms` — retorna `{ roomId }`, frontend redireciona
- Limpeza: sala persiste após o jogo terminar (necessário para rematch na Fase 6)
- Host: criador da sala é sempre o host (quem faz o POST)
- Sala cheia: rejeição hard (HTTP 409 / Socket error) — máximo 6 jogadores per ROOM-03

### Claude's Discretion
- Estrutura interna dos arquivos de componentes (hooks, components, pages)
- Estilo visual exato dos componentes (cores, espaçamento) — refinamento na Fase 7
- Formato exato dos eventos Socket.IO para join/ready/start
- Implementação interna do Room state object (campos além de roomId, players, host, status)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/frontend/src/lib/session.ts` — `getOrCreatePlayerId()` retorna UUID do localStorage; reusável direto
- `apps/frontend/src/lib/socket.ts` — singleton Socket.IO client já configurado com `playerId` no auth
- `apps/frontend/src/hooks/use-socket.ts` — hook de conexão WebSocket pronto para extensão com novos eventos
- `apps/backend/src/socket-handler.ts` — handler base com `playerId` já validado no connect; estender com eventos de sala
- `packages/shared/src/types/events.ts` — `ServerToClientEvents` e `ClientToServerEvents` a estender com eventos de lobby

### Established Patterns
- Tipos Socket.IO definidos em `packages/shared` — novos eventos de sala vão aqui
- Backend usa `registerSocketHandlers(io)` como ponto de entrada — estender ou dividir por módulo
- Frontend usa `use client` + hooks para estado reativo
- Tailwind v4 (CSS-first, sem tailwind.config) para estilização

### Integration Points
- `apps/frontend/src/app/page.tsx` — página home atual; adicionar formulário de criação/entrada
- Nova rota: `apps/frontend/src/app/room/[roomId]/page.tsx`
- `apps/backend/src/index.ts` — adicionar rota HTTP POST `/api/rooms`
- `packages/shared/src/types/events.ts` — adicionar eventos ROOM_JOINED, LOBBY_UPDATE, GAME_STARTED, etc.

</code_context>

<specifics>
## Specific Ideas

- O link de convite é a feature central desta fase — deve ser fácil de copiar e visualmente destacado no lobby
- A confirmação "Copiado!" no botão de link é um detalhe de UX importante para feedback imediato
- O host vê o botão "Iniciar Jogo" desde o início (desativado), não apenas quando todos estão prontos — isso deixa claro que ele é o host

</specifics>

<deferred>
## Deferred Ideas

- QR code para o link de convite — interessante mas overkill para uso entre amigos (fase 7 se necessário)
- Transferência de host — não necessário para v1; host é sempre o criador
- Espectadores além de 6 jogadores — fora do escopo per ROOM-03

</deferred>
