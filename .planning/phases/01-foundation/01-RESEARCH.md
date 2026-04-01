# Phase 1: Foundation - Research

**Researched:** 2026-04-01
**Domain:** npm workspaces monorepo, Express + Socket.IO backend, Next.js frontend, UUID session identity, `projectStateForPlayer()` pure function, GitHub Actions CI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** npm workspaces simples — sem Turborepo ou ferramentas de build extras
- **D-02:** Estrutura: `apps/frontend` (Next.js), `apps/backend` (Express + Socket.IO), `packages/shared` (tipos TypeScript)
- **D-03:** `packages/shared` contém **apenas tipos TypeScript** (interfaces, enums, tipos do GameState) — sem dependências, sem lógica compartilhada
- **D-04:** `concurrently` instalado na raiz — `npm run dev` na raiz inicia os dois serviços simultaneamente
- **D-05:** Badge discreto no canto da página (ponto verde/vermelho) indicando status da conexão — visível durante desenvolvimento, pode ser removido ou refinado na Fase 7
- **D-06:** CI roda `tsc --noEmit` (typecheck em todos os pacotes) + `vitest` (testes unitários)
- **D-07:** CI dispara em push para `main` apenas

### Claude's Discretion

- Configuração exata do tsconfig (paths, strictness) desde que seja `strict: true`
- Estrutura interna de arquivos dentro de cada `apps/` (ex: pastas routes/, lib/, etc.)
- Escolha da porta padrão de cada serviço (ex: frontend :3000, backend :3001)
- Implementação interna do `projectStateForPlayer()` — apenas a assinatura e comportamento são fixos

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROOM-04 | Identidade do jogador persiste via UUID no localStorage (reconexão restaura o slot) | UUID v4 via `uuid` package; localStorage read/write pattern on app init; server maps token → player slot |
| INIT-03 | O servidor nunca envia cartas ocultas de um jogador para outros clientes | `projectStateForPlayer()` pure function strips opponent hand cards before every broadcast; tested in isolation before any broadcast code is written |
| SYNC-01 | Todas as transições de estado são enviadas via WebSocket a todos os clientes instantaneamente | Socket.IO 4.x `io.to(roomId).emit()` for room fan-out; every state mutation triggers broadcast |
| SYNC-02 | Cada cliente recebe apenas a projeção de estado filtrada para seu jogador | `projectStateForPlayer()` applied per-socket before emit; never `io.emit()` with full state |
</phase_requirements>

---

## Summary

Phase 1 establishes the structural foundation on which every future phase depends. It must accomplish four things that cannot be retrofitted later without risk: the monorepo scaffold (workspace layout, shared types, dev runner), the UUID-based player session identity, a live WebSocket connection with visible health indication in the UI, and the `projectStateForPlayer()` filtering function tested in isolation before any game state is ever broadcast.

The technical choices are all locked by prior decisions (D-01 through D-07). Research confirms they are well-supported and straightforward to implement. The highest-risk item in this phase is not complexity — it is sequencing: `projectStateForPlayer()` and its tests must be written before any `socket.emit()` call for game state is created anywhere in the codebase. Shipping the broadcast plumbing first and "adding the filter later" is the single fastest path to an information-leak bug that invalidates the game.

The monorepo uses npm workspaces with `concurrently` — no build orchestration tools (Turborepo, Nx) are in scope. This keeps the setup shallow and eliminates tooling overhead for a small private application. `packages/shared` holds only TypeScript type definitions with zero runtime dependencies, ensuring the shared package never becomes a source of coupling or circular dependency problems.

**Primary recommendation:** Build in this order — (1) monorepo scaffold + workspace plumbing, (2) `projectStateForPlayer()` pure function + unit tests, (3) Express + Socket.IO backend with ping/pong, (4) Next.js frontend with UUID session + WebSocket client + status badge, (5) GitHub Actions CI. Never allow a `socket.emit(fullGameState)` call to exist without the filter in place.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.2.2 | React framework, frontend host | Project constraint; App Router is the current standard |
| TypeScript | 6.0.2 | Language for all packages | Project constraint; strict mode required |
| Express | 5.2.1 | HTTP server hosting Socket.IO | Stable, minimal, canonical Socket.IO attachment pattern |
| Socket.IO | 4.8.3 | Bidirectional WebSocket layer | Built-in rooms, auto-reconnect, fallback transport |
| socket.io-client | 4.8.3 | Browser Socket.IO client | Must match server major version exactly |
| uuid | 13.0.0 | UUID v4 generation for player session tokens | Spec-compliant, battle-tested, small |
| concurrently | 9.2.1 | Parallel dev runner from monorepo root | Single `npm run dev` starts both services |
| Node.js | 24.12.0 (local) | Runtime | Current LTS; use `>=20` as minimum in package.json engines |

