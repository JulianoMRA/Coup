import { io, type Socket } from "socket.io-client"
import type { ServerToClientEvents, ClientToServerEvents } from "@coup/shared"
import { getOrCreatePlayerId } from "./session"

export const socket = io(
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
  {
    auth: { playerId: getOrCreatePlayerId() },
    autoConnect: false,
  }
) as Socket<ServerToClientEvents, ClientToServerEvents>
