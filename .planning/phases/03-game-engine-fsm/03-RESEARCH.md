# Phase 3: Game Engine (FSM) - Research

**Researched:** 2026-04-02
**Domain:** Pure TypeScript finite state machine for Coup card game logic
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Plain TypeScript enum + transition map (no XState, no external FSM libraries) — locked in ROADMAP
- `GamePhase` enum already exists in `packages/shared/src/types/game-state.ts` — reuse directly
- FSM lives in `apps/backend/src/game/` alongside existing `project-state.ts`
- Single `processAction(state, action)` pure function returns new `GameState` — no mutation
- Transition map validates current phase + actor before applying action
- Actions: discriminated union `{ type: "INCOME" | "FOREIGN_AID" | "COUP" | "ASSASSINATE" | "STEAL" | "TAX" | "EXCHANGE", playerId: string, targetId?: string }`
- Reactions: discriminated union `{ type: "CHALLENGE" | "BLOCK" | "PASS", playerId: string }`
- `initGame(roomId, players)` takes player list from lobby, shuffles 15-card deck, deals 2 cards + 2 coins per player, randomizes turn order
- Deck: 3× each of DUKE, ASSASSIN, CAPTAIN, AMBASSADOR, CONTESSA = 15 cards
- Ambassador draws 2 extra cards AFTER challenge window passes (not immediately on action declaration)
- Test files: `fsm-transitions.test.ts`, `fsm-game-init.test.ts`, `fsm-full-game.test.ts`
- Full 2-player simulated game in `fsm-full-game.test.ts` must reach GAME_OVER
- Error strategy: return `{ ok: false, error }` consistent with room-store pattern

### Claude's Discretion

- Internal Room type structure for FSM (how to store deck, pending reactions, etc.)
- How to handle nested block-challenge state tracking

### Deferred Ideas (OUT OF SCOPE)

- WebSocket wiring — Phase 4
- Reconnect/spectator state — Phase 6
- Ambassador exchange timing detail already decided in ROADMAP
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INIT-01 | Deck of 15 cards (3× Duke, Assassin, Captain, Ambassador, Contessa) shuffled on server | Fisher-Yates shuffle with typed `Card[]`; deck shape already in `GameState.deck` |
| INIT-02 | Each player receives 2 hidden influence cards and 2 coins on start | `initGame()` function deals from shuffled deck; `PlayerState` already has `hand: Card[]` and `coins: number` |
| INIT-04 | Turn order defined randomly at game start | `initGame()` shuffles player array; `activePlayerId` set to `players[0].id` after shuffle |
</phase_requirements>

---

## Summary

Phase 3 delivers the complete Coup game logic as a pure, side-effect-free TypeScript module. The core artifact is a `processAction(state, action)` function and an `initGame()` factory — both returning new state objects with no mutation. The FSM is governed by `GamePhase` (already defined in shared types) as explicit phases, with a transition map that guards against invalid moves.

The biggest design challenge is the nested reaction window: an action can be challenged OR blocked, and a block can itself be challenged. This creates a two-level nesting that must be tracked in `PendingAction`. The `GameState` type already has all required fields (`players`, `phase`, `deck`, `pendingAction`, `log`) — Phase 3 extends `PendingAction` with reaction-tracking sub-fields and implements the full transition logic.

All verification is via Vitest unit tests; no server or WebSocket is needed. The existing test infrastructure (`vitest.config.ts` in `apps/backend/`, Vitest 4.1.2, `src/**/*.test.ts` glob) requires zero changes — new test files go in `apps/backend/src/__tests__/`.

**Primary recommendation:** Extend `PendingAction` with a `pendingReactions` map and a `blockerId` field in shared types, then implement `processAction` as a dispatcher over a typed transition map keyed by `(phase, action.type)` pairs.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | `~5.x` (project tsconfig) | Type-safe FSM, discriminated unions | Already in use across monorepo |
| Vitest | `^4.1.2` | Unit tests, assertions | Already installed; `vitest.config.ts` present |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nanoid | `^3.3.11` | Game/action IDs (if needed) | Already installed in backend |
| uuid | `^13.0.0` | Player UUID (lobby already uses this) | Already installed |

### No New Dependencies

