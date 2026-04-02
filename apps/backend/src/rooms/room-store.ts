import { customAlphabet } from "nanoid"
import type { LobbyPlayer, LobbyState } from "@coup/shared"

export interface Room extends LobbyState {}

const generateRoomId = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8)

export const rooms = new Map<string, Room>()

function createUniqueRoomId(): string {
  let id: string
  do {
    id = generateRoomId()
  } while (rooms.has(id))
  return id
}

export function createRoom(hostId: string, hostName: string): Room {
  const roomId = createUniqueRoomId()
  const host: LobbyPlayer = { playerId: hostId, name: hostName, isReady: false, joinOrder: 0 }
  const room: Room = {
    roomId,
    players: [host],
    hostId,
    maxPlayers: 6,
    status: "LOBBY",
  }
  rooms.set(roomId, room)
  return room
}

type JoinResult = { ok: true } | { ok: false; error: string }

export function joinRoom(roomId: string, playerId: string, name: string): JoinResult {
  const room = rooms.get(roomId)
  if (!room) return { ok: false, error: "Room not found" }
  if (room.status !== "LOBBY") return { ok: false, error: "Game already started" }
  const alreadyJoined = room.players.find((p) => p.playerId === playerId)
  if (alreadyJoined) return { ok: true }
  if (room.players.length >= room.maxPlayers) return { ok: false, error: "Room full" }
  const player: LobbyPlayer = { playerId, name, isReady: false, joinOrder: room.players.length }
  room.players.push(player)
  return { ok: true }
}

type ReadyResult = { ok: true } | { ok: false; error: string }

export function setReady(roomId: string, playerId: string, isReady: boolean): ReadyResult {
  const room = rooms.get(roomId)
  if (!room) return { ok: false, error: "Room not found" }
  const player = room.players.find((p) => p.playerId === playerId)
  if (!player) return { ok: false, error: "Player not in room" }
  player.isReady = isReady
  return { ok: true }
}

export function toLobbyState(room: Room): LobbyState {
  return {
    roomId: room.roomId,
    players: room.players,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    status: room.status,
  }
}
