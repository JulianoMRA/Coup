# Phase 2: Room and Lobby - Research

**Researched:** 2026-04-02
**Domain:** Socket.IO room management, Next.js dynamic routes, Express REST + WebSocket, shadcn/ui
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Room URL**: Dynamic route `/room/[roomId]` — URL limpa e fácil de compartilhar
- **Room ID**: 8 caracteres alfanuméricos aleatórios (ex: `a3f9xk2m`) — curto e URL-safe
- **Creation flow**: Botão na homepage → HTTP POST `/api/rooms` no backend → redirect para `/room/[id]`
- **Server state**: `Map<roomId, Room>` em memória — consistente com a abordagem do GameState (sem banco de dados no v1)
- **Player list UI**: Círculo com inicial do nome + nome + indicador de prontidão — minimal
- **Ready check**: Botão "Estou Pronto!" por jogador que fica verde ao clicar (toggle)
- **Start button**: Visível para o host, desativado (cinza) até todos estarem prontos
- **Invite link**: Botão "Copiar link" que copia para o clipboard + feedback "Copiado!" por 2s
- **Username entry**: Formulário inline na página `/room/[id]` — sem modal
- **Validation**: 1–16 caracteres, letras/números/espaços/hífens permitidos
- **Persistence**: Nome salvo no localStorage (`coup_player_name`) — reaproveitado em sessões futuras
- **Host username**: Digitado antes da criação da sala (mesma tela home)
- **Creation**: HTTP POST `/api/rooms` — retorna `{ roomId }`, frontend redireciona
- **Room cleanup**: Sala persiste após o jogo terminar (necessário para rematch na Fase 6)
- **Host identity**: Criador da sala é sempre o host (quem faz o POST)
- **Room full**: Rejeição hard (HTTP 409 / Socket error) — máximo 6 jogadores per ROOM-03

### Claude's Discretion

- Estrutura interna dos arquivos de componentes (hooks, components, pages)
- Estilo visual exato dos componentes (cores, espaçamento) — refinamento na Fase 7
- Formato exato dos eventos Socket.IO para join/ready/start
- Implementação interna do Room state object (campos além de roomId, players, host, status)

### Deferred Ideas (OUT OF SCOPE)

- QR code para o link de convite — interessante mas overkill para uso entre amigos (fase 7 se necessário)
- Transferência de host — não necessário para v1; host é sempre o criador
- Espectadores além de 6 jogadores — fora do escopo per ROOM-03

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROOM-01 | Jogador pode criar uma sala e receber um link de convite compartilhável | POST /api/rooms pattern, 8-char ID generation with `nanoid`, clipboard API |
| ROOM-02 | Jogador pode entrar na sala via link sem cadastro (apenas digita um nome) | Inline username form on `/room/[roomId]`, localStorage `coup_player_name`, JOIN_ROOM socket event |
| ROOM-03 | Sala suporta de 2 a 6 jogadores | Room model `maxPlayers: 6`, HTTP 409 + socket ERROR on overflow, start guard `players.length >= 2` |
| ROOM-05 | Lobby exibe todos os jogadores presentes com botão "Pronto" | LOBBY_UPDATE broadcast on join/ready toggle, `LobbyPlayer` type with `isReady`, shadcn Badge component |
| ROOM-06 | Criador da sala inicia o jogo quando todos estão prontos | START_GAME socket event, server guard `all players ready && count >= 2`, phase transition to AWAITING_ACTION |

</phase_requirements>

---

## Summary

Phase 2 builds the complete pre-game flow on top of the Phase 1 foundation (Socket.IO singleton, UUID session, shared types). The work divides naturally into three layers: (1) a new HTTP endpoint on Express for room creation, (2) Socket.IO events for lobby lifecycle (join, ready toggle, start), and (3) two Next.js pages (`/` reworked, `/room/[roomId]` new) that consume those events.

The most important architectural insight is that the `Room` type must be separate from `GameState`. `GameState` (already defined in Phase 1) is used once the game starts; `Room` is the pre-game container. The lobby state — player names, ready flags, host identity — lives in a `Map<string, Room>` on the backend and is broadcast as a `LobbyState` payload via `LOBBY_UPDATE` events. This mirrors the existing `STATE_UPDATE` / `ClientGameState` pattern exactly.

