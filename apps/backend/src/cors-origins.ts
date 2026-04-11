const REGEX_METACHARS = /[.+?^${}()|[\]\\]/g
const WILDCARD_REPLACEMENT = "[a-zA-Z0-9-]+"

function toOriginMatcher(entry: string): string | RegExp {
  if (!entry.includes("*")) return entry
  const escaped = entry.replace(REGEX_METACHARS, "\\$&")
  const pattern = "^" + escaped.replace(/\*/g, WILDCARD_REPLACEMENT) + "$"
  return new RegExp(pattern)
}

export function parseAllowedOrigins(
  envValue: string | undefined,
  fallback: string,
): (string | RegExp)[] {
  const raw = envValue ?? fallback
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter((origin) => origin.length > 0)
    .map(toOriginMatcher)
}
