export interface LobbyPlayer {
  playerId: string
  name: string
  isReady: boolean
  joinOrder: number
}

export interface LobbyState {
  roomId: string
  players: LobbyPlayer[]
  hostId: string
  maxPlayers: number
  status: "LOBBY" | "IN_GAME" | "GAME_OVER"
}