The frontend routing decision is straightforward: `/room/[roomId]/page.tsx` must be a `'use client'` component (no SSR) because it depends on `localStorage` (for `coup_player_name`), the Socket.IO singleton, and live WebSocket state. `useRouter` from `next/navigation` handles the redirect after `POST /api/rooms` succeeds.

**Primary recommendation:** Keep the lobby data model minimal — `Room` holds `roomId`, `players: LobbyPlayer[]`, `hostId`, `status: 'LOBBY' | 'IN_GAME'`, `maxPlayers: 6`. The `LobbyPlayer` type holds `playerId`, `name`, `isReady`, `joinOrder`. Everything else is derived at read time.

---

## Standard Stack

### Core (all already installed — no new dependencies required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | ^5.2.1 | HTTP POST /api/rooms | Already in backend — add `express.json()` middleware and route |
| socket.io | ^4.8.3 | Room lifecycle events | Already in backend — extend `registerSocketHandlers` |
| socket.io-client | ^4.8.3 | Frontend WebSocket | Already in frontend singleton |
| next | ^16.2.2 | `/room/[roomId]` dynamic route | Already installed |
| nanoid | 5.1.7 | 8-char room ID generation | Already in npm registry; URL-safe alphabet, cryptographically random; already cached in local npm |
| uuid | ^13.0.0 | Player UUID (session) | Already installed (used in `session.ts`) |
| @coup/shared | * | Shared types — extend events.ts | Already linked via workspace |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn Button / Input / Card / Badge | via npx shadcn add | Lobby UI components | Must install before building UI (no `/components/ui/` dir yet) |
| clsx + tailwind-merge | 2.1.1 / 3.5.0 | `cn()` utility for shadcn | Required by shadcn; install with `npx shadcn add` (auto-added) |
| class-variance-authority | 0.7.1 | shadcn variant API | Auto-installed by shadcn |
| @radix-ui/react-slot | 1.2.4 | shadcn Slot primitive | Auto-installed by shadcn |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nanoid | `crypto.randomBytes` + manual encoding | More code, same result — nanoid is cleaner and already cached |
| nanoid | `uuid` v4 sliced to 8 chars | UUID entropy wasted; nanoid designed for short IDs |
| `Map<roomId, Room>` in module scope | Redis / SQLite | Overkill for v1; in-memory is the locked decision |

**Installation — new packages needed:**

```bash
# In apps/frontend — install shadcn components (adds Button, Input, Card, Badge + their deps)
npx shadcn add button input card badge

# nanoid is NOT yet in frontend package.json — add it
# (backend already has it as a dependency via uuid; add to frontend too for type safety)
# Actually: nanoid is used ONLY on the backend (room ID generation). No frontend install needed.
```

**Backend only — nanoid already available via npm but not yet in package.json:**

```bash
cd apps/backend && npm install nanoid
```

**Version verification (confirmed 2026-04-02):**
- nanoid: 5.1.7 (npm registry)
- socket.io: 4.8.3 (npm registry)
- express: 5.2.1 (npm registry)

---

## Architecture Patterns

### Recommended Project Structure

```
apps/backend/src/
├── game/
│   └── project-state.ts       # existing — Phase 1
├── rooms/
│   └── room-store.ts          # NEW — Map<roomId, Room> + operations
├── socket-handler.ts          # extend with room socket events
└── index.ts                   # add express.json() + POST /api/rooms route

apps/frontend/src/
├── app/
│   ├── page.tsx               # rework: add username input + "Criar Sala" button
│   └── room/
│       └── [roomId]/
│           └── page.tsx       # NEW — lobby page
├── components/
│   ├── connection-badge.tsx   # existing
│   └── ui/                    # NEW — shadcn components (auto-generated)
├── hooks/
│   ├── use-socket.ts          # existing — extend with useLobby hook
│   └── use-lobby.ts           # NEW — lobby state via socket events
└── lib/
    ├── session.ts             # existing
    └── socket.ts              # existing

packages/shared/src/types/
├── events.ts                  # extend: add room events
├── game-state.ts              # existing
└── lobby.ts                   # NEW — LobbyPlayer, LobbyState, Room types
```

### Pattern 1: Room Data Model (Backend)

**What:** A `Room` object stores pre-game state. Separate from `GameState` (which is Phase 3+).
**When to use:** From POST /api/rooms creation until START_GAME transitions it to a `GameState`.

