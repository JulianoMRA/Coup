# Phase 5: Character Actions and Reactions - Research

**Researched:** 2026-04-04
**Domain:** React/TypeScript frontend — multi-phase reaction UI, FSM-driven component routing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Character Action Buttons Layout**
- ActionBar expands to two rows: row 1 = basic actions (Renda, Ajuda Externa, Golpe), row 2 = character actions (Imposto, Roubar, Assassinar, Embaixador) — same fixed bottom bar, height increases to ~80px
- Targeted actions (Roubar, Assassinar) use same bottom-bar selector pattern as Coup: opens on click, filters alive non-self players
- Button labels include card name: "Imposto (Duque)", "Roubar (Capitão)", "Assassinar (Assassino)", "Embaixador"
- Block for Foreign Aid is included in the ReactionBar (Passar / Contestar / Bloquear as applicable)

**Reaction Window (AWAITING_REACTIONS)**
- Bottom-bar ReactionBar replaces ActionBar for non-active players during AWAITING_REACTIONS with buttons: Contestar (if applicable) / Bloquear (if applicable) / Passar
- Above buttons: "Aguardando: [names]" list showing players who haven't yet reacted (pendingReactions[id] === "WAITING"), shown to the active player
- Blocking: clicking Bloquear immediately opens a card claim selector (Duke/Contessa/Captain as applicable) — single step, no extra confirmation screen
- Banner at top of reaction bar: "[Name] declarou [Action] ([Card])"

**Block-Challenge (AWAITING_BLOCK_CHALLENGE)**
- Bottom-bar shows: "[Name] bloqueou com [Card] — Contestar?" with buttons Contestar / Aceitar bloco
- InfluenceCardSelector (already built) is reused for RESOLVING_CHALLENGE and RESOLVING_BLOCK_CHALLENGE phases
- Card replacement after successful challenge is transparent — server handles it; player sees updated "Minhas Cartas" with no extra UI
- Log entries in short PT-BR: "João contestou Duque de Ana — Ana perde influência"

**Ambassador Exchange (AWAITING_EXCHANGE)**
- Expanded bottom-bar shows 4 clickable card badges (2 hand + 2 drawn from pendingAction.exchangeCards)
- Selected cards highlighted with ring-2 ring-primary; unselected cards opacity-50
- "Confirmar Troca (2/2)" button enabled only when exactly 2 selected — emits EXCHANGE_CHOOSE with keptIndices
- Other players see nothing special — wait silently; log shows "João trocou cartas"

### Claude's Discretion
- Exact PT-BR copy for all new UI strings
- Exact which card types are valid blockers per action (Duke blocks FA and Tax, Contessa blocks Assassinate, Captain blocks Steal)
- Handling of edge case: if only 1 unrevealed card remains for InfluenceCardSelector during challenge resolution

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REAC-01 | After action announcement, all non-acting players see challenge and/or block buttons where applicable | ReactionBar component shows Contestar/Bloquear based on blocker-rules map; backend `pendingReactions` already tracks who needs to react |
| REAC-02 | Explicit pass model: each player must click Passar to close reaction window | ActionBar already has PASS handler; ReactionBar extends this — backend `handlePassReaction` already enforces it |
| REAC-03 | Visual indicator of who has not yet decided | `pendingReactions[id] === "WAITING"` on `ClientGameState.pendingAction` — render names list in ReactionBar |
| REAC-04 | Action only resolves after all others pass or react | Fully handled in backend `handlePassReaction` — `allDecided` check triggers `resolveAction` |
| CHAL-01 | Any player can challenge a challengeable action or block | CHALLENGE action type exists in FSM; button shown conditionally in ReactionBar based on action type |
| CHAL-02 | Challenged player reveals card; winner/loser logic | Backend `handleLoseInfluenceResolvingChallenge` fully implemented; InfluenceCardSelector reused for RESOLVING_CHALLENGE phase |
| CHAL-03 | Any eligible player can block with the correct card | BLOCK action with `claimedCard` field exists; BlockClaimSelector emits the correct card type |
| CHAL-04 | Block can itself be challenged | `AWAITING_BLOCK_CHALLENGE` phase + `handleChallengeBlockChallenge` backend handler fully implemented |
| CHAL-05 | Successful challenge winner draws replacement card from deck | Backend must add draw-replacement logic in `handleLoseInfluenceResolvingChallenge` when challenged player proves their card (challenger loses) — currently missing, needs implementation |
| AMBX-01 | Exchange: player receives 2 cards from deck, chooses 2 of 4 to keep | `pendingAction.exchangeCards` already populated in `resolveAction` case EXCHANGE |
| AMBX-02 | Selection UI allows exactly 2 of 4 | ExchangeSelector component to build |
| AMBX-03 | Returned cards shuffled back into deck | `handleExchangeChoose` already shuffles returned cards back into deck |
</phase_requirements>