**Note on Next.js 16:** Version 16.2.2 is the current release as of April 2026 (verified via npm). This is newer than training-data knowledge (which knew 14.x/15.x). The App Router patterns remain the same; no migration concern since this is a greenfield project.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.2 | Unit test runner | All test files; project constraint preferred over Jest |
| @vitest/coverage-v8 | 4.1.2 | Coverage reports | Add to CI; use `--coverage` flag |
| @testing-library/react | 16.3.2 | React component tests | Only if Phase 1 component needs interaction test |
| @testing-library/jest-dom | 6.9.1 | DOM matchers for RTL | Companion to RTL |
| jsdom | 29.0.1 | DOM environment for Vitest | Required for React component tests in Vitest |
| lucide-react | 1.7.0 | Icon library (via shadcn) | Already included with shadcn init; no separate install |
| tailwindcss | 4.2.2 | CSS utility framework | shadcn dependency; configured by `npx shadcn init` |
| tsx | 4.21.0 | TypeScript execution for backend | Run `apps/backend` in dev without compile step |
| @types/express | 5.0.6 | Express types | Dev dependency in apps/backend |
| @types/node | 25.5.0 | Node.js types | Dev dependency in all packages |
| @types/uuid | 11.0.0 | uuid types | Dev dependency where uuid is used |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| concurrently | npm-run-all2, turbo run dev | concurrently is simpler; Turborepo is out of scope per D-01 |
| tsx | ts-node, nodemon + ts-node | tsx is faster startup with no tsconfig changes needed; ts-node requires ESM config |
| socket.io-client | native WebSocket API | Socket.IO client adds auto-reconnect, matching protocol; raw WebSocket loses reconnection |
| vitest | jest | Project constraint (CLAUDE.md); vitest is faster for ESM + TypeScript projects |
| uuid package | crypto.randomUUID() | `crypto.randomUUID()` is now available in all modern browsers and Node 15+; either works, uuid package adds clear intent |

**Installation:**

```bash
# Root (monorepo)
npm install -D concurrently typescript

# apps/frontend
npm install socket.io-client uuid
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom @types/node @types/uuid

# apps/backend
npm install express socket.io uuid
npm install -D vitest @vitest/coverage-v8 tsx @types/express @types/node @types/uuid

# packages/shared
npm install -D typescript @types/node
# (no runtime deps — types only)
```

**Version verification:** All versions above verified against npm registry on 2026-04-01.

---

## Architecture Patterns

### Recommended Project Structure

```
/                               # monorepo root
├── package.json                # workspaces: ["apps/*", "packages/*"]
├── tsconfig.base.json          # shared TS config (strict: true, target: ES2022)
├── .github/
│   └── workflows/
│       └── ci.yml              # typecheck + vitest on push to main
├── apps/
│   ├── frontend/               # Next.js 16 App Router
│   │   ├── package.json
│   │   ├── tsconfig.json       # extends ../../tsconfig.base.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── components/
│   │   │   │   └── connection-badge.tsx  # Phase 1 only UI component
│   │   │   ├── lib/
│   │   │   │   ├── session.ts    # UUID read/write from localStorage
│   │   │   │   └── socket.ts     # socket.io-client singleton + connection state
│   │   │   └── hooks/
│   │   │       └── use-socket.ts # React hook exposing connection status
│   │   └── src/__tests__/
│   │       └── session.test.ts
│   └── backend/
│       ├── package.json
│       ├── tsconfig.json        # extends ../../tsconfig.base.json
│       └── src/
│           ├── index.ts          # Express + Socket.IO bootstrap
│           ├── socket-handler.ts # connection events, ping/pong
│           └── game/
│               └── project-state.ts       # projectStateForPlayer() implementation
│           └── __tests__/
│               └── project-state.test.ts  # unit tests — written before any emit
└── packages/
    └── shared/
        ├── package.json          # name: "@coup/shared", no deps
        ├── tsconfig.json
        └── src/
            ├── index.ts          # barrel export
            ├── types/
            │   ├── card.ts       # CardType enum, Card interface
            │   ├── game-state.ts # GameState, PlayerState, ClientGameState
            │   └── events.ts     # ClientMessage, ServerMessage discriminated unions
            └── __tests__/        # (empty in Phase 1 — types have no runtime logic to test)
```

