import express from "express"
import { createServer } from "http"
import { Server } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents } from "@coup/shared"

const app = express()
const httpServer = createServer(app)

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

io.on("connection", (socket) => {
  socket.on("PING", () => {
    socket.emit("PONG")
  })
})

const PORT = process.env["PORT"] ?? 3001

httpServer.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
})