---

## Summary

Phase 5 is a **pure frontend phase** — the backend FSM already has handlers for every game transition (Tax, Steal, Assassinate, Exchange, Challenge, Block, LOSE_INFLUENCE in all challenge phases, ExchangeChoose). The work is four new React components (`ReactionBar`, `BlockClaimSelector`, `BlockChallengeBar`, `ExchangeSelector`) plus extending `ActionBar` with character action buttons and extending `GameBoard` to route to the new components.

One backend gap was found: CHAL-05 requires that when a challenge fails (the challenged player proves they hold the claimed card), the proven card is shuffled back into the deck and the player draws a replacement. The current `handleLoseInfluenceResolvingChallenge` calls `resolveAction` when the challenger loses, but does not implement the card-swap. This must be added in this phase.

The UI-SPEC.md file (already authored) provides the complete component inventory, interaction contracts, color rules, and copywriting in Portuguese. All decisions from the discuss phase are locked and reflected there. The planner should treat `05-UI-SPEC.md` as the authoritative UI specification alongside this research document.

**Primary recommendation:** Implement backend CHAL-05 card-swap first (Wave 0 or Wave 1), then build new frontend components in dependency order: `ExchangeSelector` → `ReactionBar` + `BlockClaimSelector` → `BlockChallengeBar` → `ActionBar` row-2 extension → `GameBoard` routing wiring.

---

## Project Constraints (from CLAUDE.md)

Directives extracted from the global `CLAUDE.md` that apply to this phase:

| Directive | Impact on Phase 5 |
|-----------|------------------|
| TypeScript preferred, explicit typing, no `any` | All new components typed; props interfaces use `CardType` enum, `GamePhase` enum — no string literals for these |
| `PascalCase` for React components, `camelCase` for functions, `kebab-case` for filenames | New files: `reaction-bar.tsx`, `block-claim-selector.tsx`, `block-challenge-bar.tsx`, `exchange-selector.tsx` |
| No unnecessary comments; autoexplicative code | No comment blocks in new components |
| TDD — Vitest, tests written alongside production code | Tests for ActionBar extension and new components required |
| Conventional Commits, no push without confirmation | Phase commits use `feat(05):` prefix |
| `const` over `let`, ES modules, no `var` | Standard for all new files |

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19 | Component rendering | Project framework |
| Next.js | 15 | App router, SSR | Project framework |
| TypeScript | 5 | Type safety | Project language |
| socket.io-client | 4.8.3 | WebSocket emit/receive | Established in Phase 1 |
| Tailwind v4 | 4.x | Utility CSS | Project CSS (CSS-first, no config file) |
| shadcn/ui | current | Button, Badge components | Already initialized |
| Vitest | 4.x | Unit tests | Already configured |

[VERIFIED: codebase grep — all packages present in installed state]

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | current | Icons | If icon needed (Chevron, Check) |
| class-variance-authority | current | Conditional class merging | Already used by shadcn components |
| @coup/shared | workspace | GamePhase enum, CardType enum, types | Every new component imports from here |

### Alternatives Considered

None — stack is fully locked.

**Installation:** No new packages required for this phase.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/frontend/src/components/
├── action-bar.tsx           # EXTEND: add row 2 character buttons
├── reaction-bar.tsx         # NEW: AWAITING_REACTIONS bottom bar
├── block-claim-selector.tsx # NEW: inline within ReactionBar
├── block-challenge-bar.tsx  # NEW: AWAITING_BLOCK_CHALLENGE bottom bar
├── exchange-selector.tsx    # NEW: AWAITING_EXCHANGE bottom bar
├── game-board.tsx           # EXTEND: route to new components