Phase 3 adds **zero** new packages. All required tooling is already installed.

**Verification:**

```bash
# Confirmed from apps/backend/package.json
vitest@^4.1.2  — installed
nanoid@^3.3.11 — installed (used by room-store)
uuid@^13.0.0   — installed
```

---

## Architecture Patterns

### Recommended File Structure

```
apps/backend/src/game/
├── project-state.ts          # EXISTS — projectStateForPlayer (keep as-is)
├── game-engine.ts            # NEW — initGame(), processAction()
└── __tests__/ (via src/__tests__/)
    ├── fsm-game-init.test.ts  # NEW — deck, deal, turn order
    ├── fsm-transitions.test.ts# NEW — all phase transitions
    └── fsm-full-game.test.ts  # NEW — 2-player game reaching GAME_OVER

packages/shared/src/types/
├── game-state.ts             # EXTEND — PendingAction with reaction fields
├── card.ts                   # NO CHANGE — CardType enum, Card interface are complete
└── events.ts                 # NO CHANGE (Phase 4 adds action events)
```

### Pattern 1: Pure Function FSM with Transition Map

**What:** A `processAction` dispatcher that looks up `(currentPhase, actionType)` in a typed map and delegates to a pure handler function.

**When to use:** Whenever the FSM handles any game event — action, reaction, or resolution.

```typescript
// Source: project convention (room-store.ts pure function pattern)
type ActionResult = { ok: true; state: GameState } | { ok: false; error: string }

type TransitionKey = `${GamePhase}:${string}`

const transitions: Partial<Record<TransitionKey, (state: GameState, action: GameAction) => ActionResult>> = {
  [`${GamePhase.AWAITING_ACTION}:INCOME`]: handleIncome,
  [`${GamePhase.AWAITING_ACTION}:FOREIGN_AID`]: handleForeignAid,
  [`${GamePhase.AWAITING_ACTION}:COUP`]: handleCoup,
  // ... etc
}

export function processAction(state: GameState, action: GameAction): ActionResult {
  const key: TransitionKey = `${state.phase}:${action.type}`
  const handler = transitions[key]
  if (!handler) return { ok: false, error: `Invalid action ${action.type} in phase ${state.phase}` }
  return handler(state, action)
}
```

### Pattern 2: Discriminated Union for Actions and Reactions

**What:** All inputs to `processAction` are a single discriminated union type. TypeScript narrows the type inside each handler.

```typescript
// Extended action union — Phase 3 scope
export type GameAction =
  | { type: "INCOME";       playerId: string }
  | { type: "FOREIGN_AID";  playerId: string }
  | { type: "TAX";          playerId: string }
  | { type: "EXCHANGE";     playerId: string }
  | { type: "STEAL";        playerId: string; targetId: string }
  | { type: "ASSASSINATE";  playerId: string; targetId: string }
  | { type: "COUP";         playerId: string; targetId: string }
  | { type: "CHALLENGE";    playerId: string }
  | { type: "BLOCK";        playerId: string; claimedCard: CardType }
  | { type: "PASS";         playerId: string }
  | { type: "LOSE_INFLUENCE"; playerId: string; cardIndex: number }
  | { type: "EXCHANGE_CHOOSE"; playerId: string; keptIndices: [number, number] }
```

**Note:** `CHALLENGE`, `BLOCK`, `PASS` are reactions but flow through the same `processAction` — the current `GamePhase` determines which are valid.

### Pattern 3: Extended PendingAction for Multi-Step Flows

**What:** `PendingAction` must carry enough context to resume after a reaction resolves. The current `PendingAction` type has only `type`, `playerId`, `targetId` — Phase 3 must extend it.

**Recommended extension (in `packages/shared/src/types/game-state.ts`):**

```typescript
export interface PendingAction {
  type: string
  playerId: string
  targetId?: string
  // NEW FIELDS — Phase 3 adds these:
  pendingReactions: Record<string, "WAITING" | "PASSED" | "CHALLENGED" | "BLOCKED">
  blockerId?: string         // set when a block has been declared
  blockerClaimedCard?: string // which card the blocker claims to hold
  exchangeCards?: Card[]     // the 2 cards drawn from deck for Ambassador exchange
}
```

