const DEFAULT_BACKEND_URL = "http://localhost:3001"

export function getBackendUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_BACKEND_URL
  return raw.replace(/\/+$/, "")
}