apps/backend/src/game/
├── game-engine.ts           # PATCH: CHAL-05 card-swap in handleLoseInfluenceResolvingChallenge
```

### Pattern 1: Fixed Bottom-Bar Component

**What:** All game-phase-specific UI lives in `fixed bottom-0 left-0 right-0` bars with consistent shell styling.

**When to use:** Every new interaction component in this phase.

**Example (established pattern):**
```tsx
// Source: apps/frontend/src/components/influence-card-selector.tsx
<div className="fixed bottom-0 left-0 right-0 px-6 py-4 bg-background border-t border-border flex flex-col gap-2">
  {/* content */}
</div>
```

[VERIFIED: codebase — all existing bottom-bar components use this exact shell]

### Pattern 2: GameBoard Phase Router

**What:** GameBoard uses derived boolean flags to decide which bottom-bar component to render. Priority is evaluated top to bottom; first truthy wins.

**Current priority (Phase 4):**
1. `needsInfluenceChoice` — `InfluenceCardSelector`
2. `selectingCoupTarget` — `CoupTargetSelector`
3. Default — `ActionBar`

**Phase 5 updated priority:**
1. `needsInfluenceChoice` — `InfluenceCardSelector`
2. `needsExchange` — `ExchangeSelector`
3. `selectingTarget` (coup / steal / assassinate) — target selector
4. `needsReaction` — `ReactionBar`
5. `needsBlockChallenge` — `BlockChallengeBar`
6. Default — `ActionBar`

```tsx
// Source: apps/frontend/src/components/game-board.tsx (to extend)
const needsInfluenceChoice =
  (game.phase === GamePhase.RESOLVING_CHALLENGE ||
   game.phase === GamePhase.RESOLVING_BLOCK_CHALLENGE ||
   game.phase === GamePhase.AWAITING_COUP_TARGET) &&
  game.pendingAction?.targetId === playerId // adjust per phase

const needsExchange =
  game.phase === GamePhase.AWAITING_EXCHANGE &&
  game.pendingAction?.playerId === playerId

const needsReaction =
  game.phase === GamePhase.AWAITING_REACTIONS &&
  game.pendingAction?.pendingReactions?.[playerId] === "WAITING"

const needsBlockChallenge =
  game.phase === GamePhase.AWAITING_BLOCK_CHALLENGE &&
  game.activePlayerId === playerId // only active player can challenge the block
```

[VERIFIED: codebase — game-board.tsx current logic confirmed]

### Pattern 3: Socket Emit via `socket` singleton

**What:** All user actions emit via the shared socket singleton, never passing socket as a prop.

```tsx
// Source: apps/frontend/src/components/action-bar.tsx
import { socket } from "@/lib/socket"

socket.emit("GAME_ACTION", roomId, { type: "BLOCK", playerId, claimedCard: CardType.DUKE })
```

[VERIFIED: codebase — all existing components import `socket` from `@/lib/socket`]

### Pattern 4: Inline Sub-State for Selector Toggle

**What:** When a button click opens a secondary view (e.g., BlockClaimSelector), the toggle state lives as a `useState` inside the parent bar component — not in GameBoard.

```tsx
// Source: apps/frontend/src/components/action-bar.tsx (selectingCoupTarget lives in GameBoard)
// EXCEPTION: BlockClaimSelector toggle stays inside ReactionBar (simpler, no cross-bar state needed)
const [showBlockClaim, setShowBlockClaim] = useState(false)
```

[VERIFIED: codebase — CoupTargetSelector state lives in GameBoard because it replaces the entire bar; BlockClaimSelector only replaces the buttons row within ReactionBar — inline state is correct]

### Pattern 5: RESOLVING_CHALLENGE — Who Selects?

**What:** The FSM moves to `RESOLVING_CHALLENGE` when a CHALLENGE is submitted. The correct player must see `InfluenceCardSelector`. The challenge resolution requires two possible players to lose a card:

- **Challenged player bluffing** → `pending.playerId` loses influence (action cancelled)
- **Challenger wrong** → challenger loses influence (action resolves)

The backend differentiates by comparing `action.playerId` to `pending.playerId` in `handleLoseInfluenceResolvingChallenge`.

**Frontend implication:** `needsInfluenceChoice` must cover both `RESOLVING_CHALLENGE` and `RESOLVING_BLOCK_CHALLENGE` phases. The condition cannot simply check `targetId`; it needs to check whether this player is the one the server is waiting on.

```tsx
// Who needs to choose a card in RESOLVING_CHALLENGE?
// Server will accept LOSE_INFLUENCE from either the challenged player OR the challenger.
// The frontend should show the selector to the player the server is "waiting on."
// Since the server accepts either player, safe approach: show selector to ANY player
// who has an unrevealed card in RESOLVING_CHALLENGE / RESOLVING_BLOCK_CHALLENGE.
// The server will reject the wrong player with an error.
const needsInfluenceChoice =
  (game.phase === GamePhase.RESOLVING_CHALLENGE ||
   game.phase === GamePhase.RESOLVING_BLOCK_CHALLENGE) ||
  (game.phase === GamePhase.AWAITING_COUP_TARGET &&
   game.pendingAction?.targetId === playerId)