**Why `pendingReactions` is a map:** Coup uses explicit-pass model (REAC-02) — every non-active player must either react or explicitly pass before the action resolves. The map tracks each player's decision status. An action resolves only when all entries are `"PASSED"` or one entry is `"CHALLENGED"` / `"BLOCKED"`.

### Pattern 4: initGame Factory

**What:** Pure factory that takes a roomId and a list of `LobbyPlayer[]`, builds a shuffled `GameState` ready for play.

```typescript
// Source: Fisher-Yates is the canonical unbiased in-place shuffle
export function initGame(roomId: string, lobbyPlayers: LobbyPlayer[]): GameState {
  const deck = buildDeck()            // 15 cards
  shuffleDeck(deck)                   // Fisher-Yates in-place
  const players = buildPlayers(lobbyPlayers, deck) // deal 2 cards + 2 coins each
  const turnOrder = [...players]
  shuffleArray(turnOrder)             // randomize turn order (INIT-04)

  return {
    roomId,
    players: turnOrder,
    phase: GamePhase.AWAITING_ACTION,
    activePlayerId: turnOrder[0].id,
    pendingAction: null,
    deck,                             // remaining cards after dealing
    log: ["Game started"],
  }
}
```

### Pattern 5: Fisher-Yates Shuffle in TypeScript

**What:** Unbiased in-place array shuffle. Only correct algorithm for fair deck shuffling.

```typescript
// Source: standard algorithm — no library needed
function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function buildDeck(): Card[] {
  const types = [CardType.DUKE, CardType.ASSASSIN, CardType.CAPTAIN, CardType.AMBASSADOR, CardType.CONTESSA]
  return types.flatMap(type => [
    { type, revealed: false },
    { type, revealed: false },
    { type, revealed: false },
  ])
  // 5 types × 3 = 15 cards
}
```

### Pattern 6: Immutable State Updates

**What:** All handlers return new objects — never mutate input state. Follows room-store pattern.

```typescript
// Source: established in room-store.ts via pure function convention
function handleIncome(state: GameState, action: Extract<GameAction, { type: "INCOME" }>): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, error: "Not your turn" }
  }
  const players = state.players.map(p =>
    p.id === action.playerId ? { ...p, coins: p.coins + 1 } : p
  )
  return {
    ok: true,
    state: {
      ...state,
      players,
      phase: GamePhase.AWAITING_ACTION,
      activePlayerId: nextActivePlayer(state),
      log: [...state.log, `${action.playerId} takes income`],
    },
  }
}
```

### Anti-Patterns to Avoid

- **Mutating state directly:** `state.players.push(...)` — breaks pure function contract; return new objects always
- **Switch on `action.type` without phase guard:** Actions must be gated by both current phase AND actor identity — a single switch loses phase context
- **Skipping the challenge window for Ambassador:** Drawing exchange cards at action declaration (before reactions resolve) leaks deck info — explicitly locked decision to draw AFTER challenge window passes
- **Flat action/reaction handling:** Treating `BLOCK` and `CHALLENGE` identically regardless of context loses the nested block-challenge distinction
- **Using `any` for action types:** TypeScript discriminated union provides exhaustiveness checking — `any` removes compile-time safety

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Shuffle algorithm | Custom sort-based shuffle (`arr.sort(() => Math.random() - 0.5)`) | Fisher-Yates in-place | Sort-based shuffle is statistically biased; Fisher-Yates is O(n) and unbiased |
| Type narrowing | Manual `if (action.type === "INCOME")` chains | TypeScript discriminated union + `Extract<>` | Compiler verifies exhaustiveness; IDE completes fields per variant |
| ID generation | `Math.random().toString()` | `nanoid` (already installed) | Already in codebase; collision-resistant |
| Test factories | Duplicated state setup across tests | `makeGameState()` helper function | Pattern established in `project-state.test.ts` — reuse it |

**Key insight:** The FSM transition map pattern is self-documenting — every valid `(phase, action)` pair is explicit in the map. Invalid transitions return an error automatically without any manual guard per handler.

---

## Nested Block-Challenge State — Deep Dive

This is the highest-risk area (flagged in STATE.md). The flow is:

