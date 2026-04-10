import type { GameState, ClientGameState, PublicPlayerState } from "@coup/shared"

export function projectStateForPlayer(
  gameState: GameState,
  playerId: string,
  disconnectedPlayers: string[] = []
): ClientGameState {
  const myPlayer = gameState.players.find((p) => p.id === playerId)

  const publicPlayers: PublicPlayerState[] = gameState.players.map((p) => ({
    id: p.id,
    name: p.name,
    coins: p.coins,
    eliminated: p.eliminated,
    cardCount: p.hand.filter((c) => !c.revealed).length,
    revealedCards: p.hand.filter((c) => c.revealed),
  }))

  return {
    myHand: myPlayer?.hand ?? [],
    players: publicPlayers,
    phase: gameState.phase,
    activePlayerId: gameState.activePlayerId,
    pendingAction: gameState.pendingAction,
    log: gameState.log,
    disconnectedPlayers,
    deckCount: gameState.deck.length,
  }
}