```typescript
// packages/shared/src/types/lobby.ts
export interface LobbyPlayer {
  playerId: string
  name: string
  isReady: boolean
  joinOrder: number
}

export interface LobbyState {
  roomId: string
  players: LobbyPlayer[]
  hostId: string
  maxPlayers: number
  status: "LOBBY" | "IN_GAME"
}

// apps/backend/src/rooms/room-store.ts
import { LobbyState, LobbyPlayer } from "@coup/shared"

export interface Room extends LobbyState {
  // backend-only: nothing extra needed for Phase 2
}

const rooms = new Map<string, Room>()

export { rooms }
```

### Pattern 2: 8-Char Room ID Generation

**What:** Use `nanoid` with custom alphabet (alphanumeric lowercase only) for URL-safe, short IDs.
**When to use:** On POST /api/rooms — generate, verify no collision, insert.

```typescript
// Source: nanoid official docs — customAlphabet API
import { customAlphabet } from "nanoid"

const generateRoomId = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  8
)

// Collision guard (extremely rare with 36^8 = 2.8T combinations)
function createUniqueRoomId(): string {
  let id: string
  do {
    id = generateRoomId()
  } while (rooms.has(id))
  return id
}
```

### Pattern 3: Express Route Integration

**What:** Add `express.json()` middleware and `POST /api/rooms` before `httpServer.listen`.
**When to use:** In `apps/backend/src/index.ts` — minimal addition to existing server.

```typescript
// apps/backend/src/index.ts — additions
import express from "express"
import { createRoom } from "./rooms/room-store"

app.use(express.json())

app.post("/api/rooms", (req, res) => {
  const { hostId, hostName } = req.body as { hostId: string; hostName: string }
  if (!hostId || !hostName) {
    return res.status(400).json({ error: "hostId and hostName required" })
  }
  const room = createRoom(hostId, hostName)
  res.status(201).json({ roomId: room.roomId })
})
```

### Pattern 4: Socket.IO Room Events

**What:** Five new events covering the full lobby lifecycle. Socket.IO `.join(roomId)` is used to scope broadcasts.
**When to use:** Extend `registerSocketHandlers` in `socket-handler.ts` — or split into `registerRoomHandlers(io)`.

**Shared types (`packages/shared/src/types/events.ts` additions):**

```typescript
import type { LobbyState } from "./lobby"

export interface ServerToClientEvents {
  STATE_UPDATE: (state: ClientGameState) => void
  PONG: () => void
  ERROR: (message: string) => void
  // Phase 2 additions:
  LOBBY_UPDATE: (state: LobbyState) => void
  GAME_STARTED: (roomId: string) => void
}

export interface ClientToServerEvents {
  PING: () => void
  // Phase 2 additions:
  JOIN_ROOM: (roomId: string, name: string) => void
  LEAVE_ROOM: (roomId: string) => void
  SET_READY: (roomId: string, isReady: boolean) => void
  START_GAME: (roomId: string) => void
}
```

**Server-side handler pattern:**

```typescript
// JOIN_ROOM handler
socket.on("JOIN_ROOM", (roomId, name) => {
  const room = rooms.get(roomId)
  if (!room) { socket.emit("ERROR", "Room not found"); return }
  if (room.players.length >= room.maxPlayers) { socket.emit("ERROR", "Room full"); return }
  if (room.status !== "LOBBY") { socket.emit("ERROR", "Game already started"); return }

  const alreadyJoined = room.players.find(p => p.playerId === playerId)
  if (!alreadyJoined) {
    room.players.push({ playerId, name, isReady: false, joinOrder: room.players.length })
  }
  socket.join(roomId)
  io.to(roomId).emit("LOBBY_UPDATE", toLobbyState(room))
})

// START_GAME handler
socket.on("START_GAME", (roomId) => {
  const room = rooms.get(roomId)
  if (!room) { socket.emit("ERROR", "Room not found"); return }
  if (room.hostId !== playerId) { socket.emit("ERROR", "Only host can start"); return }
  if (room.players.length < 2) { socket.emit("ERROR", "Need at least 2 players"); return }
  if (!room.players.every(p => p.isReady)) { socket.emit("ERROR", "Not all ready"); return }

  room.status = "IN_GAME"
  io.to(roomId).emit("GAME_STARTED", roomId)
})
```

### Pattern 5: Next.js Dynamic Route — `use client` Only

