"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Swords } from "lucide-react"
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
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Swords className="h-7 w-7 text-zinc-400" />
            <h1 className="text-4xl font-bold tracking-[0.25em] text-zinc-100 font-cinzel">COUP</h1>
            <Swords className="h-7 w-7 text-zinc-400 -scale-x-100" />
          </div>
          <p className="text-xs text-zinc-500 text-center tracking-[0.3em] uppercase font-cinzel mb-4">Online</p>
          <Input
            placeholder="Seu nome"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={16}
            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
          />
          <Button
            onClick={handleCreateRoom}
            disabled={username.trim().length === 0 || isCreating}
            className="w-full min-h-[44px]"
          >
            Criar Sala
          </Button>
          <p className="text-sm text-zinc-500 text-center">
            ou entre pelo link de convite enviado por um amigo
          </p>
        </div>
      </div>
    </main>
  )
}