```
AWAITING_ACTION
  → active player declares action
AWAITING_REACTIONS
  → other players may PASS, CHALLENGE, or BLOCK
  [if CHALLENGE]:
    RESOLVING_CHALLENGE
      → if challenger wins: action cancelled, active player loses influence → AWAITING_ACTION (next turn)
      → if challenger loses: challenger loses influence → action resolves immediately
  [if BLOCK]:
    AWAITING_BLOCK_CHALLENGE
      → active player (or others) may CHALLENGE the block, or PASS
      [if CHALLENGE block]:
        RESOLVING_BLOCK_CHALLENGE
          → if blocker proves card: challenger loses influence, block stands → action cancelled → AWAITING_ACTION
          → if blocker cannot prove: blocker loses influence, action resolves
      [if all PASS the block]:
        action cancelled → AWAITING_ACTION (next turn)
  [if all PASS]:
    RESOLVING_ACTION (or AWAITING_EXCHANGE / AWAITING_COUP_TARGET)
```

### State Fields Required for Each Nested Phase

| Phase | Required PendingAction Fields |
|-------|-------------------------------|
| `AWAITING_REACTIONS` | `type`, `playerId`, `targetId?`, `pendingReactions` map |
| `AWAITING_BLOCK_CHALLENGE` | all above + `blockerId`, `blockerClaimedCard` |
| `RESOLVING_CHALLENGE` | `type`, `playerId`, challenger identity in reactions map |
| `RESOLVING_BLOCK_CHALLENGE` | `blockerId`, `blockerClaimedCard`, challenger identity |
| `AWAITING_EXCHANGE` | `type: "EXCHANGE"`, `playerId`, `exchangeCards` (2 drawn from deck) |

### Who Can Block What

| Action | Blocking Card(s) | Who Can Block |
|--------|-----------------|---------------|
| Foreign Aid | Duke | Any player |
| Assassinate | Contessa | Target only |
| Steal | Captain or Ambassador | Target only |
| Income, Tax, Exchange, Coup | — | Cannot be blocked |

### Who Can Challenge What

| Action | Claimed Character | Who Can Challenge |
|--------|-----------------|-------------------|
| Tax | Duke | Any other player |
| Steal | Captain | Any other player |
| Exchange | Ambassador | Any other player |
| Assassinate | Assassin | Any other player |
| Block of FA | Duke | Any other player |
| Block of Steal | Captain/Ambassador | Any other player |
| Block of Assassinate | Contessa | Assassinating player |

---

## Common Pitfalls

### Pitfall 1: Forgetting to Advance the Active Player

**What goes wrong:** After INCOME/TAX/STEAL resolve, `activePlayerId` is not updated — same player acts again.
**Why it happens:** State spread `{ ...state }` carries old `activePlayerId` forward.
**How to avoid:** Every terminal transition calls `nextActivePlayer(state)` — a utility that skips eliminated players and wraps around.
**Warning signs:** Test `fsm-full-game.test.ts` loops infinitely on same player.

### Pitfall 2: Ambassador Exchange Draws Before Challenge Window

**What goes wrong:** Drawing 2 exchange cards at the moment of EXCHANGE declaration exposes deck position before challenge resolves.
**Why it happens:** Treating EXCHANGE like INCOME — resolve immediately.
**How to avoid:** EXCHANGE goes to `AWAITING_REACTIONS` first. Only on transition to `RESOLVING_ACTION` (after all pass) do the 2 cards get drawn from deck and stored in `pendingAction.exchangeCards`. Then phase moves to `AWAITING_EXCHANGE`.
**Warning signs:** Exchange test shows deck modified before reactions complete.

### Pitfall 3: Wrong Player Eliminates on Challenge Resolution

**What goes wrong:** When a challenge succeeds (challenged player bluffing), the wrong player loses the card.
**Why it happens:** Challenge resolution logic confuses "challenger" with "challenged".
**How to avoid:** In `RESOLVING_CHALLENGE`, track which player was challenged via `pendingAction.playerId` and which player challenged via the reactions map. If bluffing: `pendingAction.playerId` loses influence. If not bluffing: challenger loses influence and challenged player draws a replacement card.
**Warning signs:** Test for CHAL-02 behavior fails or asserts wrong player.

### Pitfall 4: Block Resolution Not Cancelling the Action

