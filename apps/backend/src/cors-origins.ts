export function parseAllowedOrigins(
  envValue: string | undefined,
  fallback: string,
): string[] {
  const raw = envValue ?? fallback
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter((origin) => origin.length > 0)
}
