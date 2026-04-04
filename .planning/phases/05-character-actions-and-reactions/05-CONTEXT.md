# Phase 5: Character Actions and Reactions - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the complete Coup ruleset frontend. The backend FSM already has all handlers (Tax, Steal, Assassinate, Exchange, Challenge, Block, LOSE_INFLUENCE resolution, ExchangeChoose). Phase 5 is 100% frontend: new action buttons, reaction window UI, block-challenge UI, and Ambassador exchange UI.

</domain>

<decisions>
## Implementation Decisions

### Character Action Buttons Layout
- ActionBar expands to two rows: row 1 = basic actions (Renda, Ajuda Externa, Golpe), row 2 = character actions (Imposto, Roubar, Assassinar, Embaixador) — same fixed bottom bar, height increases to ~80px
- Targeted actions (Roubar, Assassinar) use same bottom-bar selector pattern as Coup: opens on click, filters alive non-self players
- Button labels include card name: "Imposto (Duque)", "Roubar (Capitão)", "Assassinar (Assassino)", "Embaixador"
- Block for Foreign Aid is included in the ReactionBar (Passar / Contestar / Bloquear as applicable)

### Reaction Window (AWAITING_REACTIONS)
- Bottom-bar ReactionBar replaces ActionBar for non-active players during AWAITING_REACTIONS with buttons: Contestar (if applicable) / Bloquear (if applicable) / Passar
- Above buttons: "Aguardando: [names]" list showing players who haven't yet reacted (pendingReactions[id] === "WAITING"), shown to the active player
- Blocking: clicking Bloquear immediately opens a card claim selector (Duke/Contessa/Captain as applicable) — single step, no extra confirmation screen
- Banner at top of reaction bar: "[Name] declarou [Action] ([Card])"

### Block-Challenge (AWAITING_BLOCK_CHALLENGE)
- Bottom-bar shows: "[Name] bloqueou com [Card] — Contestar?" with buttons Contestar / Aceitar bloco
- InfluenceCardSelector (already built) is reused for RESOLVING_CHALLENGE and RESOLVING_BLOCK_CHALLENGE phases
- Card replacement after successful challenge is transparent — server handles it; player sees updated "Minhas Cartas" with no extra UI
- Log entries in short PT-BR: "João contestou Duque de Ana — Ana perde influência"

### Ambassador Exchange (AWAITING_EXCHANGE)
- Expanded bottom-bar shows 4 clickable card badges (2 hand + 2 drawn from pendingAction.exchangeCards)
- Selected cards highlighted with ring-2 ring-primary; unselected cards opacity-50
- "Confirmar Troca (2/2)" button enabled only when exactly 2 selected — emits EXCHANGE_CHOOSE with keptIndices
- Other players see nothing special — wait silently; log shows "João trocou cartas"

### Claude's Discretion
- Exact PT-BR copy for all new UI strings
- Exact which card types are valid blockers per action (Duke blocks FA and Tax, Contessa blocks Assassinate, Captain blocks Steal)
- Handling of edge case: if only 1 unrevealed card remains for InfluenceCardSelector during challenge resolution

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `InfluenceCardSelector` — fixed bottom-bar, shows unrevealed cards, emits LOSE_INFLUENCE — reuse for RESOLVING_CHALLENGE and RESOLVING_BLOCK_CHALLENGE phases
- `CoupTargetSelector` — fixed bottom-bar target picker pattern — reuse pattern for Steal/Assassinate target selection
- `ActionBar` — already handles AWAITING_REACTIONS pass button; extend with full reaction buttons
- `GameBoard` bottom-bar priority: needsInfluenceChoice > selectingTarget > needsReaction > ActionBar

### Established Patterns
- Fixed bottom-bar components (`fixed bottom-0 left-0 right-0 ... bg-background border-t border-border`)
- `socket.emit("GAME_ACTION", roomId, { type, playerId, ... })` pattern
- `game.pendingAction.pendingReactions[playerId] === "WAITING"` to check if player needs to react
- `game.pendingAction.type` and `game.pendingAction.playerId` to display what action was declared
- `game.pendingAction.blockerId` and `game.pendingAction.blockerClaimedCard` for block-challenge UI
- `game.pendingAction.exchangeCards` for Ambassador exchange (2 drawn cards from deck)

### Integration Points
- `GameBoard` — central router for bottom-bar: add `needsBlockChallenge`, `needsExchange` derived booleans
- `ActionBar` — extend with character action buttons (row 2)
- New components needed: `ReactionBar`, `BlockClaimSelector`, `BlockChallengeBar`, `ExchangeSelector`
- `apps/frontend/src/components/` — all new components go here

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the decisions above — open to standard approaches following the existing bottom-bar pattern.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
