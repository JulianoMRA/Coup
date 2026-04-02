import type { ClientGameState } from "./game-state"

export interface ServerToClientEvents {
  STATE_UPDATE: (state: ClientGameState) => void
  PONG: () => void
  ERROR: (message: string) => void
}

export interface ClientToServerEvents {
  PING: () => void
}
