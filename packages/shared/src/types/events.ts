import type { ClientGameState, GameAction } from "./game-state"
import type { LobbyState } from "./lobby"

export interface ServerToClientEvents {
  STATE_UPDATE: (state: ClientGameState) => void
  PONG: () => void
  ERROR: (message: string) => void
  LOBBY_UPDATE: (state: LobbyState) => void
  GAME_STARTED: (roomId: string) => void
}

export interface ClientToServerEvents {
  PING: () => void
  JOIN_ROOM: (roomId: string, name: string) => void
  LEAVE_ROOM: (roomId: string) => void
  SET_READY: (roomId: string, isReady: boolean) => void
  START_GAME: (roomId: string) => void
  GAME_ACTION: (roomId: string, action: GameAction) => void
}
