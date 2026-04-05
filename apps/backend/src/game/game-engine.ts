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

function replaceProvenCard(state: GameState, playerId: string, claimedCard: CardType): GameState {
  const player = state.players.find(p => p.id === playerId)!
  const provenCardIndex = player.hand.findIndex(c => c.type === claimedCard && !c.revealed)
  if (provenCardIndex === -1 || state.deck.length === 0) return state
  const newDeck = [...state.deck, player.hand[provenCardIndex]]
  shuffleInPlace(newDeck)
  const newCard = newDeck.pop()!
  const newHand = player.hand.map((c, i) => i === provenCardIndex ? newCard : c)
  const players = state.players.map(p => p.id === playerId ? { ...p, hand: newHand } : p)
  return { ...state, players, deck: newDeck }
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

// ─── action declarations that enter AWAITING_REACTIONS ────────────────────

function handleTax(state: GameState, action: Extract<GameAction, { type: "TAX" }>): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, error: "Not your turn" }
  }
  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "TAX",
        playerId: action.playerId,
        pendingReactions: buildPendingReactions(state, action.playerId),
      },
      log: [...state.log, `${action.playerId} declares Tax`],
    },
  }
}

function handleSteal(state: GameState, action: Extract<GameAction, { type: "STEAL" }>): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, error: "Not your turn" }
  }
  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "STEAL",
        playerId: action.playerId,
        targetId: action.targetId,
        pendingReactions: buildPendingReactions(state, action.playerId),
      },
      log: [...state.log, `${action.playerId} declares Steal on ${action.targetId}`],
    },
  }
}

function handleAssassinate(state: GameState, action: Extract<GameAction, { type: "ASSASSINATE" }>): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, error: "Not your turn" }
  }
  const activePlayer = state.players.find(p => p.id === action.playerId)!
  if (activePlayer.coins < 3) {
    return { ok: false, error: "Not enough coins for Assassinate (need 3)" }
  }
  const players = state.players.map(p =>
    p.id === action.playerId ? { ...p, coins: p.coins - 3 } : p
  )
  return {
    ok: true,
    state: {
      ...state,
      players,
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "ASSASSINATE",
        playerId: action.playerId,
        targetId: action.targetId,
        pendingReactions: buildPendingReactions(state, action.playerId),
      },
      log: [...state.log, `${action.playerId} declares Assassinate on ${action.targetId}`],
    },
  }
}

function handleExchange(state: GameState, action: Extract<GameAction, { type: "EXCHANGE" }>): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, error: "Not your turn" }
  }
  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.AWAITING_REACTIONS,
      pendingAction: {
        type: "EXCHANGE",
        playerId: action.playerId,
        pendingReactions: buildPendingReactions(state, action.playerId),
      },
      log: [...state.log, `${action.playerId} declares Exchange`],
    },
  }
}

// ─── action resolution helpers ────────────────────────────────────────────

function resolveAction(state: GameState): ActionResult {
  const pending = state.pendingAction!
  switch (pending.type) {
    case "FOREIGN_AID": {
      const players = state.players.map(p =>
        p.id === pending.playerId ? { ...p, coins: p.coins + 2 } : p
      )
      return {
        ok: true,
        state: {
          ...state,
          players,
          phase: GamePhase.AWAITING_ACTION,
          activePlayerId: nextActivePlayer(state),
          log: [...state.log, `${pending.playerId} gains Foreign Aid (+2 coins)`],
        },
      }
    }
    case "TAX": {
      const players = state.players.map(p =>
        p.id === pending.playerId ? { ...p, coins: p.coins + 3 } : p
      )
      return {
        ok: true,
        state: {
          ...state,
          players,
          phase: GamePhase.AWAITING_ACTION,
          activePlayerId: nextActivePlayer(state),
          log: [...state.log, `${pending.playerId} gains Tax (+3 coins)`],
        },
      }
    }
    case "STEAL": {
      const target = state.players.find(p => p.id === pending.targetId)!
      const stolenCoins = Math.min(2, target.coins)
      const players = state.players.map(p => {
        if (p.id === pending.playerId) return { ...p, coins: p.coins + stolenCoins }
        if (p.id === pending.targetId) return { ...p, coins: p.coins - stolenCoins }
        return p
      })
      return {
        ok: true,
        state: {
          ...state,
          players,
          phase: GamePhase.AWAITING_ACTION,
          activePlayerId: nextActivePlayer(state),
          log: [...state.log, `${pending.playerId} steals from ${pending.targetId}`],
        },
      }
    }
    case "ASSASSINATE": {
      return {
        ok: true,
        state: {
          ...state,
          phase: GamePhase.AWAITING_COUP_TARGET,
          pendingAction: {
            ...pending,
          },
          log: [...state.log, `${pending.playerId} assassinates ${pending.targetId} — awaiting card choice`],
        },
      }
    }
    case "EXCHANGE": {
      const deck = [...state.deck]
      const card1 = deck.pop()!
      const card2 = deck.pop()!
      return {
        ok: true,
        state: {
          ...state,
          deck,
          phase: GamePhase.AWAITING_EXCHANGE,
          pendingAction: {
            ...pending,
            exchangeCards: [card1, card2],
          },
          log: [...state.log, `${pending.playerId} draws exchange cards`],
        },
      }
    }
    default:
      return { ok: false, error: `No resolution for action type ${pending.type}` }
  }
}