**What goes wrong:** After a successful block (blocker proves card, challenger loses), the original action still resolves.
**Why it happens:** Action resolution logic does not check whether a block was active.
**How to avoid:** After `RESOLVING_BLOCK_CHALLENGE` where blocker wins — transition to `AWAITING_ACTION` (next turn) WITHOUT calling the original action's resolution handler.
**Warning signs:** Target gets assassinated/stolen from even though they blocked.

### Pitfall 5: PendingReactions Map Not Reset Between Turns

**What goes wrong:** Old reaction statuses carry over to the next turn — players show as already having passed.
**Why it happens:** `pendingAction` set to `null` but reactions map not explicitly reset.
**How to avoid:** Setting `pendingAction: null` clears the whole record. Verify in tests that new turn starts with fresh `pendingAction` every time.
**Warning signs:** Reaction window closes immediately on second turn with no player input.

### Pitfall 6: Eliminated Players Still Counted in Reaction Window

**What goes wrong:** A 3-player game where one player is eliminated still waits for 2 reactions (should be 1).
**Why it happens:** `pendingReactions` map built from `state.players` without filtering `eliminated: true`.
**How to avoid:** Build initial `pendingReactions` as `state.players.filter(p => !p.eliminated && p.id !== activePlayerId)`.
**Warning signs:** Game stalls after first elimination.

### Pitfall 7: Shuffle Bias with `sort(() => Math.random() - 0.5)`

**What goes wrong:** Deck is not uniformly distributed — some orderings appear more frequently.
**Why it happens:** V8's sort algorithm is not guaranteed stable and the comparator is not transitive.
**How to avoid:** Use Fisher-Yates exclusively. Never use sort-based shuffle.
**Warning signs:** Statistical test on 10,000 shuffles shows non-uniform distribution.

---

## Code Examples

### Deck Initialization

```typescript
// Source: standard Fisher-Yates — verified pattern
import { CardType } from "@coup/shared"
import type { Card } from "@coup/shared"

function buildDeck(): Card[] {
  const types: CardType[] = [
    CardType.DUKE, CardType.ASSASSIN, CardType.CAPTAIN,
    CardType.AMBASSADOR, CardType.CONTESSA,
  ]
  return types.flatMap(type => Array.from({ length: 3 }, () => ({ type, revealed: false })))
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
```

### initGame Skeleton

```typescript
import type { LobbyPlayer } from "@coup/shared"
import { GamePhase } from "@coup/shared"
import type { GameState, PlayerState } from "@coup/shared"

export function initGame(roomId: string, lobbyPlayers: LobbyPlayer[]): GameState {
  const deck = buildDeck()
  shuffleInPlace(deck)

  const players: PlayerState[] = lobbyPlayers.map(lp => ({
    id: lp.playerId,
    name: lp.name,
    coins: 2,
    eliminated: false,
    hand: [deck.pop()!, deck.pop()!],
  }))

  shuffleInPlace(players) // INIT-04: random turn order

  return {
    roomId,
    players,
    phase: GamePhase.AWAITING_ACTION,
    activePlayerId: players[0].id,
    pendingAction: null,
    deck,
    log: ["Game started"],
  }
}
```

**Note:** `deck.pop()` deals from the end of the shuffled array — equivalent to dealing from top of deck. After dealing 2 cards × N players, the remaining deck stays in `GameState.deck`.

### processAction Entry Point Skeleton

```typescript
type ActionResult = { ok: true; state: GameState } | { ok: false; error: string }

export function processAction(state: GameState, action: GameAction): ActionResult {
  // Guard: validate actor is allowed to act in this phase
  const key = `${state.phase}:${action.type}` as const
  const handler = transitionMap[key]
  if (!handler) {
    return { ok: false, error: `${action.type} is not valid in phase ${state.phase}` }
  }
  return handler(state, action)
}
```

### Test Factory Pattern (follows project-state.test.ts)

