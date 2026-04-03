import { GamePhase, CardType } from "@coup/shared"
import type { GameState, PlayerState, GameAction, ActionResult, PendingAction } from "@coup/shared"
import type { LobbyPlayer, Card } from "@coup/shared"

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

function buildDeck(): Card[] {
  const types: CardType[] = [
    CardType.DUKE,
    CardType.ASSASSIN,
    CardType.CAPTAIN,
    CardType.AMBASSADOR,
    CardType.CONTESSA,
  ]
  return types.flatMap(type =>
    Array.from({ length: 3 }, () => ({ type, revealed: false }))
  )
}

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

  shuffleInPlace(players)

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

// ─── helpers ──────────────────────────────────────────────────────────────

function nextActivePlayer(state: GameState): string {
  const alive = state.players.filter(p => !p.eliminated)
  const currentIndex = alive.findIndex(p => p.id === state.activePlayerId)
  return alive[(currentIndex + 1) % alive.length].id
}

function buildPendingReactions(state: GameState, excludeId: string): Record<string, "WAITING"> {
  return Object.fromEntries(
    state.players
      .filter(p => !p.eliminated && p.id !== excludeId)
      .map(p => [p.id, "WAITING" as const])
  )
}

function revealCard(state: GameState, playerId: string, cardIndex: number): GameState {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p
    const hand = p.hand.map((c, i) => i === cardIndex ? { ...c, revealed: true } : c)
    const eliminated = hand.every(c => c.revealed)
    return { ...p, hand, eliminated }
  })
  return { ...state, players }
}

function checkGameOver(state: GameState): GameState {
  const alive = state.players.filter(p => !p.eliminated)
  if (alive.length === 1) {
    return { ...state, phase: GamePhase.GAME_OVER, log: [...state.log, `${alive[0].name} wins!`] }
  }
  return state
}

// ─── action handlers ───────────────────────────────────────────────────────

type Handler = (state: GameState, action: GameAction) => ActionResult

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
      pendingAction: null,
      log: [...state.log, `${action.playerId} takes income`],
    },
  }
}

function handleForeignAid(state: GameState, action: Extract<GameAction, { type: "FOREIGN_AID" }>): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, error: "Not your turn" }
  }
  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "FOREIGN_AID",
        playerId: action.playerId,
        pendingReactions: buildPendingReactions(state, action.playerId),
      },
      log: [...state.log, `${action.playerId} declares Foreign Aid`],
    },
  }
}

function handleCoup(state: GameState, action: Extract<GameAction, { type: "COUP" }>): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, error: "Not your turn" }
  }
  const activePlayer = state.players.find(p => p.id === action.playerId)!
  if (activePlayer.coins < 7) {
    return { ok: false, error: "Not enough coins for Coup (need 7)" }
  }
  const players = state.players.map(p =>
    p.id === action.playerId ? { ...p, coins: p.coins - 7 } : p
  )
  return {
    ok: true,
    state: {
      ...state,
      players,
      phase: GamePhase.AWAITING_COUP_TARGET,
      pendingAction: {
        type: "COUP",
        playerId: action.playerId,
        targetId: action.targetId,
        pendingReactions: {},
      },
      log: [...state.log, `${action.playerId} launches Coup on ${action.targetId}`],
    },
  }
}

function handleLoseInfluenceCoupTarget(state: GameState, action: Extract<GameAction, { type: "LOSE_INFLUENCE" }>): ActionResult {
  const targetId = state.pendingAction?.targetId
  if (action.playerId !== targetId) {
    return { ok: false, error: "You are not the coup target" }
  }
  let next = revealCard(state, action.playerId, action.cardIndex)
  next = { ...next, pendingAction: null }
  next = checkGameOver(next)
  if (next.phase !== GamePhase.GAME_OVER) {
    next = { ...next, phase: GamePhase.AWAITING_ACTION, activePlayerId: nextActivePlayer(state) }
  }
  return { ok: true, state: next }
}

// ─── stub handlers (Wave 3/4 will replace these) ──────────────────────────

const notImplemented: Handler = () => ({ ok: false, error: "not implemented" })

// ─── transition map ────────────────────────────────────────────────────────

type TransitionKey = `${GamePhase}:${string}`

const transitionMap: Partial<Record<TransitionKey, Handler>> = {
  [`${GamePhase.AWAITING_ACTION}:INCOME`]:        handleIncome as Handler,
  [`${GamePhase.AWAITING_ACTION}:FOREIGN_AID`]:   handleForeignAid as Handler,
  [`${GamePhase.AWAITING_ACTION}:TAX`]:           notImplemented,
  [`${GamePhase.AWAITING_ACTION}:STEAL`]:         notImplemented,
  [`${GamePhase.AWAITING_ACTION}:ASSASSINATE`]:   notImplemented,
  [`${GamePhase.AWAITING_ACTION}:EXCHANGE`]:      notImplemented,
  [`${GamePhase.AWAITING_ACTION}:COUP`]:          handleCoup as Handler,
  [`${GamePhase.AWAITING_REACTIONS}:PASS`]:       notImplemented,
  [`${GamePhase.AWAITING_REACTIONS}:CHALLENGE`]:  notImplemented,
  [`${GamePhase.AWAITING_REACTIONS}:BLOCK`]:      notImplemented,
  [`${GamePhase.AWAITING_BLOCK_CHALLENGE}:PASS`]:      notImplemented,
  [`${GamePhase.AWAITING_BLOCK_CHALLENGE}:CHALLENGE`]: notImplemented,
  [`${GamePhase.AWAITING_COUP_TARGET}:LOSE_INFLUENCE`]: handleLoseInfluenceCoupTarget as Handler,
  [`${GamePhase.RESOLVING_CHALLENGE}:LOSE_INFLUENCE`]:  notImplemented,
  [`${GamePhase.RESOLVING_BLOCK_CHALLENGE}:LOSE_INFLUENCE`]: notImplemented,
  [`${GamePhase.AWAITING_EXCHANGE}:EXCHANGE_CHOOSE`]:   notImplemented,
}

export function processAction(state: GameState, action: GameAction): ActionResult {
  const activePlayer = state.players.find(p => p.id === state.activePlayerId)
  if (
    activePlayer &&
    activePlayer.coins >= 10 &&
    state.phase === GamePhase.AWAITING_ACTION &&
    action.type !== "COUP"
  ) {
    return { ok: false, error: "Must coup with 10+ coins" }
  }

  const key = `${state.phase}:${action.type}` as TransitionKey
  const handler = transitionMap[key]
  if (!handler) {
    return { ok: false, error: `${action.type} is not valid in phase ${state.phase}` }
  }
  return handler(state, action)
}