// ─── reaction handlers ────────────────────────────────────────────────────

function handlePassReaction(state: GameState, action: Extract<GameAction, { type: "PASS" }>): ActionResult {
  const pending = state.pendingAction!
  const reactions = pending.pendingReactions

  if (reactions[action.playerId] === undefined) {
    return { ok: false, error: "You are not in the reaction window" }
  }
  if (reactions[action.playerId] !== "WAITING") {
    return { ok: false, error: "You have already reacted" }
  }

  const updatedReactions = { ...reactions, [action.playerId]: "PASSED" as const }
  const allDecided = Object.values(updatedReactions).every(r => r !== "WAITING")

  if (!allDecided) {
    return {
      ok: true,
      state: {
        ...state,
        pendingAction: { ...pending, pendingReactions: updatedReactions },
        log: [...state.log, `${action.playerId} passes`],
      },
    }
  }

  return resolveAction({
    ...state,
    pendingAction: { ...pending, pendingReactions: updatedReactions },
    log: [...state.log, `${action.playerId} passes`],
  })
}

function handleChallengeReaction(state: GameState, action: Extract<GameAction, { type: "CHALLENGE" }>): ActionResult {
  const pending = state.pendingAction!
  const reactions = pending.pendingReactions

  if (reactions[action.playerId] === undefined) {
    return { ok: false, error: "You are not in the reaction window" }
  }

  const updatedReactions = { ...reactions, [action.playerId]: "CHALLENGED" as const }

  const claimedCardMap: Record<string, CardType> = {
    TAX: CardType.DUKE,
    STEAL: CardType.CAPTAIN,
    ASSASSINATE: CardType.ASSASSIN,
    EXCHANGE: CardType.AMBASSADOR,
  }
  const claimedCard = claimedCardMap[pending.type]
  const challengedPlayer = state.players.find(p => p.id === pending.playerId)!
  const hasCard = claimedCard !== undefined &&
    challengedPlayer.hand.some(c => c.type === claimedCard && !c.revealed)
  const losingPlayerId = hasCard ? action.playerId : pending.playerId

  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.RESOLVING_CHALLENGE,
      pendingAction: { ...pending, pendingReactions: updatedReactions, losingPlayerId },
      log: [...state.log, `${action.playerId} challenges`],
    },
  }
}

function handleBlockReaction(state: GameState, action: Extract<GameAction, { type: "BLOCK" }>): ActionResult {
  const pending = state.pendingAction!
  const reactions = pending.pendingReactions

  if (reactions[action.playerId] === undefined) {
    return { ok: false, error: "You are not in the reaction window" }
  }

  const updatedReactions = { ...reactions, [action.playerId]: "BLOCKED" as const }
  const blockChallengeReactions = buildPendingReactions(state, action.playerId)

  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.AWAITING_BLOCK_CHALLENGE,
      pendingAction: {
        ...pending,
        pendingReactions: updatedReactions,
        blockerId: action.playerId,
        blockerClaimedCard: action.claimedCard,
      },
      log: [...state.log, `${action.playerId} blocks claiming ${action.claimedCard}`],
    },
  }
}

