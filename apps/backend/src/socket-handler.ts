import type { Server, Socket } from "socket.io"
import type { ClientToServerEvents, ServerToClientEvents, GameAction, GameState } from "@coup/shared"
import { GamePhase } from "@coup/shared"
import { rooms, joinRoom, setReady, toLobbyState } from "./rooms/room-store"
import { initGame, processAction } from "./game/game-engine"
import { games, getGame, setGame } from "./game/game-store"
import { projectStateForPlayer } from "./game/project-state"

export const disconnectTimers = new Map<string, { roomId: string; timer: NodeJS.Timeout }>()
export const roomDisconnectedPlayers = new Map<string, Set<string>>()

function broadcastStateToRoom(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
  state: GameState
): void {
  const disconnected = [...(roomDisconnectedPlayers.get(roomId) ?? [])]
  for (const player of state.players) {
    const projection = projectStateForPlayer(state, player.id, disconnected)
    io.to(player.id).emit("STATE_UPDATE", projection)
  }
}

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
    // Each player joins a private room so we can send personalised projections
    socket.join(playerId)

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

      broadcastStateToRoom(io, roomId, initialState)
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

      if (result.state.phase === GamePhase.GAME_OVER) {
        const room = rooms.get(roomId)
        if (room) {
          room.status = "GAME_OVER"
        }
      }

      broadcastStateToRoom(io, roomId, result.state)
    })

    socket.on("REJOIN_ROOM", (roomId) => {
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit("ERROR", "Room not found")
        return
      }

      const isInRoom = room.players.some(p => p.playerId === playerId)
      if (!isInRoom) {
        socket.emit("ERROR", "Not in room")
        return
      }

      // Cancel grace timer if active
      const timerEntry = disconnectTimers.get(playerId)
      if (timerEntry) {
        clearTimeout(timerEntry.timer)
        disconnectTimers.delete(playerId)
      }
      roomDisconnectedPlayers.get(roomId)?.delete(playerId)

      socket.join(roomId)

      const game = getGame(roomId)
      if (game) {
        const disconnected = [...(roomDisconnectedPlayers.get(roomId) ?? [])]
        const projection = projectStateForPlayer(game, playerId, disconnected)
        socket.emit("STATE_UPDATE", projection)
        // Broadcast to room so others see reconnected player label disappear
        broadcastStateToRoom(io, roomId, game)
      } else {
        socket.emit("LOBBY_UPDATE", toLobbyState(room))
      }
    })

    socket.on("REMATCH", (roomId) => {
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit("ERROR", "Room not found")
        return
      }

      const isInRoom = room.players.some(p => p.playerId === playerId)
      if (!isInRoom) {
        socket.emit("ERROR", "Not in room")
        return
      }

      const game = getGame(roomId)
      if (!game || game.phase !== GamePhase.GAME_OVER) {
        socket.emit("ERROR", "Game is not over")
        return
      }

      // Clear disconnected state for this room
      roomDisconnectedPlayers.delete(roomId)

      // Cancel all active disconnect timers for players in this room
      for (const p of room.players) {
        const entry = disconnectTimers.get(p.playerId)
        if (entry && entry.roomId === roomId) {
          clearTimeout(entry.timer)
          disconnectTimers.delete(p.playerId)
        }
      }

      // Reset room status and start new game
      room.status = "IN_GAME"
      room.players = room.players.map(p => ({ ...p, isReady: false }))

      const newState = initGame(roomId, room.players)
      setGame(roomId, newState)

      io.to(roomId).emit("GAME_STARTED", roomId)
      broadcastStateToRoom(io, roomId, newState)
    })

    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${playerId}`)

      // Find the room this player belongs to
      let foundRoomId: string | undefined
      for (const [roomId, room] of rooms) {
        if (room.players.some(p => p.playerId === playerId)) {
          foundRoomId = roomId
          break
        }
      }

      if (!foundRoomId) return

      const roomId = foundRoomId
      const game = getGame(roomId)
      if (!game || game.phase === GamePhase.GAME_OVER) return

      // Mark player as disconnected
      if (!roomDisconnectedPlayers.has(roomId)) {
        roomDisconnectedPlayers.set(roomId, new Set())
      }
      roomDisconnectedPlayers.get(roomId)!.add(playerId)

      // Broadcast updated state so other players see disconnect label
      broadcastStateToRoom(io, roomId, game)

      // Start 30s grace timer
      const timer = setTimeout(() => {
        handleDisconnectTimeout(io, playerId, roomId)
      }, 30_000)

      disconnectTimers.set(playerId, { roomId, timer })
    })
  })
}

function handleDisconnectTimeout(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  playerId: string,
  roomId: string
): void {
  const game = getGame(roomId)
  if (!game || game.phase === GamePhase.GAME_OVER) {
    disconnectTimers.delete(playerId)
    roomDisconnectedPlayers.get(roomId)?.delete(playerId)
    return
  }

  let action: GameAction | undefined

  if (
    (game.phase === GamePhase.AWAITING_REACTIONS || game.phase === GamePhase.AWAITING_BLOCK_CHALLENGE) &&
    game.pendingAction?.pendingReactions[playerId] === "WAITING"
  ) {
    action = { type: "PASS", playerId }
  } else if (game.phase === GamePhase.AWAITING_ACTION && game.activePlayerId === playerId) {
    // auto-INCOME gives +1 coin as intentional v1 behavior: simplest valid action to advance the turn
    action = { type: "INCOME", playerId }
  }

  if (action) {
    const result = processAction(game, action)
    if (result.ok) {
      setGame(roomId, result.state)

      if (result.state.phase === GamePhase.GAME_OVER) {
        const room = rooms.get(roomId)
        if (room) room.status = "GAME_OVER"
      }

      broadcastStateToRoom(io, roomId, result.state)
    }
  }

  disconnectTimers.delete(playerId)
  roomDisconnectedPlayers.get(roomId)?.delete(playerId)
}
