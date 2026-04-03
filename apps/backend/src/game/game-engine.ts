import { GamePhase, CardType } from "@coup/shared"
import type { GameState, PlayerState, GameAction, ActionResult } from "@coup/shared"
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

export function processAction(state: GameState, action: GameAction): ActionResult {
  return { ok: false, error: "not implemented" }
}