function handlePassBlockChallenge(state: GameState, action: Extract<GameAction, { type: "PASS" }>): ActionResult {
  const pending = state.pendingAction!
  const reactions = pending.pendingReactions

  if (reactions[action.playerId] === undefined) {
    return { ok: false, error: "You are not in the reaction window" }
  }

  const updatedReactions = { ...reactions, [action.playerId]: "PASSED" as const }
  const allDecided = Object.values(updatedReactions).every(r => r !== "WAITING")

  if (!allDecided) {
    return {
      ok: true,
      state: {
        ...state,
        pendingAction: { ...pending, pendingReactions: updatedReactions },
        log: [...state.log, `${action.playerId} passes block challenge`],
      },
    }
  }

  // All passed the block challenge — block stands, action cancelled
  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.AWAITING_ACTION,
      activePlayerId: nextActivePlayer(state),
      pendingAction: null,
      log: [...state.log, `${action.playerId} passes — block stands, action cancelled`],
    },
  }
}

function handleChallengeBlockChallenge(state: GameState, action: Extract<GameAction, { type: "CHALLENGE" }>): ActionResult {
  const pending = state.pendingAction!
  const blockerId = pending.blockerId!

  const blockerPlayer = state.players.find(p => p.id === blockerId)!
  const hasCard = pending.blockerClaimedCard !== undefined &&
    blockerPlayer.hand.some(c => c.type === pending.blockerClaimedCard && !c.revealed)
  const losingPlayerId = hasCard ? action.playerId : blockerId

  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.RESOLVING_BLOCK_CHALLENGE,
      pendingAction: {
        ...pending,
        pendingReactions: { ...pending.pendingReactions, [action.playerId]: "CHALLENGED" as const },
        losingPlayerId,
      },
      log: [...state.log, `${action.playerId} challenges the block`],
    },
  }
}

// ─── LOSE_INFLUENCE resolution handlers ──────────────────────────────────

function handleLoseInfluenceResolvingChallenge(state: GameState, action: Extract<GameAction, { type: "LOSE_INFLUENCE" }>): ActionResult {
  const pending = state.pendingAction!
  const challengedPlayerId = pending.playerId

  if (pending.losingPlayerId && action.playerId !== pending.losingPlayerId) {
    return { ok: false, error: "You are not the player who must lose influence" }
  }

  // The player losing influence is the challenged player (bluffing) → action cancelled
  if (action.playerId === challengedPlayerId) {
    let next = revealCard(state, action.playerId, action.cardIndex)
    next = { ...next, pendingAction: null }
    next = checkGameOver(next)
    if (next.phase !== GamePhase.GAME_OVER) {
      next = { ...next, phase: GamePhase.AWAITING_ACTION, activePlayerId: nextActivePlayer(state) }
    }
    return { ok: true, state: next }
  }

  // The player losing influence is the challenger → they lost, action resolves
  let next = revealCard(state, action.playerId, action.cardIndex)
  next = checkGameOver(next)
  if (next.phase === GamePhase.GAME_OVER) {
    return { ok: true, state: { ...next, pendingAction: null } }
  }

  // Challenged player proved their card — swap it with a new deck card
  const claimedCardMap: Record<string, CardType> = {
    TAX: CardType.DUKE,
    STEAL: CardType.CAPTAIN,
    ASSASSINATE: CardType.ASSASSIN,
    EXCHANGE: CardType.AMBASSADOR,
  }
  const claimedCard = claimedCardMap[pending.type]
  if (claimedCard) {
    next = replaceProvenCard(next, challengedPlayerId, claimedCard)
  }

  return resolveAction(next)
}

