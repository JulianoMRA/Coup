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
    log: ["Jogo iniciado"],
  }
}

// ─── helpers ──────────────────────────────────────────────────────────────

const CARD_PT: Record<string, string> = {
  DUKE: "Duque",
  CAPTAIN: "Capitão",
  ASSASSIN: "Assassino",
  AMBASSADOR: "Embaixador",
  CONTESSA: "Condessa",
}

function pname(state: GameState, id: string): string {
  return state.players.find(p => p.id === id)?.name ?? id
}

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
    return { ...state, phase: GamePhase.GAME_OVER, log: [...state.log, `${alive[0].name} venceu!`] }
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
      log: [...state.log, `${pname(state, action.playerId)} recebeu renda (+1)`],
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
      log: [...state.log, `${pname(state, action.playerId)} declarou Ajuda Externa`],
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
      log: [...state.log, `${pname(state, action.playerId)} deu Golpe em ${pname(state, action.targetId)}`],
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
      log: [...state.log, `${pname(state, action.playerId)} declarou Imposto (Duque)`],
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
      log: [...state.log, `${pname(state, action.playerId)} declarou Roubo em ${pname(state, action.targetId)}`],
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
      log: [...state.log, `${pname(state, action.playerId)} declarou Assassinato em ${pname(state, action.targetId)}`],
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
      log: [...state.log, `${pname(state, action.playerId)} declarou Troca (Embaixador)`],
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
          log: [...state.log, `${pname(state, pending.playerId)} recebeu Ajuda Externa (+2)`],
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
          log: [...state.log, `${pname(state, pending.playerId)} recebeu Imposto (+3)`],
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
          log: [...state.log, `${pname(state, pending.playerId)} roubou de ${pname(state, pending.targetId!)}`],
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
          log: [...state.log, `${pname(state, pending.playerId)} assassinou ${pname(state, pending.targetId!)} — aguardando escolha da carta`],
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
          log: [...state.log, `${pname(state, pending.playerId)} comprou cartas para troca`],
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
        log: [...state.log, `${pname(state, action.playerId)} passou`],
      },
    }
  }

  return resolveAction({
    ...state,
    pendingAction: { ...pending, pendingReactions: updatedReactions },
    log: [...state.log, `${pname(state, action.playerId)} passou`],
  })
}

function handleChallengeReaction(state: GameState, action: Extract<GameAction, { type: "CHALLENGE" }>): ActionResult {
  const pending = state.pendingAction!
  const reactions = pending.pendingReactions

  if (reactions[action.playerId] === undefined) {
    return { ok: false, error: "You are not in the reaction window" }
  }

  const updatedReactions = { ...reactions, [action.playerId]: "CHALLENGED" as const }

  // Challenged player (who declared the action) always goes first to prove or admit bluff
  const losingPlayerId = pending.playerId

  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.RESOLVING_CHALLENGE,
      pendingAction: { ...pending, pendingReactions: updatedReactions, losingPlayerId },
      log: [...state.log, `${pname(state, action.playerId)} desafiou`],
    },
  }
}

function handleBlockReaction(state: GameState, action: Extract<GameAction, { type: "BLOCK" }>): ActionResult {
  const pending = state.pendingAction!
  const reactions = pending.pendingReactions

  if (reactions[action.playerId] === undefined) {
    return { ok: false, error: "You are not in the reaction window" }
  }

  // Only the action initiator (pending.playerId) decides whether to challenge or accept the block
  const blockChallengeReactions: Record<string, "WAITING"> = { [pending.playerId]: "WAITING" }

  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.AWAITING_BLOCK_CHALLENGE,
      pendingAction: {
        ...pending,
        pendingReactions: blockChallengeReactions,
        blockerId: action.playerId,
        blockerClaimedCard: action.claimedCard,
      },
      log: [...state.log, `${pname(state, action.playerId)} bloqueou (reivindicando ${CARD_PT[action.claimedCard] ?? action.claimedCard})`],
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
        log: [...state.log, `${pname(state, action.playerId)} passou (não desafiou o bloqueio)`],
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
      log: [...state.log, `${pname(state, action.playerId)} passou — bloqueio aceito, ação cancelada`],
    },
  }
}

function handleChallengeBlockChallenge(state: GameState, action: Extract<GameAction, { type: "CHALLENGE" }>): ActionResult {
  const pending = state.pendingAction!
  const blockerId = pending.blockerId!

  // Blocker always goes first to prove their card (or admit bluff)
  return {
    ok: true,
    state: {
      ...state,
      phase: GamePhase.RESOLVING_BLOCK_CHALLENGE,
      pendingAction: {
        ...pending,
        pendingReactions: { ...pending.pendingReactions, [action.playerId]: "CHALLENGED" as const },
        losingPlayerId: blockerId,
      },
      log: [...state.log, `${pname(state, action.playerId)} desafiou o bloqueio`],
    },
  }
}

