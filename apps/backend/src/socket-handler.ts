import type { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@coup/shared"
import { rooms, joinRoom, setReady, toLobbyState } from "./rooms/room-store"

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
      room.status = "IN_GAME"
      io.to(roomId).emit("GAME_STARTED", roomId)
    })

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${playerId}`)
    })
  })
}