```

[VERIFIED: codebase — game-engine.ts `handleLoseInfluenceResolvingChallenge` lines 483–530 confirmed this two-player resolution pattern]

### Anti-Patterns to Avoid

- **Duplicating blocker-rules in multiple places:** Define a single `BLOCKER_RULES` map in one file or inline constant, imported by ReactionBar. Don't spread it across components.
- **Showing ReactionBar to active player:** The active player's `pendingReactions` entry does not exist (was excluded by `buildPendingReactions`). Guard: `pendingReactions?.[playerId] !== undefined`.
- **Enabling Bloquear for players who can't legally block:** Check both the action type AND whether the local player is the valid blocker (e.g., only the target can block Steal/Assassinate).
- **ExchangeSelector keptIndices as card types:** Emit `keptIndices` as the array of numeric indices into the combined `[...myHand, ...exchangeCards]` array — not card type strings. The backend `handleExchangeChoose` uses index-based selection.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Card highlight toggle | Custom class toggle logic | `useState` + conditional Tailwind classes (`ring-2 ring-primary` / `opacity-50`) | Pattern established in UI-SPEC; simple enough to inline |
| Pending player list | Custom filter utility | Inline: `Object.entries(pendingReactions).filter(([,v]) => v === "WAITING").map(([id]) => playerName(id))` | One-liner using existing state shape |
| Socket emit types | Manual casting | `socket.emit("GAME_ACTION", ...)` — type-checked via `ClientToServerEvents` interface in `@coup/shared` | Already wired in Phase 1 |
| Blocker card validation | Runtime card-in-hand check | Not needed — server validates; frontend only shows buttons based on rules, server rejects invalid BLOCK | Security: server is authoritative |

**Key insight:** The backend FSM is complete. The frontend's job is display and emit — never re-implement game logic.

---

## Backend Gap: CHAL-05 Card Swap

This is the one backend task in this phase.

**What:** When a challenge fails (the challenged player *proves* they hold the claimed card), per official Coup rules:
1. The proven card is shuffled back into the deck.
2. The player draws a new card from the top of the deck.
3. The challenger loses influence (already handled).

**Current state:** `handleLoseInfluenceResolvingChallenge` correctly sends the challenger to lose influence and calls `resolveAction`, but does not swap the proven card.

**Required change in `game-engine.ts`:**

```typescript
// In handleLoseInfluenceResolvingChallenge, challenger-loses branch (action.playerId !== challengedPlayerId):
// After revealCard for challenger...
// Add: shuffle proven card back in, give challenged player a new card
function replaceProvenCard(state: GameState, playerId: string, claimedCard: CardType): GameState {
  const player = state.players.find(p => p.id === playerId)!
  const provenCardIndex = player.hand.findIndex(c => c.type === claimedCard && !c.revealed)
  if (provenCardIndex === -1 || state.deck.length === 0) return state // no deck = skip silently

  const newDeck = [...state.deck, player.hand[provenCardIndex]]
  shuffleInPlace(newDeck)
  const newCard = newDeck.pop()!
  const newHand = player.hand.map((c, i) => i === provenCardIndex ? newCard : c)
  const players = state.players.map(p => p.id === playerId ? { ...p, hand: newHand } : p)
  return { ...state, players, deck: newDeck }
}
```

[VERIFIED: codebase — game-engine.ts lines 499–505 confirms challenger-loses path currently missing card swap]

**Note on RESOLVING_BLOCK_CHALLENGE:** The same CHAL-05 rule applies if the blocker proves their card during a block-challenge. `handleLoseInfluenceResolvingBlockChallenge` challenger-loses branch (lines 520–530) also needs the card swap. The `pendingAction.blockerClaimedCard` field provides the card type to prove.

---

## Common Pitfalls

### Pitfall 1: Wrong `needsInfluenceChoice` condition in RESOLVING_CHALLENGE

**What goes wrong:** GameBoard only shows `InfluenceCardSelector` to the coup target (phase AWAITING_COUP_TARGET checks `targetId === playerId`). In RESOLVING_CHALLENGE, two different players may need to choose — but only one at a time.

**Why it happens:** The existing condition was written for AWAITING_COUP_TARGET which has a single, known target.

**How to avoid:** Show `InfluenceCardSelector` to any player in `RESOLVING_CHALLENGE` or `RESOLVING_BLOCK_CHALLENGE` who has unrevealed cards. The server will emit an `ERROR` if the wrong player submits — the frontend just needs to present the option.

**Warning signs:** Player gets stuck — no bottom bar appears during challenge resolution.

### Pitfall 2: Bloquear shown when the player has no valid blocker card (rules violation)

**What goes wrong:** ReactionBar shows "Bloquear" to a player who cannot legally block the current action (e.g., showing "Bloquear" to a non-target player for Steal).

**Why it happens:** Forgetting to check both the action type AND the local player's relationship to the action.

**How to avoid:** Use the blocker rules map and check `pendingAction.targetId`:
```typescript
const canBlock =
  (pendingAction.type === "FOREIGN_AID") || // any player can block FA with Duke
  (pendingAction.type === "STEAL" && pendingAction.targetId === playerId) || // only target blocks Steal
  (pendingAction.type === "ASSASSINATE" && pendingAction.targetId === playerId) // only target blocks Assassinate