```typescript
// Source: established pattern in apps/backend/src/__tests__/project-state.test.ts
function makeGameState(overrides?: Partial<GameState>): GameState {
  return {
    roomId: "room-test",
    players: [
      { id: "p1", name: "Alice", coins: 2, eliminated: false, hand: [
        { type: CardType.DUKE, revealed: false },
        { type: CardType.CAPTAIN, revealed: false },
      ]},
      { id: "p2", name: "Bob", coins: 2, eliminated: false, hand: [
        { type: CardType.ASSASSIN, revealed: false },
        { type: CardType.CONTESSA, revealed: false },
      ]},
    ],
    phase: GamePhase.AWAITING_ACTION,
    activePlayerId: "p1",
    pendingAction: null,
    deck: [],
    log: [],
    ...overrides,
  }
}
```

### nextActivePlayer Utility

```typescript
// Skips eliminated players; wraps around
function nextActivePlayer(state: GameState): string {
  const alive = state.players.filter(p => !p.eliminated)
  const currentIndex = alive.findIndex(p => p.id === state.activePlayerId)
  const next = alive[(currentIndex + 1) % alive.length]
  return next.id
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| XState / Statecharts | Plain enum + transition map | ROADMAP decision | No runtime dependency; full TypeScript control |
| Mutable game state (class-based) | Pure functions returning new state | Phase 1 pattern (room-store) | Predictable, testable, serializable |
| `any`-typed action payloads | Discriminated union with `Extract<>` | TypeScript best practice | Compile-time exhaustiveness checking |

---

## GamePhase Transition Map (Complete Reference)

The full set of valid transitions for the FSM. This is the authoritative contract for `transitionMap` keys.

| From Phase | Action/Event | Guard | Next Phase |
|------------|-------------|-------|------------|
| `AWAITING_ACTION` | `INCOME` | is active player | `AWAITING_ACTION` (next turn) |
| `AWAITING_ACTION` | `FOREIGN_AID` | is active player | `AWAITING_REACTIONS` |
| `AWAITING_ACTION` | `TAX` | is active player | `AWAITING_REACTIONS` |
| `AWAITING_ACTION` | `STEAL` | is active player, has target | `AWAITING_REACTIONS` |
| `AWAITING_ACTION` | `ASSASSINATE` | is active player, coins ≥ 3, has target | `AWAITING_REACTIONS` |
| `AWAITING_ACTION` | `EXCHANGE` | is active player | `AWAITING_REACTIONS` |
| `AWAITING_ACTION` | `COUP` | is active player, coins ≥ 7, has target | `AWAITING_COUP_TARGET` (immediate, no reactions) |
| `AWAITING_REACTIONS` | `PASS` | is non-active player, not yet decided | stay `AWAITING_REACTIONS` or advance when all passed |
| `AWAITING_REACTIONS` | `CHALLENGE` | is non-active player, action is challengeable | `RESOLVING_CHALLENGE` |
| `AWAITING_REACTIONS` | `BLOCK` | is eligible blocker, action is blockable | `AWAITING_BLOCK_CHALLENGE` |
| `AWAITING_BLOCK_CHALLENGE` | `PASS` | is active player (or others), not yet decided | stay or → action cancelled if all pass |
| `AWAITING_BLOCK_CHALLENGE` | `CHALLENGE` | is active player | `RESOLVING_BLOCK_CHALLENGE` |
| `RESOLVING_CHALLENGE` | `LOSE_INFLUENCE` | is the challenged player (bluffing) OR challenger (failed) | `AWAITING_ACTION` (next turn) or `RESOLVING_ACTION` |
| `RESOLVING_BLOCK_CHALLENGE` | `LOSE_INFLUENCE` | is blocker (bluffing) OR challenger (failed) | `AWAITING_ACTION` or `RESOLVING_ACTION` |
| `AWAITING_COUP_TARGET` | `LOSE_INFLUENCE` | is the coup target | `AWAITING_ACTION` (next turn) |
| `RESOLVING_ACTION` | internal | — | depends on action type |
| `AWAITING_EXCHANGE` | `EXCHANGE_CHOOSE` | is active player, picks 2 of 4 valid indices | `AWAITING_ACTION` (next turn) |

**Special case — COUP:** Coup has 7-coin cost, no reaction window, no challenge/block. It goes directly to `AWAITING_COUP_TARGET` where the target selects which card to lose. This simplifies the flow significantly.

**Special case — INCOME:** No reaction window. Resolves immediately with no transition through `AWAITING_REACTIONS`.

---

## Open Questions

1. **`LOSE_INFLUENCE` — who triggers it?**
   - What we know: When a player must lose influence (from failed challenge, Coup, Assassinate) they choose which card to reveal — this is INFL-02.
   - What's unclear: In Phase 3 (pure FSM, no UI), should `LOSE_INFLUENCE` be modeled as an action the player sends, or should the FSM auto-select the first unrevealed card?
   - Recommendation: Model as `{ type: "LOSE_INFLUENCE", playerId, cardIndex }` action — the player selects which card. In full-game tests, the test can send any valid `cardIndex`. This prepares Phase 4 (socket) cleanly.

2. **Forced Coup at 10+ coins**
   - What we know: TURN-02 says Coup is mandatory with 10+ coins — player must Coup, cannot choose other actions.
   - What's unclear: Whether Phase 3 enforces this or Phase 4.
   - Recommendation: Enforce in `processAction` guard for `AWAITING_ACTION` — if `activePlayer.coins >= 10` and `action.type !== "COUP"`, return `{ ok: false, error: "Must coup with 10+ coins" }`. Simple guard.

3. **Block of Steal: Captain OR Ambassador**
   - What we know: Both Captain and Ambassador can block Steal (CHAL-03).
   - What's unclear: Does blocking with Ambassador count as using the Ambassador character (challengeable with Ambassador) or Captain?
   - Recommendation: Block is challengeable on the claimed card — if blocker claims Captain, challenger looks for Captain; if claims Ambassador, challenger looks for Ambassador. Store `blockerClaimedCard` in `PendingAction`.

---

## Environment Availability

Step 2.6: No new external dependencies. All tools confirmed present.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest, tsx | ✓ | (project active) | — |
| Vitest | All tests | ✓ | `^4.1.2` | — |
| TypeScript | FSM types | ✓ | (project active) | — |

No missing dependencies.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `apps/backend/vitest.config.ts` |
| Quick run command | `cd apps/backend && npx vitest run src/__tests__/fsm-game-init.test.ts` |
| Full suite command | `npm run test` (from root, runs all workspaces) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INIT-01 | Deck has exactly 15 cards, 3× each type, all `revealed: false` | unit | `npx vitest run src/__tests__/fsm-game-init.test.ts` | ❌ Wave 0 |
| INIT-01 | `buildDeck()` contains correct distribution | unit | same | ❌ Wave 0 |
| INIT-02 | Each player has exactly 2 cards and 2 coins after `initGame()` | unit | `npx vitest run src/__tests__/fsm-game-init.test.ts` | ❌ Wave 0 |
| INIT-02 | No card appears in two players' hands | unit | same | ❌ Wave 0 |
| INIT-04 | Turn order differs across repeated `initGame()` calls (probabilistic) | unit | same | ❌ Wave 0 |

Additional behavioral tests needed (not directly tied to INIT-xx but required by phase scope):

| Behavior | Test Type | File |
|----------|-----------|------|
| `processAction` returns error for wrong-phase action | unit | `fsm-transitions.test.ts` |
| `processAction` returns error for wrong-player action | unit | `fsm-transitions.test.ts` |
| INCOME increments coins by 1, advances turn | unit | `fsm-transitions.test.ts` |
| FOREIGN_AID enters `AWAITING_REACTIONS` phase | unit | `fsm-transitions.test.ts` |
| All players PASS → action resolves | unit | `fsm-transitions.test.ts` |
| CHALLENGE → `RESOLVING_CHALLENGE` | unit | `fsm-transitions.test.ts` |
| BLOCK → `AWAITING_BLOCK_CHALLENGE` | unit | `fsm-transitions.test.ts` |
| BLOCK + CHALLENGE → `RESOLVING_BLOCK_CHALLENGE` | unit | `fsm-transitions.test.ts` |
| Successful challenge: action cancelled, player loses influence | unit | `fsm-transitions.test.ts` |
| Failed challenge: challenger loses influence, action resolves | unit | `fsm-transitions.test.ts` |
| EXCHANGE: cards drawn only after all reactions pass | unit | `fsm-transitions.test.ts` |
| EXCHANGE_CHOOSE: player returns 2 cards to deck | unit | `fsm-transitions.test.ts` |
| LOSE_INFLUENCE with 1 remaining card: player is eliminated | unit | `fsm-transitions.test.ts` |
| Eliminated player skipped in turn advance | unit | `fsm-transitions.test.ts` |
| Last alive player → `GAME_OVER` with winner | unit | `fsm-transitions.test.ts` |
| Full 2-player game reaches `GAME_OVER` | integration | `fsm-full-game.test.ts` |

### Sampling Rate

- **Per task commit:** `cd apps/backend && npx vitest run`
- **Per wave merge:** `npm run test` (root — all workspaces)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/backend/src/__tests__/fsm-game-init.test.ts` — covers INIT-01, INIT-02, INIT-04
- [ ] `apps/backend/src/__tests__/fsm-transitions.test.ts` — covers all phase transitions
- [ ] `apps/backend/src/__tests__/fsm-full-game.test.ts` — covers end-to-end 2-player scenario

