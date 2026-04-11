import { io, type Socket } from "socket.io-client"
import type { ServerToClientEvents, ClientToServerEvents } from "@coup/shared"
import { getOrCreatePlayerId } from "./session"
import { getBackendUrl } from "./backend-url"

export const socket = io(
  getBackendUrl(),
  {
    auth: { playerId: getOrCreatePlayerId() },
    autoConnect: false,
  }
) as Socket<ServerToClientEvents, ClientToServerEvents>