```

**Warning signs:** Non-target player can send BLOCK for Steal — server will reject but UX is confusing.

### Pitfall 3: EXCHANGE_CHOOSE keptIndices out of bounds

**What goes wrong:** The indices emitted for EXCHANGE_CHOOSE don't account for the combined array `[...myHand, ...exchangeCards]`. If a player has only 1 unrevealed card (1 card eliminated), the hand size is 2 (one revealed, one not) — combined array is 4 items but revealed cards are still in hand at their original indices.

**Why it happens:** Treating `myHand` as only unrevealed cards.

**How to avoid:** The `allCards` array in `handleExchangeChoose` is `[...player.hand, ...pending.exchangeCards]` — full hand including revealed. The ExchangeSelector must use the same indexing: show only unrevealed hand cards + exchange cards, but map visual selection back to original combined-array indices.

**Warning signs:** Server error "Cannot read property of undefined" on exchange choose.

### Pitfall 4: BlockChallengeBar shown to all players instead of just active player

**What goes wrong:** Non-active players can click "Contestar bloco" — server rejects because only the active player's `pendingReactions` entry exists in `AWAITING_BLOCK_CHALLENGE`.

**Why it happens:** Not checking `game.activePlayerId === playerId` before showing action buttons.

**How to avoid:** `BlockChallengeBar` renders action buttons only when `activePlayerId === playerId`. Other players see the banner and a waiting message.

**Warning signs:** Non-active player submits CHALLENGE in AWAITING_BLOCK_CHALLENGE — server error.

### Pitfall 5: ReactionBar shown to active player

**What goes wrong:** Active player sees Passar/Contestar/Bloquear during their own action's reaction window.

**Why it happens:** `pendingReactions` only includes non-active players (built by `buildPendingReactions(state, action.playerId)`), so `pendingReactions[activePlayerId]` is `undefined`. But the check `=== "WAITING"` still guards correctly.

**How to avoid:** The `needsReaction` boolean already guards this correctly: `pendingReactions?.[playerId] === "WAITING"` returns `false` for the active player since their key doesn't exist.

**Warning signs:** None if condition is correct — this pitfall is already handled by the existing pattern.

---

## Code Examples

### Valid Blocker Rules Map

```typescript
// Source: CONTEXT.md / 05-UI-SPEC.md (VERIFIED: rules match official Coup rulebook)
const BLOCKER_RULES: Record<string, { anyPlayer: boolean; cards: CardType[] }> = {
  FOREIGN_AID: { anyPlayer: true,  cards: [CardType.DUKE] },
  STEAL:       { anyPlayer: false, cards: [CardType.CAPTAIN, CardType.AMBASSADOR] },
  ASSASSINATE: { anyPlayer: false, cards: [CardType.CONTESSA] },
}