No framework gaps — Vitest is installed and `vitest.config.ts` already includes `src/**/*.test.ts`.

---

## Project Constraints (from CLAUDE.md)

Extracted from user's global `~/.claude/CLAUDE.md`:

| Directive | Applies to Phase 3 |
|-----------|-------------------|
| TypeScript preferred, avoid `any` | All FSM types must be explicit — use discriminated unions, `Extract<>`, no `any` |
| `camelCase` for functions/variables, `PascalCase` for types/interfaces | `initGame`, `processAction`, `GameAction`, `ActionResult` etc. |
| `kebab-case` for file names | `game-engine.ts`, `fsm-transitions.test.ts` — correct |
| TDD mandatory: Red → Green → Refactor | Write all test files BEFORE implementation files |
| Vitest for JS/TS tests | Confirmed — Vitest 4.1.2 already installed |
| Commits atomic, Conventional Commits | `feat: implement game FSM engine`, `test: add fsm transition tests` |
| Never commit without explicit confirmation | Researcher/planner does not auto-commit code |
| No unnecessary comments — code is self-explanatory | Transition map keys serve as documentation; no inline prose comments |
| `const` over `let`, ES Modules (`import/export`) | All FSM code uses `const` handlers, ESM exports |

---

## Sources

### Primary (HIGH confidence)

