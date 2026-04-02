import { useState, useEffect } from "react"
import { socket } from "@/lib/socket"

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error"

export function useSocketStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("connecting")

  useEffect(() => {
    socket.connect()

    function onConnect() {
      setStatus("connected")
    }

    function onDisconnect() {
      setStatus("disconnected")
    }

    function onConnectError() {
      setStatus("error")
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", onConnectError)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("connect_error", onConnectError)
    }
  }, [])

  return status
}