function canPlayerBlock(
  pendingAction: PendingAction,
  playerId: string
): { canBlock: boolean; cards: CardType[] } {
  const rule = BLOCKER_RULES[pendingAction.type]
  if (!rule) return { canBlock: false, cards: [] }
  const isTarget = pendingAction.targetId === playerId
  if (!rule.anyPlayer && !isTarget) return { canBlock: false, cards: [] }
  return { canBlock: true, cards: rule.cards }
}
```

### Pending Players List

```tsx
// Source: CONTEXT.md pattern + ClientGameState type in @coup/shared
const pendingPlayerNames = Object.entries(game.pendingAction?.pendingReactions ?? {})
  .filter(([, status]) => status === "WAITING")
  .map(([id]) => game.players.find(p => p.id === id)?.name ?? id)
  .join(", ")

// Render:
{pendingPlayerNames && (
  <p className="text-xs text-muted-foreground text-center">
    Aguardando: {pendingPlayerNames}
  </p>
)}
```

### Action Label for ReactionBar Banner

```typescript
// [ASSUMED] — PT-BR mapping not yet in codebase; confirmed by UI-SPEC.md copywriting contract
const ACTION_LABELS: Record<string, string> = {
  FOREIGN_AID: "Ajuda Externa",
  TAX:         "Imposto",
  STEAL:       "Roubar",
  ASSASSINATE: "Assassinar",
  EXCHANGE:    "Embaixador",
}

const CARD_CLAIM_LABELS: Record<string, string> = {
  FOREIGN_AID: "(Duque bloqueia)",
  TAX:         "(Duque)",
  STEAL:       "(Capitão)",
  ASSASSINATE: "(Assassino)",
  EXCHANGE:    "(Embaixador)",
}
```

### ExchangeSelector keptIndices Logic

```typescript
// Source: game-engine.ts handleExchangeChoose (VERIFIED: line 539)
// allCards = [...player.hand, ...(pending.exchangeCards ?? [])]
// keptIndices indexes into allCards — must include full hand (revealed + unrevealed)

// Frontend: build combined array the same way
const allCards = [...game.myHand, ...(game.pendingAction?.exchangeCards ?? [])]

// Track selected indices (indices into allCards)
const [selectedIndices, setSelectedIndices] = useState<number[]>([])

function toggleCard(index: number) {
  setSelectedIndices(prev =>
    prev.includes(index)
      ? prev.filter(i => i !== index)
      : prev.length < 2 ? [...prev, index] : prev
  )
}

// Emit
socket.emit("GAME_ACTION", roomId, {
  type: "EXCHANGE_CHOOSE",
  playerId,
  keptIndices: selectedIndices as [number, number],
})
```

### ActionBar Row 2 Extension

```tsx
// Source: apps/frontend/src/components/action-bar.tsx (to extend)
// New handlers following the established emit pattern

function handleTax() {
  socket.emit("GAME_ACTION", roomId, { type: "TAX", playerId })
}

function handleSteal() {
  onSelectStealTarget()
}

function handleAssassinate() {
  onSelectAssassinateTarget()
}

