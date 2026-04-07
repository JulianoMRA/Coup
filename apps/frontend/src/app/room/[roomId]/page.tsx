"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectionBadge } from "@/components/connection-badge"
import { getOrCreatePlayerId } from "@/lib/session"
import { getPlayerName, savePlayerName, useLobby } from "@/hooks/use-lobby"
import { useGame } from "@/hooks/use-game"
import { GameBoard } from "@/components/game-board"
import { socket } from "@/lib/socket"
import { cn } from "@/lib/utils"

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const [playerId, setPlayerId] = useState("")
  const [playerName, setPlayerName] = useState<string | null>(null)
  const [nameInput, setNameInput] = useState("")
  const [copied, setCopied] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [myReady, setMyReady] = useState(false)

  useEffect(() => {
    setPlayerId(getOrCreatePlayerId())
    const saved = getPlayerName()
    if (saved) setPlayerName(saved)
    socket.connect()
  }, [])

  const { lobby, error } = useLobby(roomId, playerId, playerName)
  const { game, error: gameError } = useGame(roomId, playerId)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!/[a-zA-Z0-9 -]/.test(e.key) && e.key.length === 1) {
      e.preventDefault()
    }
  }

  function handleJoin() {
    if (!nameInput.trim()) return
    savePlayerName(nameInput.trim())
    setPlayerName(nameInput.trim())
  }

  async function handleCopyLink() {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setShowFallback(true)
    }
  }

  function handleReadyToggle() {
    const next = !myReady
    setMyReady(next)
    socket.emit("SET_READY", roomId, next)
  }

  function handleStartGame() {
    socket.emit("START_GAME", roomId)
  }

  // Game active — switch from lobby to game board (also handles reconnect where only STATE_UPDATE arrives, not GAME_STARTED)
  if (game) {
    return <GameBoard game={game} playerId={playerId} roomId={roomId} error={gameError} />
  }

  // Room not found
  if (error === "Room not found") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-xl font-semibold text-zinc-300">Sala não encontrada.</p>
        <Button onClick={() => router.push("/")}>Voltar ao início</Button>
      </main>
    )
  }

  // Sub-state A: username entry
  if (!playerName) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-[400px] flex flex-col gap-4">
          <ConnectionBadge />
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-8 shadow-2xl flex flex-col gap-4">
            <h1 className="text-xl font-semibold text-zinc-100">Entrar na Sala</h1>
            <p className="text-sm text-zinc-500">Sala: {roomId}</p>
            {error && error !== "Room not found" && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Input
              placeholder="Seu nome"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={16}
              className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
            />
            <p className="text-xs text-zinc-500">
              Apenas letras, números, espaços e hífens. Máximo 16 caracteres.
            </p>
            <Button
              onClick={handleJoin}
              disabled={nameInput.trim().length === 0}
              className="w-full min-h-[44px]"
            >
              Entrar na Sala
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // Sub-state B: active lobby
  const isHost = lobby?.hostId === playerId
  const allReady =
    lobby ? lobby.players.length >= 2 && lobby.players.every((p) => p.isReady) : false
  const startDisabledReason =
    !lobby || lobby.players.length < 2
      ? "Aguarde ao menos 2 jogadores"
      : !allReady
        ? "Aguarde todos os jogadores ficarem prontos"
        : null

  return (
    <main className="min-h-screen flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-[480px] flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-[20px] font-semibold text-zinc-100">Sala de Espera</h1>
          <ConnectionBadge />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Card 1: Invite link */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader className="pb-2">
            <p className="text-sm font-semibold text-zinc-500">Convite</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {showFallback ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs text-zinc-500">Copie o link manualmente</p>
                <p className="text-sm font-mono break-all select-all text-zinc-400">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm font-mono truncate text-zinc-400">
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
            )}
            <Button
              variant="secondary"
              className="w-full gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 min-h-[44px]"
              onClick={handleCopyLink}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copiado!" : "Copiar link"}
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Players */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-base text-zinc-300">
              Jogadores ({lobby?.players.length ?? 0}/6)
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!lobby || lobby.players.length === 0 ? (
              <p className="text-sm text-zinc-500">Aguardando outros jogadores...</p>
            ) : (
              lobby.players.map((player) => (
                <div key={player.playerId} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center text-sm font-semibold shrink-0">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 text-base text-zinc-200">
                    {player.name}
                    {player.playerId === lobby.hostId && (
                      <span className="text-sm text-zinc-500 ml-1">(anfitrião)</span>
                    )}
                  </span>
                  <Badge
                    className={cn(
                      "text-xs",
                      player.isReady
                        ? "bg-emerald-500 text-white hover:bg-emerald-500"
                        : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    )}
                  >
                    {player.isReady ? "Pronto" : "Aguardando"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Ready toggle — all players */}
        <Button
          variant={myReady ? "outline" : "default"}
          className="w-full min-h-[44px]"
          onClick={handleReadyToggle}
        >
          {myReady ? "Cancelar Prontidão" : "Estou Pronto!"}
        </Button>

        {/* Start button — host only */}
        {isHost && (
          <Button
            className="w-full min-h-[44px]"
            disabled={!allReady}
            title={startDisabledReason ?? undefined}
            onClick={handleStartGame}
          >
            Iniciar Jogo
          </Button>
        )}
      </div>
    </main>
  )
}
