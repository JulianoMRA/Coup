import type { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@coup/shared"

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

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${playerId}`)
    })
  })
}
