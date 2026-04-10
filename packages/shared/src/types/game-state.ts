import type { Card } from "./card"
import { CardType } from "./card"

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
  pendingReactions: Record<string, "WAITING" | "PASSED" | "CHALLENGED" | "BLOCKED">
  blockerId?: string
  blockerClaimedCard?: CardType
  exchangeCards?: Card[]
  losingPlayerId?: string
}

export type GameAction =
  | { type: "INCOME";           playerId: string }
  | { type: "FOREIGN_AID";      playerId: string }
  | { type: "TAX";              playerId: string }
  | { type: "EXCHANGE";         playerId: string }
  | { type: "STEAL";            playerId: string; targetId: string }
  | { type: "ASSASSINATE";      playerId: string; targetId: string }
  | { type: "COUP";             playerId: string; targetId: string }
  | { type: "CHALLENGE";        playerId: string }
  | { type: "BLOCK";            playerId: string; claimedCard: CardType }
  | { type: "PASS";             playerId: string }
  | { type: "LOSE_INFLUENCE";   playerId: string; cardIndex: number }
  | { type: "EXCHANGE_CHOOSE";  playerId: string; keptIndices: [number, number] }

export interface GameState {
  roomId: string
  players: PlayerState[]
  phase: GamePhase
  activePlayerId: string
  pendingAction: PendingAction | null
  deck: Card[]
  log: string[]
}

export type ActionResult = { ok: true; state: GameState } | { ok: false; error: string }

export interface ClientGameState {
  myHand: Card[]
  players: PublicPlayerState[]
  phase: GamePhase
  activePlayerId: string
  pendingAction: PendingAction | null
  log: string[]
  disconnectedPlayers: string[]
  deckCount: number
}