**What:** `/room/[roomId]/page.tsx` must be a Client Component. Cannot use RSC here.
**Why:** Depends on `localStorage` (for `coup_player_name`), Socket.IO singleton (module-level), and `useState`/`useEffect` for live updates.
**Pattern:**

```typescript
// apps/frontend/src/app/room/[roomId]/page.tsx
"use client"

import { use } from "react"

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  // ... rest of component
}
```

Note: In Next.js 15+, `params` is a Promise and must be unwrapped with `use()` in Client Components or `await` in Server Components. Since `page.tsx` here is `'use client'`, use `React.use(params)`.

### Pattern 6: `useLobby` Hook

**What:** Encapsulates all Socket.IO room event logic for the lobby page.
**When to use:** In `/room/[roomId]/page.tsx` — keeps the page component clean.

```typescript
// apps/frontend/src/hooks/use-lobby.ts
"use client"

import { useState, useEffect } from "react"
import { socket } from "@/lib/socket"
import type { LobbyState } from "@coup/shared"

export function useLobby(roomId: string, playerId: string, playerName: string | null) {
  const [lobby, setLobby] = useState<LobbyState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!playerName) return  // wait for name entry

    socket.emit("JOIN_ROOM", roomId, playerName)

    socket.on("LOBBY_UPDATE", setLobby)
    socket.on("ERROR", setError)

    return () => {
      socket.off("LOBBY_UPDATE", setLobby)
      socket.off("ERROR", setError)
      socket.emit("LEAVE_ROOM", roomId)
    }
  }, [roomId, playerName, playerId])

  return { lobby, error }
}
```

### Pattern 7: Clipboard API for Invite Link

**What:** `navigator.clipboard.writeText()` with 2s feedback timeout.
**Fallback:** When clipboard API is unavailable (HTTP / older browsers), show selectable text.

```typescript
const [copied, setCopied] = useState(false)

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  } catch {
    // fallback: set a flag to show selectable text
    setShowFallback(true)
  }
}
```

### Anti-Patterns to Avoid

- **Putting lobby logic in GameState**: `GameState` is for in-game state (Phase 3+). Phase 2 uses a separate `Room`/`LobbyState` type. Mixing them breaks the Phase 3 transition.
- **SSR for the lobby page**: `localStorage`, Socket.IO, and live state require `use client`. RSC cannot access browser APIs.
- **Broadcasting per-player views for lobby**: Unlike `STATE_UPDATE` (which requires per-player projection to hide cards), `LOBBY_UPDATE` is safe to broadcast to all in the room — no private data in `LobbyState`.
- **Forgetting `socket.join(roomId)` on JOIN_ROOM**: Without this, `io.to(roomId).emit()` won't reach the joining client.
- **Re-emitting JOIN_ROOM on socket reconnect without guard**: The `alreadyJoined` check in the handler prevents duplicate player entries on reconnect within the same session.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Short random ID generation | Manual `Math.random()` + base conversion | `nanoid` with `customAlphabet` | Handles uniform distribution, URL-safe alphabet, cryptographic randomness |
| Scoped socket broadcasts | Manual player ID tracking + loop | `socket.join(roomId)` + `io.to(roomId).emit()` | Built-in Socket.IO room scoping; handles reconnects transparently |
| Clipboard write with fallback | Manual `document.execCommand('copy')` | `navigator.clipboard.writeText()` with try/catch | Modern API; graceful degradation pattern is 3 lines |
| UI components | Custom Button/Input/Card/Badge from scratch | `npx shadcn add button input card badge` | Already set up in project; design system already defined in globals.css |

**Key insight:** Socket.IO's built-in room system (`socket.join` / `io.to`) is the correct primitive for scoping lobby broadcasts. The backend should never manually track which socket IDs belong to a room — Socket.IO does this reliably across reconnects.

---

## Common Pitfalls

### Pitfall 1: `params` is a Promise in Next.js 15+

**What goes wrong:** Accessing `params.roomId` directly in a page component throws a runtime error or type error.
**Why it happens:** Next.js 15 changed `params` to be a `Promise<{...}>` in both Server and Client Components.
**How to avoid:** In `'use client'` pages, unwrap with `const { roomId } = use(params)` (React `use` hook). In Server Components, use `await params`.
**Warning signs:** TypeScript error "Property 'roomId' does not exist on type 'Promise<...>'"

