import { v4 as uuidv4 } from "uuid"

const SESSION_KEY = "coup_player_id"

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return ""
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const fresh = uuidv4()
  localStorage.setItem(SESSION_KEY, fresh)
  return fresh
}
