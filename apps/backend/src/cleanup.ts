import type { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@coup/shared"
import { rooms } from "./rooms/room-store"
import { deleteGame } from "./game/game-store"

const CLEANUP_INTERVAL_MS = 300_000 // 5 minutes
const STALE_THRESHOLD_MS = 3_600_000 // 1 hour

export function startCleanupInterval(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): NodeJS.Timeout {
  return setInterval(() => {
    for (const [roomId, room] of rooms) {
      if (room.status === "IN_GAME") continue

      const connectedSockets = io.sockets.adapter.rooms.get(roomId)
      if (connectedSockets && connectedSockets.size > 0) continue

      if (Date.now() - (room.lastActivityAt ?? 0) < STALE_THRESHOLD_MS) continue

      rooms.delete(roomId)
      deleteGame(roomId)
    }
  }, CLEANUP_INTERVAL_MS)
}