### Pitfall 2: shadcn requires `src/lib/utils.ts` with `cn()` before components work

**What goes wrong:** `npx shadcn add button` fails or generates broken imports if `src/lib/utils.ts` doesn't exist with the `cn` utility.
**Why it happens:** shadcn components import `cn` from `@/lib/utils`. The file doesn't exist yet in this project (confirmed: `NOT FOUND`).
**How to avoid:** Run `npx shadcn add` from `apps/frontend/` — it auto-creates `src/lib/utils.ts`. Alternatively, create it manually first:

```typescript
// apps/frontend/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Then install peer deps: `npm install clsx tailwind-merge` in `apps/frontend`.

### Pitfall 3: Socket.IO `JOIN_ROOM` fires before socket is connected

**What goes wrong:** The lobby page mounts, calls `socket.emit("JOIN_ROOM", ...)`, but the socket hasn't connected yet — the event is silently dropped.
**Why it happens:** `socket.ts` uses `autoConnect: false`; `useSocketStatus` calls `socket.connect()` in `useEffect`, which is async.
**How to avoid:** In `useLobby`, guard the emit inside a `socket.on("connect", ...)` handler, or check `socket.connected` before emitting. Better: use Socket.IO's built-in `socket.volatile` or queue pattern.

```typescript
// Reliable pattern: emit on connect if not yet connected
useEffect(() => {
  function joinWhenReady() {
    socket.emit("JOIN_ROOM", roomId, playerName)
  }
  if (socket.connected) {
    joinWhenReady()
  } else {
    socket.once("connect", joinWhenReady)
  }
  // ...
}, [roomId, playerName])
```

### Pitfall 4: `nanoid` ESM-only in Node.js CommonJS context

**What goes wrong:** `import { nanoid } from "nanoid"` fails with "ERR_REQUIRE_ESM" if the backend is bundled as CommonJS.
**Why it happens:** nanoid v3+ is ESM-only.
**How to avoid:** The backend uses `tsx` (ESM-aware TypeScript runner) and `package.json` does not set `"type": "commonjs"`, so this is a non-issue here. Confirm by checking that `apps/backend/package.json` has no `"type": "commonjs"`. (Verified: it doesn't.) If issues arise, use `customAlphabet` from `nanoid` v5 which is ESM.

### Pitfall 5: CORS on HTTP POST /api/rooms

**What goes wrong:** The frontend's `fetch('/api/rooms')` is blocked by CORS because the backend already sets CORS for Socket.IO but not for Express routes.
**Why it happens:** Socket.IO's CORS config (`new Server(..., { cors: {...} })`) only applies to the WebSocket upgrade, not to plain HTTP routes.
**How to avoid:** Add `cors` middleware to Express explicitly:

```typescript
import cors from "cors"
app.use(cors({ origin: process.env["FRONTEND_URL"] ?? "http://localhost:3000" }))
```

Install: `npm install cors && npm install --save-dev @types/cors` in `apps/backend`.

### Pitfall 6: `localStorage` access during SSR / hydration

**What goes wrong:** Accessing `localStorage.getItem("coup_player_name")` at module scope or in the render body causes a `ReferenceError` during Next.js SSR (even with `'use client'`, the first render runs server-side).
**Why it happens:** The existing `session.ts` already guards this with `typeof window === "undefined"`. Apply the same pattern for `coup_player_name`.
**How to avoid:** Always read `localStorage` inside `useEffect` or behind the `typeof window !== "undefined"` guard. Never in render body or module scope.

---

## Code Examples

Verified patterns from project source and official docs:

### Extending shared events (packages/shared/src/types/events.ts)

The existing pattern uses two interfaces. Phase 2 adds to both:

```typescript
// Additions to ServerToClientEvents:
LOBBY_UPDATE: (state: LobbyState) => void
GAME_STARTED: (roomId: string) => void

// Additions to ClientToServerEvents:
JOIN_ROOM: (roomId: string, name: string) => void
LEAVE_ROOM: (roomId: string) => void
SET_READY: (roomId: string, isReady: boolean) => void
START_GAME: (roomId: string) => void
```

### Frontend: POST to create room then redirect

```typescript
// In home page
import { useRouter } from "next/navigation"

const router = useRouter()

