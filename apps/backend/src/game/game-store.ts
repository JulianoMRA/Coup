import type { GameState } from "@coup/shared"

export const games = new Map<string, GameState>()

export function getGame(roomId: string): GameState | undefined {
  return games.get(roomId)
}

export function setGame(roomId: string, state: GameState): void {
  games.set(roomId, state)
}

export function deleteGame(roomId: string): void {
  games.delete(roomId)
}