### Pattern 1: npm Workspaces with Shared Types Package

**What:** Root `package.json` declares workspaces. `packages/shared` exports TypeScript types consumed by both apps. No circular dependencies — shared has no deps on apps.

**When to use:** Greenfield monorepo with 2+ TypeScript packages that share domain types.

**Example:**

```json
// /package.json
{
  "name": "coup-online",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=apps/frontend\" \"npm run dev --workspace=apps/backend\"",
    "typecheck": "tsc --noEmit -p apps/frontend/tsconfig.json && tsc --noEmit -p apps/backend/tsconfig.json && tsc --noEmit -p packages/shared/tsconfig.json",
    "test": "vitest run"
  },
  "devDependencies": {
    "concurrently": "^9.2.1",
    "typescript": "^6.0.2"
  }
}
```

```json
// packages/shared/package.json
{
  "name": "@coup/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

Importing shared types in both apps: `import type { GameState } from "@coup/shared"` — workspace protocol resolves this without publishing.

**Confidence:** HIGH — standard npm workspaces pattern, well-documented.

### Pattern 2: Express + Socket.IO Server Bootstrap

**What:** Express creates an `http.Server`; Socket.IO attaches to it. Socket.IO handles WebSocket upgrade; Express handles any future HTTP routes.

**When to use:** Any Node.js server that needs both HTTP and WebSocket endpoints on the same port.

**Example:**

```typescript
// apps/backend/src/index.ts
import express from "express"
import { createServer } from "node:http"
import { Server as SocketIOServer } from "socket.io"

const app = express()
const httpServer = createServer(app)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

io.on("connection", (socket) => {
  const playerId = socket.handshake.auth.playerId as string | undefined
  // ... register event handlers
})

const PORT = process.env.PORT ?? 3001
httpServer.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`)
})
```

**Confidence:** HIGH — canonical Socket.IO pattern, unchanged across 4.x versions.

### Pattern 3: UUID Session Identity — Client Side

**What:** On app init, read UUID from `localStorage`. If absent, generate and persist one. Send it as Socket.IO `auth` payload on every connection attempt.

**When to use:** Any no-auth app needing persistent identity across page refreshes.

**Example:**

```typescript
// apps/frontend/src/lib/session.ts
import { v4 as uuidv4 } from "uuid"

const SESSION_KEY = "coup_player_id"

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return ""  // SSR guard
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const fresh = uuidv4()
  localStorage.setItem(SESSION_KEY, fresh)
  return fresh
}
```

```typescript
// apps/frontend/src/lib/socket.ts
import { io } from "socket.io-client"
import { getOrCreatePlayerId } from "./session"

export const socket = io(
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
  {
    auth: { playerId: getOrCreatePlayerId() },
    autoConnect: false,  // connect explicitly after UUID is ready
  }
)
```

**Confidence:** HIGH — direct pattern from Socket.IO docs for passing auth data on connection.

### Pattern 4: `projectStateForPlayer()` — Pure Filter Function

**What:** Pure function. Takes full server state + a playerId, returns a `ClientGameState` where all other players' unrevealed cards are stripped to only their count. No I/O, no side effects.

**When to use:** Before every `socket.emit()` that sends game state to a specific player. Must be called per-socket, not once for broadcast.

**Example:**

```typescript
// apps/backend/src/game/project-state.ts
import type { GameState, ClientGameState, PublicPlayerState } from "@coup/shared"

export function projectStateForPlayer(
  gameState: GameState,
  playerId: string
): ClientGameState {
  const myPlayer = gameState.players.find((p) => p.id === playerId)

  const publicPlayers: PublicPlayerState[] = gameState.players.map((p) => ({
    id: p.id,
    name: p.name,
    coins: p.coins,
    eliminated: p.eliminated,
    cardCount: p.hand.filter((c) => !c.revealed).length,
    revealedCards: p.hand.filter((c) => c.revealed),
    // hand: NEVER included for other players
  }))

  return {
    myHand: myPlayer?.hand ?? [],
    players: publicPlayers,
    phase: gameState.phase,
    activePlayerId: gameState.activePlayerId,
    pendingAction: gameState.pendingAction,
    log: gameState.log,
  }
}
```

Sending it per-player:

```typescript
// correct: one targeted emit per player
for (const player of room.players) {
  const view = projectStateForPlayer(gameState, player.id)
  io.to(player.socketId).emit("STATE_UPDATE", view)
}

// WRONG: never do this
io.to(roomId).emit("STATE_UPDATE", gameState)  // leaks all hands
```

