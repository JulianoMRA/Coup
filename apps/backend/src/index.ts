import express from "express"
import cors from "cors"
import { createServer } from "node:http"
import { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@coup/shared"
import { registerSocketHandlers } from "./socket-handler"
import { createRoom } from "./rooms/room-store"
import { startCleanupInterval } from "./cleanup"
import { parseAllowedOrigins } from "./cors-origins"

const app = express()
export const httpServer = createServer(app)

const allowedOrigins = parseAllowedOrigins(
  process.env["FRONTEND_URL"],
  "http://localhost:3000",
)

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.post("/api/rooms", (req, res) => {
  const { hostId, hostName } = req.body as { hostId: string; hostName: string }
  if (!hostId || !hostName) {
    res.status(400).json({ error: "hostId and hostName required" })
    return
  }
  const room = createRoom(hostId, hostName)
  res.status(201).json({ roomId: room.roomId })
})

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
})

registerSocketHandlers(io)
startCleanupInterval(io)

const PORT = process.env["PORT"] ?? 3001

httpServer.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`)
})
