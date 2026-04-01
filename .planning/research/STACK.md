# Technology Stack

**Project:** Coup Online
**Researched:** 2026-04-01
**Research mode:** Training data only (WebSearch and WebFetch unavailable — see confidence notes)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 14.x / 15.x | React framework, frontend host | Already in project constraints. App Router supports colocation of API routes. For a private app this is the right default — no need to split frontend from backend hosting. |
| React | 18.x / 19.x | UI rendering | Project constraint. Concurrent features (transitions) are not needed for this scope, but React 18+ hooks are the baseline. |
| TypeScript | 5.x | Language | Project constraint. Enforces game state types cleanly — critical for a game where every action has a discriminated union of outcomes. |

**Confidence:** HIGH — these are project constraints, not decisions to make.

---

### WebSocket Layer

**Recommendation: Socket.IO 4.x on a standalone Node.js server (not a Next.js API route)**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Socket.IO | 4.7.x | Real-time bidirectional communication | See rationale below. |
| Node.js HTTP server | built-in | Attach Socket.IO to | Socket.IO wraps Node's http.Server. |

**Why Socket.IO over raw `ws`:**

- Built-in rooms: every Coup room maps to a Socket.IO room. Broadcasting to all players in a room is one line: `io.to(roomId).emit('game-state', state)`. With raw `ws` you implement this yourself.
- Automatic reconnection with state recovery: if a player's browser tab drops and reconnects, Socket.IO can replay missed events. Critical for a game with real human players.
- Fallback to HTTP long-polling: not needed here, but it means the connection just works across corporate firewalls without configuration.
- Namespaces: useful if you later add a lobby separate from game rooms.
- The overhead (extra ~10 KB client bundle) is irrelevant at this scale.

**Why NOT a Next.js API route for WebSockets:**

Next.js API routes (both Pages Router and App Router) do not support long-lived WebSocket connections in production on Vercel or similar serverless platforms. The server would need to be a persistent process. Using a standalone Express + Socket.IO server avoids this entirely and is the standard pattern.

**Why NOT uWebSockets.js:**

uWebSockets is high-performance but low-level. It has breaking API changes across versions and a hostile maintenance posture. Completely wrong choice for a private hobby app.

**Confidence:** HIGH for Socket.IO over raw ws. MEDIUM for version 4.7.x specifically (training cutoff August 2025; verify npm for exact latest patch).

---

### Backend Server

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Express | 4.x | HTTP server + Socket.IO host | Minimal, stable, well understood. Attach Socket.IO to Express's http.Server. Handles the room/join HTTP endpoints (create room, get room info) before the WS upgrade. |
| Node.js | 20.x LTS | Runtime | LTS = stable. 20.x has built-in fetch, improved ESM support. |

**Alternative considered:** Fastify. Faster than Express but the integration patterns with Socket.IO are less documented and the DX overhead is not justified at this scale.

**Confidence:** HIGH for Express + Node 20 LTS.

---

### State Management (Server-Side Game State)

**Recommendation: Plain TypeScript objects in memory, no external store for v1.**

| Approach | Decision | Reason |
|----------|----------|--------|
| In-memory Map on server | USE | All game state lives in a `Map<roomId, GameState>`. Coup games are short (5-30 min), rooms are ephemeral. No need for persistence in v1. |
| Redis | DEFER | Only needed if you run multiple server instances or need game recovery after server restart. Neither is a v1 requirement. |
| Database (Postgres/SQLite) | DEFER | Game history/stats are out of scope for v1. |

**Game state shape:** A single authoritative `GameState` object on the server, versioned with a sequence number. The server is the single source of truth — clients never mutate state directly. On every valid action, the server computes the new state and broadcasts it to all room members.

**Why not event sourcing:** Valid pattern for games, but adds complexity (event log, replay, projection) that is over-engineered for a private 2-6 player app.

**Confidence:** HIGH — this is the correct pattern for a small-scale game with no persistence requirements.

---

### Frontend State Management

**Recommendation: React Context + useReducer for game state, no external state library.**

| Technology | Decision | Reason |
|------------|----------|--------|
| React Context + useReducer | USE | The entire game state arrives from the server as a snapshot on each event. The reducer simply replaces state. This is a solved pattern and needs no Zustand/Redux overhead. |
| Zustand | CONSIDER | If component tree becomes deep and prop drilling becomes painful, Zustand is the lightest upgrade path. Install it then, not now. |
| Redux Toolkit | AVOID | Overkill for a game that receives server-authoritative snapshots. The complexity is not justified. |
| TanStack Query | AVOID | Designed for HTTP data fetching with caching. WebSocket real-time state is a different paradigm — don't mix them. |

**Confidence:** HIGH.

---

### Session / Room Management (No Auth)

**Recommendation: Randomly generated player ID stored in `localStorage` + room code in the URL.**