**Confidence:** HIGH — this pattern is the central requirement of INIT-03 and SYNC-02; the architecture research documents it as non-negotiable.

### Pattern 5: WebSocket Connection Badge (React)

**What:** Fixed-position indicator component. Reads connection status from a custom hook that wraps `socket.on("connect")` / `socket.on("disconnect")` events.

**When to use:** Any UI that needs to surface WebSocket health without page reload.

**Example:**

```typescript
// apps/frontend/src/hooks/use-socket.ts
import { useEffect, useState } from "react"
import { socket } from "@/lib/socket"

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export function useSocketStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("connecting")

  useEffect(() => {
    socket.connect()
    socket.on("connect", () => setStatus("connected"))
    socket.on("disconnect", () => setStatus("disconnected"))
    socket.on("connect_error", () => setStatus("error"))
    return () => {
      socket.off("connect")
      socket.off("disconnect")
      socket.off("connect_error")
    }
  }, [])

  return status
}
```

```typescript
// apps/frontend/src/components/connection-badge.tsx
import { useSocketStatus } from "@/hooks/use-socket"

const STATUS_CONFIG = {
  connected:    { dot: "bg-emerald-500", label: "Conectado",       pulse: false },
  connecting:   { dot: "bg-yellow-500",  label: "Conectando...",   pulse: true  },
  disconnected: { dot: "bg-red-500",     label: "Desconectado",    pulse: false },
  error:        { dot: "bg-red-500",     label: "Erro de conexão", pulse: false },
} as const

export function ConnectionBadge() {
  const status = useSocketStatus()
  const { dot, label, pulse } = STATUS_CONFIG[status]

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-md bg-card px-2 py-1">
      <span className={`h-2 w-2 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  )
}
```

**Confidence:** HIGH — matches UI-SPEC exactly (states, copy in pt-BR, Tailwind classes, position).

### Pattern 6: Ping/Pong for Connection Verification

**What:** Server emits `ping` on connection; client replies with `pong`. This confirms bidirectional communication beyond TCP handshake.

**Example:**

```typescript
// backend: on connection, send ping
io.on("connection", (socket) => {
  socket.emit("ping")
  socket.on("pong", () => {
    // connection verified — log for development visibility
    console.log(`[ws] pong from ${socket.id}`)
  })
})

