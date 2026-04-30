export interface SeatPosition {
  x: string
  y: string
}

export function computeSeatPositions(
  n: number,
  myId: string,
  players: { id: string }[]
): SeatPosition[] {
  const myIdx = players.findIndex((p) => p.id === myId)
  const positions: SeatPosition[] = new Array(n)
  const cx = 50
  const cy = 50
  const rx = 38
  const ry = 36
  for (let i = 0; i < n; i++) {
    const rel = (i - myIdx + n) % n
    const angle = Math.PI / 2 + (rel / n) * 2 * Math.PI
    const x = cx + rx * Math.cos(angle)
    let y = cy + ry * Math.sin(angle)
    if (rel === 0) y = 92
    positions[i] = { x: `${x}%`, y: `${y}%` }
  }
  return positions
}