async function handleCreateRoom() {
  const res = await fetch("http://localhost:3001/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostId: playerId, hostName: username }),
  })
  if (!res.ok) return  // handle error
  const { roomId } = await res.json() as { roomId: string }
  localStorage.setItem("coup_player_name", username)
  router.push(`/room/${roomId}`)
}
```

### Backend: toLobbyState helper

```typescript
// Maps internal Room to the LobbyState type broadcast to clients
function toLobbyState(room: Room): LobbyState {
  return {
    roomId: room.roomId,
    players: room.players,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    status: room.status,
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params.roomId` direct access | `use(params).roomId` in Client Components | Next.js 15 | Must use React `use()` hook to unwrap params Promise |
| `document.execCommand('copy')` | `navigator.clipboard.writeText()` | ~2020 (all modern browsers) | Simpler async API; execCommand deprecated |
| nanoid v2 (CJS) | nanoid v5 (ESM-only) | nanoid v3 | Requires ESM-aware runner; tsx handles this |

**Deprecated/outdated:**
- `document.execCommand('copy')`: Deprecated in all major browsers; `navigator.clipboard` is the standard.
- `params` as synchronous object in Next.js page components: Changed to Promise in Next.js 15.

---

## Open Questions

1. **CORS package not yet installed in backend**
   - What we know: Socket.IO CORS config does not cover Express HTTP routes; `cors` npm package is not in `apps/backend/package.json`
   - What's unclear: Whether the dev setup proxies via Next.js (which would avoid CORS entirely) or hits backend directly
   - Recommendation: Add `cors` package to backend as a Wave 0 task; safe default is to allow the frontend origin

2. **nanoid not yet in backend package.json**
   - What we know: nanoid 5.1.7 is in the npm registry and was confirmed available; it is NOT listed in `apps/backend/package.json` dependencies
   - What's unclear: Whether it's transitively available via a workspace peer
   - Recommendation: Explicitly add `nanoid` to `apps/backend` dependencies as a Wave 0 install task

3. **shadcn `src/lib/utils.ts` missing**
   - What we know: The file does not exist; `npx shadcn add` will auto-create it
   - Recommendation: Run `npx shadcn add button input card badge` from `apps/frontend` as the first Wave 0 task; it creates `utils.ts` and installs `clsx` + `tailwind-merge`

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All backend/frontend | ✓ | 24.12.0 | — |
| npm | Package management | ✓ | 11.12.1 | — |
| nanoid | Room ID generation (backend) | ✗ (not in package.json) | 5.1.7 in registry | — (must install) |
| cors | Express CORS for /api/rooms | ✗ (not in package.json) | latest in registry | Proxy via Next.js rewrites (complex) |
| clsx + tailwind-merge | shadcn `cn()` utility | ✗ (not in package.json) | 2.1.1 / 3.5.0 in registry | Auto-installed by `npx shadcn add` |
| shadcn Button/Input/Card/Badge | Lobby UI | ✗ (no `/components/ui/` dir) | latest | — (must install) |

**Missing dependencies with no fallback:**
- `nanoid` in `apps/backend` — required for room ID generation; must be explicitly installed
- shadcn components — required per UI-SPEC; must run `npx shadcn add button input card badge`

**Missing dependencies with fallback:**
- `cors` in `apps/backend` — can use Next.js `rewrites` in `next.config.ts` to proxy `/api/` to backend (avoids CORS entirely); this is actually the cleaner approach for local dev

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Backend config | `apps/backend/vitest.config.ts` — environment: node, globals: true |
| Frontend config | `apps/frontend/vitest.config.ts` — environment: jsdom, globals: true, alias `@/` → `./src` |
| Backend quick run | `cd apps/backend && npm test` |
| Frontend quick run | `cd apps/frontend && npm test` |
| Full suite | `npm test --workspaces` from repo root |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROOM-01 | `createRoom(hostId, hostName)` returns a Room with 8-char roomId | unit | `cd apps/backend && npm test -- --reporter=verbose` | ❌ Wave 0: `src/__tests__/room-store.test.ts` |
| ROOM-01 | Room ID is unique across concurrent creates | unit | same | ❌ Wave 0 |
| ROOM-02 | `JOIN_ROOM` adds player with name to room's player list | unit | same | ❌ Wave 0: `src/__tests__/room-handler.test.ts` |
| ROOM-02 | Username read from localStorage on page load | unit | `cd apps/frontend && npm test` | ❌ Wave 0: `src/__tests__/room-page.test.ts` |
| ROOM-03 | 7th join attempt is rejected with error | unit | `cd apps/backend && npm test` | ❌ Wave 0 |
| ROOM-03 | `START_GAME` rejected when fewer than 2 players | unit | same | ❌ Wave 0 |
| ROOM-05 | `LOBBY_UPDATE` broadcast after each join / ready toggle | unit | same | ❌ Wave 0 |
| ROOM-05 | `SET_READY` toggles player's `isReady` and broadcasts | unit | same | ❌ Wave 0 |
| ROOM-06 | `START_GAME` rejected if not all players ready | unit | same | ❌ Wave 0 |
| ROOM-06 | `START_GAME` accepted → `room.status` becomes `IN_GAME` | unit | same | ❌ Wave 0 |
| ROOM-06 | Only host can trigger `START_GAME` | unit | same | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd apps/backend && npm test` (backend logic gates)
- **Per wave merge:** `npm test --workspaces` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/backend/src/__tests__/room-store.test.ts` — covers ROOM-01, ROOM-03 (room creation, ID uniqueness, capacity)
- [ ] `apps/backend/src/__tests__/room-handler.test.ts` — covers ROOM-02, ROOM-03, ROOM-05, ROOM-06 (socket event handlers)
- [ ] `apps/frontend/src/__tests__/room-page.test.ts` — covers ROOM-02 username localStorage read
- [ ] Install `nanoid` in backend: `cd apps/backend && npm install nanoid`
- [ ] Install shadcn components: `cd apps/frontend && npx shadcn add button input card badge` (creates `src/lib/utils.ts`)
- [ ] Install `cors` in backend: `cd apps/backend && npm install cors && npm install --save-dev @types/cors`

---

## Project Constraints (from CLAUDE.md)

| Directive | Applies to Phase 2 |
|-----------|-------------------|
| TypeScript with explicit types — no `any` | All new files: `LobbyState`, `LobbyPlayer`, event handlers |
| `camelCase` variables/functions, `PascalCase` interfaces | Enforce in `room-store.ts`, `use-lobby.ts`, page component |
| `kebab-case` file and directory names | `room-store.ts`, `use-lobby.ts`, `room/[roomId]/page.tsx` |
| `const` over `let` | Map operations, state setters |
| ES Modules (`import/export`) | All new files |
| TDD — tests before or with production code | Wave 0 creates test files before implementation tasks |
| Vitest for JS/TS tests | Already configured in both apps |
| No `var`, no `any` | Enforced |
| Atomic commits, Conventional Commits format | One commit per logical change |
| Never commit without explicit confirmation | Planner must include commit steps as explicit tasks |

---

## Sources

### Primary (HIGH confidence)

- Codebase direct read — `apps/backend/src/index.ts`, `socket-handler.ts`, `packages/shared/src/types/events.ts` — existing patterns confirmed
- Codebase direct read — `apps/frontend/src/lib/session.ts`, `socket.ts`, `hooks/use-socket.ts` — reusable assets confirmed
- Codebase direct read — `apps/frontend/components.json` — shadcn initialized with zinc/dark preset, `rsc: true`
- npm registry — `npm view nanoid version` returned 5.1.7 (confirmed 2026-04-02)
- npm registry — `npm view socket.io version` returned 4.8.3 (confirmed 2026-04-02)
- Socket.IO official docs — `socket.join(room)` / `io.to(room).emit()` scoping pattern (stable since v2)

### Secondary (MEDIUM confidence)

- Next.js 15 `params` as Promise — confirmed via package.json (`"next": "^16.2.2"`) cross-referenced with Next.js 15+ migration notes; `use(params)` pattern for Client Components
- shadcn `cn()` utility pattern — standard practice documented in shadcn official docs; `utils.ts` auto-created by `npx shadcn add`

### Tertiary (LOW confidence)

- CORS behavior difference between Socket.IO and Express routes — inferred from Socket.IO source code behavior and common issue patterns; not directly verified against Express 5 changelog

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed via npm registry and direct package.json inspection
- Architecture: HIGH — patterns derived directly from existing Phase 1 codebase
- Pitfalls: MEDIUM — Next.js 15 params change is HIGH; CORS split is MEDIUM (inferred); nanoid ESM is HIGH (well-documented)
- Test map: HIGH — test framework config read directly from source

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable ecosystem; nanoid/socket.io versions unlikely to change in 30 days)
