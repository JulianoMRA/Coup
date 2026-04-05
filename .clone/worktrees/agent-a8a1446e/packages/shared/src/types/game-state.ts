import type { Card } from "./card"

export interface PlayerState {
  id: string
  name: string
  coins: number
  hand: Card[]
  eliminated: boolean
}

export interface PublicPlayerState {
  id: string
  name: string
  coins: number
  eliminated: boolean
  cardCount: number
  revealedCards: Card[]
}

export enum GamePhase {
  LOBBY = "LOBBY",
  AWAITING_ACTION = "AWAITING_ACTION",
  AWAITING_REACTIONS = "AWAITING_REACTIONS",
  AWAITING_BLOCK_CHALLENGE = "AWAITING_BLOCK_CHALLENGE",
  RESOLVING_CHALLENGE = "RESOLVING_CHALLENGE",
  RESOLVING_BLOCK_CHALLENGE = "RESOLVING_BLOCK_CHALLENGE",
  RESOLVING_ACTION = "RESOLVING_ACTION",
  AWAITING_COUP_TARGET = "AWAITING_COUP_TARGET",
  AWAITING_EXCHANGE = "AWAITING_EXCHANGE",
  GAME_OVER = "GAME_OVER",
}

export interface PendingAction {
  type: string
  playerId: string
  targetId?: string
}

export interface GameState {
  roomId: string
  players: PlayerState[]
  phase: GamePhase
  activePlayerId: string
  pendingAction: PendingAction | null
  deck: Card[]
  log: string[]
}

export interface ClientGameState {
  myHand: Card[]
  players: PublicPlayerState[]
  phase: GamePhase
  activePlayerId: string
  pendingAction: PendingAction | null
  log: string[]
}