| Concern | Solution |
|---------|----------|
| Player identity | On first visit, generate a UUID v4 and store in `localStorage`. Send this as the player's identity when joining a room. No server accounts needed. |
| Room creation | Server generates a short alphanumeric room code (e.g., `XKCD4`). Creator gets the full join URL: `https://yourdomain.com/room/XKCD4`. |
| Join via link | Entering `/room/XKCD4` reads the room code from the URL, reads the player UUID from `localStorage`, emits `join-room` over Socket.IO. |
| Player name | Prompt for a display name on join (stored in `localStorage` too). No password, no email. |
| Session recovery | UUID in `localStorage` + Socket.IO's `sessionID` allows reconnection to the same game slot if the player refreshes. |

**Library:** Use the `uuid` npm package (v9.x) for UUID generation on the client.

**Confidence:** HIGH — this is the standard frictionless-join pattern for private game apps.

---

### Deployment

**Recommendation: Railway.app for the Node.js server, Vercel for the Next.js frontend.**

| Service | What | Why |
|---------|------|-----|
| Vercel | Next.js frontend | Zero-config deployment for Next.js. Free tier sufficient for private use. |
| Railway | Express + Socket.IO server | Supports persistent Node.js processes (unlike Vercel). Free/hobby tier has enough for a small private app. Handles environment variables cleanly. |

**Why not host everything on Railway:** Next.js on Railway works but Vercel's Next.js integration is superior (ISR, image optimization, edge config). Splitting is the better DX.

**Why not Fly.io:** Valid alternative to Railway. Both work. Railway has simpler onboarding for a hobby project.

**Why not Heroku:** Paid-only since 2022 and not cost-competitive with Railway/Fly for hobby use.

**Why not a single server (Express serves both API and static files):** Next.js `next build` + `next start` can be hosted on Railway too, removing the Vercel split. This is simpler but loses Vercel's CDN for static assets. Acceptable trade-off — note as an alternative if the two-service setup feels complex.

**Confidence:** MEDIUM — deployment options change. Verify Railway free tier limits at time of deploy. Alternative: single server on Railway serving both frontend (`next start`) and backend on separate ports, no Vercel needed.

---

### Testing

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vitest | 1.x / 2.x | Unit + integration tests | Project constraint (preferred over Jest per CLAUDE.md). Game logic (state machine, action validation) is pure TypeScript — ideal for fast unit tests. |
| React Testing Library | 14.x | Component tests | Standard for React. Test player UI interactions (click action button, assert UI update). |
| Playwright | 1.x | E2E tests (optional for v1) | End-to-end test covering full join-room + play-turn flow. Defer until core game logic is stable. |

**What to test first:** The game state machine (pure functions: `applyAction(state, action) => newState`). This is the heart of the game and must be bulletproof.

**Confidence:** HIGH for Vitest + RTL. MEDIUM for Playwright version.

---

## Full Dependency List

```bash
# Frontend (Next.js app)
npm install socket.io-client uuid
npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom

# Backend (Express + Socket.IO server)
npm install express socket.io uuid
npm install -D typescript @types/express @types/node @types/uuid ts-node vitest
```

---

## Alternatives Considered (Summary)

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| WebSocket layer | Socket.IO 4.x | raw `ws` | ws requires manual room management, reconnection, fallbacks |
| WebSocket layer | Socket.IO 4.x | uWebSockets.js | Hostile maintenance, low-level, wrong scale |
| Backend framework | Express 4.x | Fastify | Less Socket.IO ecosystem support; no benefit at this scale |
| Server state | In-memory Map | Redis | No multi-instance requirement; adds operational complexity |
| Client state | Context + useReducer | Zustand / Redux | Over-engineered for server-snapshot pattern |
| Auth / session | UUID in localStorage | NextAuth / JWT | No accounts in scope; full auth is friction for friends |
| Deployment (server) | Railway | Fly.io / Render | Railway simpler onboarding; all three are valid |
| Deployment (frontend) | Vercel | Railway (next start) | Vercel has best Next.js integration; single-server is valid fallback |

---

## Sources and Confidence Summary

| Area | Confidence | Basis |
|------|------------|-------|
| Socket.IO rooms/reconnect features | HIGH | Training data, well-documented stable API since v4 (2020) |
| Socket.IO 4.7.x version | MEDIUM | Training cutoff Aug 2025; patch version may be higher — verify on npm |
| Next.js WS incompatibility on Vercel | HIGH | Well-documented platform constraint, unlikely to change |
| Express + Socket.IO attachment pattern | HIGH | Canonical pattern, unchanged for years |
| UUID in localStorage pattern | HIGH | Widely used for no-auth game lobbies |
| Railway free tier availability | MEDIUM | Tier structures change; verify at deploy time |
| React 19 stability | MEDIUM | Was in RC near training cutoff; verify current stable version |

**Note:** WebSearch and WebFetch were unavailable during this research session. All findings are based on training data (cutoff August 2025). Versions marked MEDIUM confidence should be verified against npm/official docs before coding begins.