// frontend: respond to server ping
socket.on("ping", () => socket.emit("pong"))
```

Note: Socket.IO has its own internal heartbeat (`pingInterval`, `pingTimeout`) at the transport layer. This application-level ping/pong is explicitly for Phase 1 success criterion 3 ("ping/pong visible in UI badge") and can be removed later.

**Confidence:** HIGH — straightforward event pattern.

### Anti-Patterns to Avoid

- **Broadcasting full state:** `io.to(roomId).emit("state", gameState)` — never acceptable. Every emit must use `projectStateForPlayer()` first.
- **Using `socket.id` as player identity:** `socket.id` changes on reconnect. The player's UUID from localStorage is the stable identity. Map `socket.id → playerId` in a server-side `Map`, not the reverse.
- **Importing runtime logic into `packages/shared`:** The shared package is types only. Any function (validation, projection, etc.) belongs in `apps/backend/src/` or `apps/frontend/src/`. Adding logic to shared creates coupling and complicates testing.
- **Initializing `localStorage` during SSR:** Next.js App Router runs layout and page on the server. `localStorage` is undefined in that context. All session reads must be guarded with `typeof window !== "undefined"` or executed in a `useEffect`.
- **Connecting the socket at module import time:** The socket singleton should be created with `autoConnect: false` and `.connect()` called explicitly inside a `useEffect` after the UUID is confirmed available.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID generation | Custom random string | `uuid` package (v4) | RFC 4122 compliance; collision resistance; one-liner |
| WebSocket reconnection | Custom retry loop with backoff | Socket.IO 4.x built-in | Handles exponential backoff, max retries, reconnection events; tested at scale |
| Dev process orchestration | Shell script with `&` and trap | `concurrently` | Cross-platform, labeled output, kill-on-exit behavior |
| TypeScript path resolution in monorepo | Custom webpack aliases | `npm workspaces` + `paths` in tsconfig | Native resolution; no bundler config changes needed |
| CORS handling | Manual `res.setHeader` on each route | Express `cors` middleware OR Socket.IO `cors` option | Handles preflight, credentials, origin patterns correctly |

**Key insight:** In a monorepo setup, the most error-prone area is TypeScript path resolution across packages. The `npm workspaces` + `tsconfig paths` combination handles this natively — do not introduce custom aliases or bundler tricks for what is already solved by the toolchain.

---

## Common Pitfalls

### Pitfall 1: Information Leakage via Broadcast

**What goes wrong:** `io.to(roomId).emit("state", gameState)` sends every player's hidden cards to every client. Any player who opens DevTools sees all opponent cards, breaking the bluffing mechanic entirely.

**Why it happens:** A single broadcast call is the obvious implementation. The "hidden" aspect feels implicit because the UI doesn't render it — but the data is in the payload.

**How to avoid:** `projectStateForPlayer()` must exist and have passing tests BEFORE any `socket.emit()` for game state is written. This is not a "we'll add it later" concern — retrofitting it requires auditing every emit call.

**Warning signs:** Any `io.emit()` or `socket.broadcast.emit()` that passes a `GameState` object directly.

### Pitfall 2: `socket.id` as Player Identity

**What goes wrong:** Game state stored as `Map<socketId, PlayerState>`. On page refresh, socket.id changes. Player appears as a new player. Their previous seat is a ghost.

**Why it happens:** `socket.id` is the obvious identifier available in the connection handler.

**How to avoid:** Read `playerId` from `socket.handshake.auth.playerId` (sent from localStorage). Maintain `Map<playerId, socketId>` for routing outbound messages. Game state uses `playerId` as the key.

**Warning signs:** `players[socket.id]` anywhere in backend code.

### Pitfall 3: SSR / localStorage Mismatch in Next.js

**What goes wrong:** Next.js App Router renders on the server. `localStorage.getItem("coup_player_id")` throws `ReferenceError: localStorage is not defined`.

**Why it happens:** App Router layout and page components execute on the server first. `localStorage` is a browser-only API.

**How to avoid:** Guard all `localStorage` access: `if (typeof window === "undefined") return ""`. Call `getOrCreatePlayerId()` inside `useEffect`, never at module top-level or in a Server Component.

**Warning signs:** `ReferenceError: localStorage is not defined` in server logs; UUID is undefined on first render.

### Pitfall 4: tsconfig Misconfiguration Across Workspace Packages

**What goes wrong:** `packages/shared` types compile fine in isolation but fail to resolve in `apps/frontend` or `apps/backend`. Either "module not found" at runtime or type errors that don't surface until CI.

**Why it happens:** Each workspace package needs its own `tsconfig.json` that extends a base config. The `paths` mapping for `@coup/shared` must be set consistently. The `"main"` and `"types"` fields in `packages/shared/package.json` must point to the correct entry file.

**How to avoid:** Set `"exports": { ".": "./src/index.ts" }` in `packages/shared/package.json`. In consuming packages, add `"@coup/shared": ["../../packages/shared/src/index.ts"]` to `tsconfig.json` paths. Verify with `tsc --noEmit` in each package before wiring up Socket.IO.

**Warning signs:** "Cannot find module '@coup/shared'" errors; types resolve in IDE but fail in `tsc`.

### Pitfall 5: Socket.IO CORS Error on First Dev Run

**What goes wrong:** Frontend at `localhost:3000` attempts to connect to backend at `localhost:3001`. Browser blocks WebSocket upgrade due to missing CORS headers.

**Why it happens:** Socket.IO does an HTTP handshake (polling transport) before upgrading to WebSocket. The initial `GET /socket.io/?EIO=4&transport=polling` is a cross-origin request.

**How to avoid:** Configure `cors` option in `new Server(httpServer, { cors: { origin: "http://localhost:3000" } })`. For production, use `FRONTEND_URL` environment variable.

**Warning signs:** `Cross-Origin Request Blocked` in browser console on the polling request.

### Pitfall 6: Vitest Config Not Finding Tests Across Workspace Packages

**What goes wrong:** `vitest run` from the monorepo root finds no test files, or finds only some packages' tests.

**Why it happens:** Vitest's default `include` glob doesn't always traverse workspace boundaries. The root `vitest.config.ts` (if any) may not cover `packages/**`.

**How to avoid:** Either (a) configure a root `vitest.config.ts` with `include: ["apps/**/src/**/__tests__/**/*.test.ts", "packages/**/src/**/__tests__/**/*.test.ts"]`, or (b) run vitest per-workspace in the CI script: `vitest run --project apps/backend && vitest run --project apps/frontend`. Option (b) aligns with the workspace-per-package convention and is simpler to debug.

**Warning signs:** `No test files found` when running from root.

---

## Code Examples

Verified patterns from architecture research and official Socket.IO documentation:

### Root tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "composite": true
  }
}
```

### Root package.json (monorepo)

```json
{
  "name": "coup-online",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "concurrently -n frontend,backend -c blue,green \"npm run dev --workspace=apps/frontend\" \"npm run dev --workspace=apps/backend\"",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "test": "npm run test --workspaces --if-present"
  },
  "devDependencies": {
    "concurrently": "^9.2.1",
    "typescript": "^6.0.2"
  }
}
```

### GitHub Actions CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm run test
```

### Minimal Shared Types (packages/shared)

```typescript
// packages/shared/src/types/card.ts
export type CardType = "duke" | "assassin" | "captain" | "ambassador" | "contessa"

export interface Card {
  type: CardType
  revealed: boolean
}

// packages/shared/src/types/game-state.ts
import type { Card } from "./card"

export interface PlayerState {
  id: string
  name: string
  coins: number
  hand: Card[]
  eliminated: boolean
}

export interface GameState {
  roomId: string
  phase: "lobby" | "in-progress" | "game-over"
  players: PlayerState[]
  activePlayerId: string | null
  deck: Card[]
  pendingAction: null  // extended in later phases
  log: string[]
}

export interface PublicPlayerState {
  id: string
  name: string
  coins: number
  eliminated: boolean
  cardCount: number
  revealedCards: Card[]
}

export interface ClientGameState {
  myHand: Card[]
  players: PublicPlayerState[]
  phase: GameState["phase"]
  activePlayerId: string | null
  pendingAction: null
  log: string[]
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ts-node` for backend dev | `tsx` | ~2023 | Faster startup, no tsconfig changes for ESM; use `tsx watch src/index.ts` |
| Next.js Pages Router | App Router | Next.js 13+ (stable in 14) | Server Components are default; client components need `"use client"` |
| `socket.io` v2/v3 | v4.x | 2021 | Breaking changes in v2→v3; v4 is stable since 2021, no major changes expected |
| `import { v4 as uuidv4 } from "uuid"` | `crypto.randomUUID()` | Node 15 / Chrome 92 | Built-in alternative; `uuid` package still valid and more explicit |
| `process.env.NODE_ENV` checks | `NEXT_PUBLIC_*` env vars for browser exposure | Next.js 9.4 | Env vars must be prefixed `NEXT_PUBLIC_` to be accessible in browser code |

**Deprecated/outdated:**

- `ts-node`: Still works but `tsx` is the current standard for simple TypeScript execution in Node.js dev environments. Use `tsx` unless you have a reason not to.
- Socket.IO `socket.emit("disconnect")` to force disconnect: use `socket.disconnect()` instead.
- Next.js `getServerSideProps` / `getStaticProps`: App Router uses `async` Server Components and `fetch` with cache options. Not relevant to Phase 1 but set the pattern correctly from the start.

---

## Open Questions

1. **Next.js 16 App Router — any breaking changes from 14/15 affecting Phase 1 setup?**
   - What we know: Next.js 16.2.2 is the current version (verified). Core App Router concepts (layouts, pages, `"use client"`) are stable.
   - What's unclear: Whether `npx shadcn init` (shadcn CLI version 4.1.2) is fully compatible with Next.js 16. shadcn tracks Next.js releases closely but there may be a brief compatibility lag.
   - Recommendation: Run `npx shadcn init` immediately after scaffolding and check for any version compatibility warnings before proceeding. If incompatibility, pin Next.js to the last shadcn-supported version.

2. **Vitest workspace configuration — root-level vs. per-package**
   - What we know: Vitest 4.x supports workspace configuration. Running from root is possible with the right `include` glob.
   - What's unclear: Whether Vitest 4.x has changed the workspace config API from 2.x (potential training data gap).
   - Recommendation: Use per-workspace `npm run test` scripts in each `apps/` and `packages/` package, driven from root via `npm run test --workspaces`. Simpler than a shared Vitest workspace config.

3. **`uuid` package v13 — API changes from v9**
   - What we know: `uuid` v13.0.0 is the current npm version (verified). Training data knew v9.x.
   - What's unclear: Whether there are breaking API changes between v9 and v13.
   - Recommendation: Verify `import { v4 as uuidv4 } from "uuid"` still works in v13 before writing session.ts. Alternatively, use `crypto.randomUUID()` which is built-in and has no version concerns.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All packages | ✓ | v24.12.0 | — |