// ─── LOSE_INFLUENCE resolution handlers ──────────────────────────────────

const CLAIMED_CARD_MAP: Record<string, CardType> = {
  TAX: CardType.DUKE,
  STEAL: CardType.CAPTAIN,
  ASSASSINATE: CardType.ASSASSIN,
  EXCHANGE: CardType.AMBASSADOR,
}

function handleLoseInfluenceResolvingChallenge(state: GameState, action: Extract<GameAction, { type: "LOSE_INFLUENCE" }>): ActionResult {
  const pending = state.pendingAction!
  const challengedPlayerId = pending.playerId

  if (pending.losingPlayerId && action.playerId !== pending.losingPlayerId) {
    return { ok: false, error: "You are not the player who must lose influence" }
  }

  // ── Step 1: challenged player selects a card to prove (or admit bluff) ──
  if (action.playerId === challengedPlayerId) {
    const player = state.players.find(p => p.id === challengedPlayerId)!
    const selectedCard = player.hand[action.cardIndex]
    const claimedCard = CLAIMED_CARD_MAP[pending.type]

    if (!selectedCard || selectedCard.revealed) {
      return { ok: false, error: "Invalid card index" }
    }

    // Bluffing: selected card is not the claimed type → lose it, action cancelled
    if (!claimedCard || selectedCard.type !== claimedCard) {
      let next = revealCard(state, challengedPlayerId, action.cardIndex)
      next = { ...next, pendingAction: null }
      next = checkGameOver(next)
      if (next.phase !== GamePhase.GAME_OVER) {
        next = { ...next, phase: GamePhase.AWAITING_ACTION, activePlayerId: nextActivePlayer(state) }
      }
      return { ok: true, state: next }
    }

    // Proved: replace the proven card with a deck card, now challenger must lose a card
    let next = replaceProvenCard(state, challengedPlayerId, claimedCard)
    const challengerId = Object.entries(pending.pendingReactions)
      .find(([, v]) => v === "CHALLENGED")?.[0]
    if (!challengerId) {
      return { ok: false, error: "Cannot find challenger" }
    }
    return {
      ok: true,
      state: {
        ...next,
        phase: GamePhase.RESOLVING_CHALLENGE,
        pendingAction: { ...pending, losingPlayerId: challengerId },
        log: [...next.log, `${pname(next, challengedPlayerId)} provou a carta — ${pname(next, challengerId)} deve perder influência`],
      },
    }
  }

  // ── Step 2: challenger loses a card after proof ──
  let next = revealCard(state, action.playerId, action.cardIndex)
  next = checkGameOver(next)
  if (next.phase === GamePhase.GAME_OVER) {
    return { ok: true, state: { ...next, pendingAction: null } }
  }
  return resolveAction(next)
}

function handleLoseInfluenceResolvingBlockChallenge(state: GameState, action: Extract<GameAction, { type: "LOSE_INFLUENCE" }>): ActionResult {
  const pending = state.pendingAction!
  const blockerId = pending.blockerId!

  if (pending.losingPlayerId && action.playerId !== pending.losingPlayerId) {
    return { ok: false, error: "You are not the player who must lose influence" }
  }

  // ── Step 1: blocker selects a card to prove (or admit bluff) ──
  if (action.playerId === blockerId) {
    const player = state.players.find(p => p.id === blockerId)!
    const selectedCard = player.hand[action.cardIndex]

    if (!selectedCard || selectedCard.revealed) {
      return { ok: false, error: "Invalid card index" }
    }

    // Bluffing: selected card is not the claimed type → lose it, action resolves
    if (!pending.blockerClaimedCard || selectedCard.type !== pending.blockerClaimedCard) {
      let next = revealCard(state, blockerId, action.cardIndex)
      next = checkGameOver(next)
      if (next.phase === GamePhase.GAME_OVER) {
        return { ok: true, state: { ...next, pendingAction: null } }
      }
      return resolveAction(next)
    }

    // Proved: replace the proven card, now the block challenger must lose a card
    let next = replaceProvenCard(state, blockerId, pending.blockerClaimedCard)
    const blockChallengerId = Object.entries(pending.pendingReactions)
      .find(([, v]) => v === "CHALLENGED")?.[0]
    if (!blockChallengerId) {
      return { ok: false, error: "Cannot find block challenger" }
    }
    return {
      ok: true,
      state: {
        ...next,
        phase: GamePhase.RESOLVING_BLOCK_CHALLENGE,
        pendingAction: { ...pending, losingPlayerId: blockChallengerId },
        log: [...next.log, `${pname(next, blockerId)} provou o bloqueio — ${pname(next, blockChallengerId)} deve perder influência`],
      },
    }
  }

  // ── Step 2: block challenger loses a card, block stands, action cancelled ──
  let next = revealCard(state, action.playerId, action.cardIndex)
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
      log: [...state.log, `${pname(state, action.playerId)} concluiu a troca`],
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
