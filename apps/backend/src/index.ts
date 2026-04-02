import express from "express"
import { createServer } from "node:http"
import { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@coup/shared"
import { registerSocketHandlers } from "./socket-handler"

const app = express()
export const httpServer = createServer(app)

export const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env["FRONTEND_URL"] ?? "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

registerSocketHandlers(io)

const PORT = process.env["PORT"] ?? 3001

httpServer.listen(PORT, () => {
  console.log(`Backend listening on :${PORT}`)
})