| npm | Package management | ✓ | (bundled with Node) | — |
| Git | CI, version control | ✓ | (clean repo) | — |
| GitHub Actions | CI (D-06, D-07) | ✓ | (cloud; no local check needed) | — |
| `npx` / `shadcn` CLI | shadcn init | ✓ | shadcn@4.1.2 (npm verified) | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | Per-package `vitest.config.ts` (none exists yet — Wave 0 gap) |
| Quick run command | `npm run test --workspace=apps/backend` |
| Full suite command | `npm run test --workspaces --if-present` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INIT-03 | `projectStateForPlayer()` strips opponent unrevealed cards | unit | `vitest run apps/backend/src/__tests__/project-state.test.ts` | ❌ Wave 0 |
| INIT-03 | `projectStateForPlayer()` preserves own player's full hand | unit | `vitest run apps/backend/src/__tests__/project-state.test.ts` | ❌ Wave 0 |
| INIT-03 | `projectStateForPlayer()` exposes revealed cards (public knowledge) | unit | `vitest run apps/backend/src/__tests__/project-state.test.ts` | ❌ Wave 0 |
| ROOM-04 | `getOrCreatePlayerId()` returns same UUID on repeated calls (localStorage persist) | unit | `vitest run apps/frontend/src/__tests__/session.test.ts` | ❌ Wave 0 |
| ROOM-04 | `getOrCreatePlayerId()` generates new UUID when localStorage is empty | unit | `vitest run apps/frontend/src/__tests__/session.test.ts` | ❌ Wave 0 |
| SYNC-01 / SYNC-02 | Socket.IO ping/pong round-trip completes | smoke (manual) | n/a — verify in browser DevTools Network tab | ❌ manual only |

**Manual-only justification for SYNC-01/SYNC-02 ping/pong:** Full Socket.IO integration tests (client + server on real ports) require a running server and add significant test infrastructure for Phase 1 scope. The ping/pong is verified manually via browser DevTools per success criterion 3. Socket.IO integration tests can be added in Phase 2 when the full room join flow warrants them.

### `projectStateForPlayer()` Test Patterns

These are the specific test cases the implementation must satisfy:

```typescript
// apps/backend/src/__tests__/project-state.test.ts
import { describe, it, expect } from "vitest"
import { projectStateForPlayer } from "../game/project-state"
import type { GameState } from "@coup/shared"

const makeGameState = (): GameState => ({
  roomId: "test-room",
  phase: "in-progress",
  activePlayerId: "player-a",
  deck: [],
  pendingAction: null,
  log: [],
  players: [
    {
      id: "player-a",
      name: "Alice",
      coins: 2,
      eliminated: false,
      hand: [
        { type: "duke", revealed: false },
        { type: "captain", revealed: false },
      ],
    },
    {
      id: "player-b",
      name: "Bob",
      coins: 3,
      eliminated: false,
      hand: [
        { type: "assassin", revealed: false },
        { type: "contessa", revealed: true },  // revealed = public knowledge
      ],
    },
  ],
})

describe("projectStateForPlayer", () => {
  it("should include the requesting player's full hand", () => {
    const view = projectStateForPlayer(makeGameState(), "player-a")
    expect(view.myHand).toHaveLength(2)
    expect(view.myHand[0].type).toBe("duke")
  })

  it("should not expose unrevealed opponent cards in players array", () => {
    const view = projectStateForPlayer(makeGameState(), "player-a")
    const bob = view.players.find((p) => p.id === "player-b")
    // PublicPlayerState has no 'hand' property at all
    expect(bob).not.toHaveProperty("hand")
  })

  it("should report correct cardCount for opponent (unrevealed only)", () => {
    const view = projectStateForPlayer(makeGameState(), "player-a")
    const bob = view.players.find((p) => p.id === "player-b")
    expect(bob?.cardCount).toBe(1)  // only unrevealed card counts
  })

  it("should include opponent revealed cards in revealedCards", () => {
    const view = projectStateForPlayer(makeGameState(), "player-a")
    const bob = view.players.find((p) => p.id === "player-b")
    expect(bob?.revealedCards).toHaveLength(1)
    expect(bob?.revealedCards[0].type).toBe("contessa")
  })

  it("should work symmetrically for player-b's view", () => {
    const view = projectStateForPlayer(makeGameState(), "player-b")
    expect(view.myHand).toHaveLength(2)
    expect(view.myHand[0].type).toBe("assassin")
    const alice = view.players.find((p) => p.id === "player-a")
    expect(alice).not.toHaveProperty("hand")
    expect(alice?.cardCount).toBe(2)
  })

  it("should handle eliminated players correctly", () => {
    const state = makeGameState()
    state.players[1].eliminated = true
    state.players[1].hand = [
      { type: "assassin", revealed: true },
      { type: "contessa", revealed: true },
    ]
    const view = projectStateForPlayer(state, "player-a")
    const bob = view.players.find((p) => p.id === "player-b")
    expect(bob?.eliminated).toBe(true)
    expect(bob?.cardCount).toBe(0)
    expect(bob?.revealedCards).toHaveLength(2)
  })
})
```

