interface CoinProps {
  size?: number
  className?: string
}

export function Coin({ size = 22, className = "" }: CoinProps) {
  return (
    <div
      className={`coin ${size >= 30 ? "lg" : ""} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