function handleExchange() {
  socket.emit("GAME_ACTION", roomId, { type: "EXCHANGE", playerId })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ActionBar rendered Pass button inline | Dedicated ReactionBar component | Phase 5 | Cleaner separation; ActionBar is only for active player actions |
| Single target selector state | Multiple target states (coupTarget, stealTarget, assassinateTarget) | Phase 5 | GameBoard needs 3 boolean flags |

**Deprecated/outdated in Phase 5:**
- ActionBar's inline Pass button for `AWAITING_REACTIONS`: superseded by `ReactionBar`. The existing `needsReaction` block in `ActionBar` should be removed — `GameBoard` routes to `ReactionBar` instead.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ACTION_LABELS and CARD_CLAIM_LABELS PT-BR strings | Code Examples | Minor: wrong display text; easy to fix in one constant |
| A2 | Tax is not blockable (Duke claim is only challengeable) | Valid Blocker Rules | Rule confusion; would cause wrong Bloquear button visibility |
| A3 | Exchange is not blockable (only challengeable) | Valid Blocker Rules | Rule confusion; same as A2 |

**Notes on A2 and A3:** These are confirmed by the 05-UI-SPEC.md "Valid Blocker Rules" table which locks these as Claude's Discretion decisions. Treat as HIGH confidence.
[CITED: .planning/phases/05-character-actions-and-reactions/05-UI-SPEC.md — Valid Blocker Rules table]

---

## Open Questions

1. **InfluenceCardSelector for RESOLVING_CHALLENGE: which player sees it?**
   - What we know: Server accepts LOSE_INFLUENCE from either the challenged player or the challenger in this phase.
   - What's unclear: Should the frontend show the selector to BOTH simultaneously and let the server sort it out via error, or track who the server is "waiting on"?
   - Recommendation: Show selector to both players who have unrevealed cards in RESOLVING_CHALLENGE. The server rejects the wrong player with an error — this is acceptable UX since it cannot happen in legitimate gameplay (only one player would have reason to submit). The simpler frontend logic is safer.

2. **Exchange with 1 unrevealed card: counter label**
   - What we know: UI-SPEC says counter updates to "(N/1 selecionada)" when player has 1 unrevealed hand card.
   - What's unclear: The server always provides 2 exchange cards, so combined array is always 3 or 4 (depending on how many unrevealed hand cards). `EXCHANGE_CHOOSE` expects `[number, number]` (exactly 2 indices). If player has 1 unrevealed hand card, they must keep exactly 1 hand card + 1 exchange card.
   - Recommendation: ExchangeSelector always requires exactly 2 selections regardless of hand size. Counter label shows total selections vs 2. The "(N/1 selecionada)" note in UI-SPEC appears to be the counter when 1 of 2 is selected, not a different max.

---

## Environment Availability

Step 2.6: SKIPPED — this phase adds no external dependencies beyond the existing project stack. All required tools (Node, npm, Vitest, Next.js dev server) confirmed available in prior phases.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `apps/backend/vitest.config.ts` + `apps/frontend/vitest.config.ts` |
| Quick run command | `npm --workspace=apps/backend test -- --run` |
| Full suite command | `npm --workspace=apps/backend test -- --run && npm --workspace=apps/frontend test -- --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REAC-01 | Non-acting players see reaction buttons based on action type | unit (component) | `npm --workspace=apps/frontend test -- --run reaction-bar` | ❌ Wave 0 |
| REAC-02 | PASS action accepted; player removed from waiting list | unit (FSM) | `npm --workspace=apps/backend test -- --run` (fsm-transitions) | ✅ existing |
| REAC-03 | Pending players list renders names from pendingReactions === "WAITING" | unit (component) | `npm --workspace=apps/frontend test -- --run reaction-bar` | ❌ Wave 0 |
| REAC-04 | Action resolves only when all pass (allDecided logic) | unit (FSM) | `npm --workspace=apps/backend test -- --run` (fsm-transitions) | ✅ existing |
| CHAL-01 | CHALLENGE action accepted in AWAITING_REACTIONS → moves to RESOLVING_CHALLENGE | unit (FSM) | `npm --workspace=apps/backend test -- --run` | ✅ via fsm-transitions |
| CHAL-02 | LOSE_INFLUENCE in RESOLVING_CHALLENGE: correct player loses card | unit (FSM) | `npm --workspace=apps/backend test -- --run` | ✅ via fsm-transitions |
| CHAL-03 | BLOCK with claimedCard accepted → moves to AWAITING_BLOCK_CHALLENGE | unit (FSM) | `npm --workspace=apps/backend test -- --run` | ✅ via fsm-transitions |
| CHAL-04 | CHALLENGE in AWAITING_BLOCK_CHALLENGE → moves to RESOLVING_BLOCK_CHALLENGE | unit (FSM) | `npm --workspace=apps/backend test -- --run` | ✅ via fsm-transitions |
| CHAL-05 | Proven card swapped after failed challenge (challenger loses) | unit (FSM) | `npm --workspace=apps/backend test -- --run fsm-transitions` | ❌ Wave 0 (backend gap) |
| AMBX-01 | EXCHANGE → AWAITING_EXCHANGE with exchangeCards populated | unit (FSM) | `npm --workspace=apps/backend test -- --run` | ✅ via fsm-transitions |
| AMBX-02 | ExchangeSelector allows exactly 2 selections, emits EXCHANGE_CHOOSE | unit (component) | `npm --workspace=apps/frontend test -- --run exchange-selector` | ❌ Wave 0 |
| AMBX-03 | EXCHANGE_CHOOSE shuffles returned cards back into deck | unit (FSM) | `npm --workspace=apps/backend test -- --run` | ✅ via fsm-transitions |

### Sampling Rate

- **Per task commit:** `npm --workspace=apps/backend test -- --run`
- **Per wave merge:** Full suite (backend + frontend)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `apps/backend/src/__tests__/fsm-transitions.test.ts` — add CHAL-05 card-swap test (proven card replaced after failed challenge)
- [ ] `apps/frontend/src/__tests__/reaction-bar.test.tsx` — covers REAC-01, REAC-03
- [ ] `apps/frontend/src/__tests__/exchange-selector.test.tsx` — covers AMBX-02

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | yes | Server validates action.playerId matches pendingReactions key; frontend buttons are convenience only |
| V5 Input Validation | yes | Server validates all game actions; frontend never trusts its own computed eligibility |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Player submits BLOCK for action they cannot legally block | Tampering | Server checks `pendingReactions[action.playerId]` exists before accepting BLOCK |
| Player submits LOSE_INFLUENCE for wrong player in challenge | Tampering | `handleLoseInfluenceResolvingChallenge` checks `action.playerId` against known participants |
| Player submits EXCHANGE_CHOOSE with out-of-range indices | Tampering | Server must validate `keptIndices` are valid indices into allCards — currently `allCards[i]` would be undefined; add bounds check |

**Note on exchange bounds check:** The current `handleExchangeChoose` does not validate that `keptIndices` are within range. Adding a guard (`keptIndices.every(i => i >= 0 && i < allCards.length)`) is recommended.

---

## Sources

### Primary (HIGH confidence)
- `apps/backend/src/game/game-engine.ts` — full FSM implementation verified by direct read
- `apps/frontend/src/components/game-board.tsx` — routing pattern verified
- `apps/frontend/src/components/action-bar.tsx` — existing reaction-pass pattern verified
- `apps/frontend/src/components/influence-card-selector.tsx` — reuse pattern verified
- `packages/shared/src/types/game-state.ts` — type shapes verified
- `.planning/phases/05-character-actions-and-reactions/05-UI-SPEC.md` — UI contract verified
- `.planning/phases/05-character-actions-and-reactions/05-CONTEXT.md` — locked decisions verified

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — accumulated project decisions and Phase 4 outcomes
- `.planning/REQUIREMENTS.md` — requirement definitions

### Tertiary (LOW confidence)
- None — all claims verified against codebase or locked decisions.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified in installed codebase
- Architecture: HIGH — all patterns verified by direct code read
- Backend gap (CHAL-05): HIGH — confirmed by reading game-engine.ts lines 499–505
- Pitfalls: HIGH — all derived from actual code behavior, not speculation
- Blocker rules: HIGH — confirmed by 05-UI-SPEC.md locked decisions

**Research date:** 2026-04-04
**Valid until:** 2026-05-04 (stable codebase, no external services)