### Session Identity Test Patterns

```typescript
// apps/frontend/src/__tests__/session.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock localStorage for Node.js environment
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
  }
})()

vi.stubGlobal("localStorage", localStorageMock)
vi.stubGlobal("window", { localStorage: localStorageMock })

describe("getOrCreatePlayerId", () => {
  beforeEach(() => localStorageMock.clear())

  it("should generate and persist a UUID when none exists", async () => {
    const { getOrCreatePlayerId } = await import("../lib/session")
    const id = getOrCreatePlayerId()
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect(localStorageMock.getItem("coup_player_id")).toBe(id)
  })

  it("should return the same UUID on repeated calls", async () => {
    const { getOrCreatePlayerId } = await import("../lib/session")
    const id1 = getOrCreatePlayerId()
    const id2 = getOrCreatePlayerId()
    expect(id1).toBe(id2)
  })
})
```

### Sampling Rate

- **Per task commit:** `npm run test --workspace=apps/backend` (covers `projectStateForPlayer()` tests — < 5 seconds)
- **Per wave merge:** `npm run test --workspaces --if-present && npm run typecheck`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/backend/src/__tests__/project-state.test.ts` — covers INIT-03, SYNC-02
- [ ] `apps/frontend/src/__tests__/session.test.ts` — covers ROOM-04
- [ ] `apps/backend/vitest.config.ts` — Vitest config for backend workspace
- [ ] `apps/frontend/vitest.config.ts` — Vitest config for frontend workspace
- [ ] Framework install: `npm install -D vitest` in each workspace — if not already present

---

## Project Constraints (from CLAUDE.md)

These directives are mandatory and override any recommendation that conflicts with them:

| Directive | Applies To |
|-----------|-----------|
| TypeScript preferred; explicit typing; no `any` | All packages |
| `camelCase` for variables/functions | All TS/JS files |
| `PascalCase` for classes, components, interfaces | All TS/JS files |
| `SCREAMING_SNAKE_CASE` for global constants | All TS/JS files |
| `kebab-case` for file and directory names | All files/directories |
| `const` over `let`; no `var` | All TS/JS files |
| ES Modules (`import/export`) | All packages |
| Vitest for tests (preferred over Jest) | All test files |
| TDD: tests written before or alongside production code | All features |
| Test names describe behavior: `should_return_X_when_Y` | All test files |
| Commits: Conventional Commits format | Git history |
| No commit/push without explicit confirmation | Git operations |
| No irreversible actions without explicit confirmation | All operations |
| Add `.claude/` to `.gitignore` | Repo root |
| No co-authored-by Claude in commits | Git config |

---

## Sources

### Primary (HIGH confidence)

- npm registry (verified 2026-04-01) — all package versions in Standard Stack table
- `.planning/research/STACK.md` — stack decisions and rationale (project document)
- `.planning/research/ARCHITECTURE.md` — `projectStateForPlayer()` signature, message protocol, component boundaries
- `.planning/research/PITFALLS.md` — socket.id anti-pattern, information leakage, SSR guard
- `.planning/phases/01-foundation/01-CONTEXT.md` — locked decisions D-01 through D-07
- `.planning/phases/01-foundation/01-UI-SPEC.md` — badge anatomy, states, copy, Tailwind classes

### Secondary (MEDIUM confidence)

- Socket.IO 4.x documentation patterns (training data, stable since 2021)
- npm workspaces documentation (training data, Node.js built-in since v7)
- Next.js App Router `"use client"` / localStorage guard pattern (training data, standard since Next.js 13)

### Tertiary (LOW confidence)

- uuid v13 API compatibility with v9 import syntax — not verified against v13 changelog; flagged in Open Questions

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all versions verified against npm registry 2026-04-01
- Architecture: HIGH — patterns drawn from project's own ARCHITECTURE.md and PITFALLS.md; well-established Socket.IO patterns
- Pitfalls: HIGH — PITFALLS.md documents these with root causes; SSR/localStorage pitfall is a well-known Next.js gotcha
- Test patterns: HIGH — `projectStateForPlayer()` test cases directly encode the INIT-03/SYNC-02 requirements

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (stable ecosystem; uuid v13 API question should be verified before coding session.ts)
