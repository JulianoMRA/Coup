import type { CSSProperties } from "react"

interface CoinProps {
  size?: number
  className?: string
  style?: CSSProperties
}

export function Coin({ size = 22, className = "", style }: CoinProps) {
  return (
    <div
      className={`coin ${size >= 30 ? "lg" : ""} ${className}`}
      style={{ width: size, height: size, ...style }}
    />
  )
}
