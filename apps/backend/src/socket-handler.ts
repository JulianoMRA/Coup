import type { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents, GameAction } from "@coup/shared"
import { rooms, joinRoom, setReady, toLobbyState } from "./rooms/room-store"
import { initGame, processAction } from "./game/game-engine"
import { games, getGame, setGame } from "./game/game-store"
import { projectStateForPlayer } from "./game/project-state"

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  io.on("connection", (socket) => {
    const playerId = socket.handshake.auth.playerId as string | undefined

    if (!playerId) {
      socket.emit("ERROR", "Missing playerId in auth")
      socket.disconnect()
      return
    }

    console.log(`Player connected: ${playerId}`)

    socket.on("PING", () => {
      socket.emit("PONG")
    })

    socket.on("JOIN_ROOM", (roomId, name) => {
      const result = joinRoom(roomId, playerId, name)
      if (!result.ok) {
        socket.emit("ERROR", result.error)
        return
      }
      socket.join(roomId)
      const room = rooms.get(roomId)!
      io.to(roomId).emit("LOBBY_UPDATE", toLobbyState(room))
    })

    socket.on("LEAVE_ROOM", (roomId) => {
      socket.leave(roomId)
    })

    socket.on("SET_READY", (roomId, isReady) => {
      const result = setReady(roomId, playerId, isReady)
      if (!result.ok) {
        socket.emit("ERROR", result.error)
        return
      }
      const room = rooms.get(roomId)!
      io.to(roomId).emit("LOBBY_UPDATE", toLobbyState(room))
    })

    socket.on("START_GAME", (roomId) => {
      const room = rooms.get(roomId)
      if (!room) { socket.emit("ERROR", "Room not found"); return }
      if (room.hostId !== playerId) { socket.emit("ERROR", "Only host can start"); return }
      if (room.players.length < 2) { socket.emit("ERROR", "Need at least 2 players"); return }
      if (!room.players.every((p) => p.isReady)) { socket.emit("ERROR", "Not all players are ready"); return }

      const initialState = initGame(roomId, room.players)
      setGame(roomId, initialState)

      room.status = "IN_GAME"
      io.to(roomId).emit("GAME_STARTED", roomId)

      for (const player of initialState.players) {
        const projection = projectStateForPlayer(initialState, player.id)
        io.to(roomId).emit("STATE_UPDATE", projection)
      }
    })

    socket.on("GAME_ACTION", (roomId: string, action: GameAction) => {
      const state = getGame(roomId)
      if (!state) {
        socket.emit("ERROR", "Game not found")
        return
      }

      const result = processAction(state, action)
      if (!result.ok) {
        socket.emit("ERROR", result.error)
        return
      }

      setGame(roomId, result.state)

      for (const player of result.state.players) {
        const projection = projectStateForPlayer(result.state, player.id)
        io.to(roomId).emit("STATE_UPDATE", projection)
      }
    })

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${playerId}`)
    })
  })
}