function handleLoseInfluenceResolvingBlockChallenge(state: GameState, action: Extract<GameAction, { type: "LOSE_INFLUENCE" }>): ActionResult {
  const pending = state.pendingAction!
  const blockerId = pending.blockerId!

  if (pending.losingPlayerId && action.playerId !== pending.losingPlayerId) {
    return { ok: false, error: "You are not the player who must lose influence" }
  }

  // Blocker is losing influence → blocker was bluffing, action resolves
  if (action.playerId === blockerId) {
    let next = revealCard(state, action.playerId, action.cardIndex)
    next = checkGameOver(next)
    if (next.phase === GamePhase.GAME_OVER) {
      return { ok: true, state: { ...next, pendingAction: null } }
    }
    return resolveAction(next)
  }

  // Challenger is losing influence → block proven, action cancelled
  let next = revealCard(state, action.playerId, action.cardIndex)
  // Blocker proved their card — swap it with a new deck card
  next = replaceProvenCard(next, blockerId, pending.blockerClaimedCard!)
  next = { ...next, pendingAction: null }
  next = checkGameOver(next)
  if (next.phase !== GamePhase.GAME_OVER) {
    next = { ...next, phase: GamePhase.AWAITING_ACTION, activePlayerId: nextActivePlayer(state) }
  }
  return { ok: true, state: next }
}

function handleExchangeChoose(state: GameState, action: Extract<GameAction, { type: "EXCHANGE_CHOOSE" }>): ActionResult {
  if (action.playerId !== state.activePlayerId) {
    return { ok: false, error: "Not your turn" }
  }
  const pending = state.pendingAction!
  const player = state.players.find(p => p.id === action.playerId)!
  const allCards = [...player.hand, ...(pending.exchangeCards ?? [])]
  const kept = action.keptIndices.map(i => allCards[i])
  const returned = allCards.filter((_, i) => !action.keptIndices.includes(i))
  const players = state.players.map(p =>
    p.id === action.playerId ? { ...p, hand: kept } : p
  )
  const newDeck = [...state.deck, ...returned]
  shuffleInPlace(newDeck)
  return {
    ok: true,
    state: {
      ...state,
      players,
      deck: newDeck,
      phase: GamePhase.AWAITING_ACTION,
      activePlayerId: nextActivePlayer(state),
      pendingAction: null,
      log: [...state.log, `${action.playerId} completes exchange`],
    },
  }
}

// ─── transition map ────────────────────────────────────────────────────────

type TransitionKey = `${GamePhase}:${string}`

const transitionMap: Partial<Record<TransitionKey, Handler>> = {
  [`${GamePhase.AWAITING_ACTION}:INCOME`]:        handleIncome as Handler,
  [`${GamePhase.AWAITING_ACTION}:FOREIGN_AID`]:   handleForeignAid as Handler,
  [`${GamePhase.AWAITING_ACTION}:TAX`]:           handleTax as Handler,
  [`${GamePhase.AWAITING_ACTION}:STEAL`]:         handleSteal as Handler,
  [`${GamePhase.AWAITING_ACTION}:ASSASSINATE`]:   handleAssassinate as Handler,
  [`${GamePhase.AWAITING_ACTION}:EXCHANGE`]:      handleExchange as Handler,
  [`${GamePhase.AWAITING_ACTION}:COUP`]:          handleCoup as Handler,
  [`${GamePhase.AWAITING_REACTIONS}:PASS`]:       handlePassReaction as Handler,
  [`${GamePhase.AWAITING_REACTIONS}:CHALLENGE`]:  handleChallengeReaction as Handler,
  [`${GamePhase.AWAITING_REACTIONS}:BLOCK`]:      handleBlockReaction as Handler,
  [`${GamePhase.AWAITING_BLOCK_CHALLENGE}:PASS`]:      handlePassBlockChallenge as Handler,
  [`${GamePhase.AWAITING_BLOCK_CHALLENGE}:CHALLENGE`]: handleChallengeBlockChallenge as Handler,
  [`${GamePhase.AWAITING_COUP_TARGET}:LOSE_INFLUENCE`]: handleLoseInfluenceCoupTarget as Handler,
  [`${GamePhase.RESOLVING_CHALLENGE}:LOSE_INFLUENCE`]:  handleLoseInfluenceResolvingChallenge as Handler,
  [`${GamePhase.RESOLVING_BLOCK_CHALLENGE}:LOSE_INFLUENCE`]: handleLoseInfluenceResolvingBlockChallenge as Handler,
  [`${GamePhase.AWAITING_EXCHANGE}:EXCHANGE_CHOOSE`]:   handleExchangeChoose as Handler,
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
