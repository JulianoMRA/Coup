"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConnectionBadge } from "@/components/connection-badge"
import { getOrCreatePlayerId } from "@/lib/session"
import { getPlayerName, savePlayerName } from "@/hooks/use-lobby"

export default function Home() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [playerId, setPlayerId] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId())
    const saved = getPlayerName()
    if (saved) setUsername(saved)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!/[a-zA-Z0-9 -]/.test(e.key) && e.key.length === 1) {
      e.preventDefault()
    }
  }

  async function handleCreateRoom() {
    if (!username.trim() || !playerId) return
    setIsCreating(true)
    try {
      const res = await fetch(
        (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001") + "/api/rooms",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostId: playerId, hostName: username.trim() }),
        }
      )
      if (!res.ok) return
      const { roomId } = (await res.json()) as { roomId: string }
      savePlayerName(username.trim())
      router.push(`/room/${roomId}`)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-[400px] flex flex-col gap-4">
        <ConnectionBadge />
        <h1 className="text-[28px] font-semibold">Coup Online</h1>
        <Input
          placeholder="Seu nome"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={16}
        />
        <Button
          onClick={handleCreateRoom}
          disabled={username.trim().length === 0 || isCreating}
          className="w-full"
        >
          Criar Sala
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          ou entre pelo link de convite enviado por um amigo
        </p>
      </div>
    </main>
  )
}