- `packages/shared/src/types/game-state.ts` — `GamePhase` enum (10 phases), `GameState`, `PlayerState`, `PendingAction` interfaces — read directly
- `packages/shared/src/types/card.ts` — `CardType` enum, `Card` interface — read directly
- `apps/backend/src/rooms/room-store.ts` — pure function pattern, `{ ok: true } | { ok: false; error }` result type — read directly
- `apps/backend/src/__tests__/project-state.test.ts` — `makeTestGameState()` factory pattern — read directly
- `apps/backend/src/__tests__/room-store.test.ts` — `beforeEach(rooms.clear())` reset pattern — read directly
- `apps/backend/vitest.config.ts` — test glob `src/**/*.test.ts`, globals: true — read directly
- `apps/backend/package.json` — Vitest 4.1.2, nanoid 3.3.11, uuid 13.0.0 — read directly
- `.planning/phases/03-game-engine-fsm/03-CONTEXT.md` — locked decisions and discretion areas — read directly
- `.planning/STATE.md` — pitfall notes on Ambassador exchange and block-challenge — read directly

### Secondary (MEDIUM confidence)

- Fisher-Yates algorithm: standard well-known algorithm, documented in Knuth TAOCP Vol 2 §3.4.2 — no verification needed (mathematical proof, not API)
- Coup official rules: block/challenge eligibility table derived from Indie Boards & Cards rulebook knowledge (training data, HIGH confidence for base game rules)

### Tertiary (LOW confidence)

- None — all claims in this document are backed by direct code inspection or well-established algorithms.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and config files directly
- Architecture patterns: HIGH — derived from existing codebase patterns (room-store, project-state)
- Pitfalls: HIGH — derived from game rules + explicit STATE.md warnings + code inspection
- Transition map: HIGH — derived from official Coup rules and locked decisions in CONTEXT.md

**Research date:** 2026-04-02
**Valid until:** Stable — no external dependencies; valid until GamePhase enum changes in shared types
