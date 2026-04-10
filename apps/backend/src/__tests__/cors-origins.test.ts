import { describe, it, expect } from "vitest"
import { parseAllowedOrigins } from "../cors-origins"

describe("parseAllowedOrigins", () => {
  it("should_return_fallback_when_env_is_undefined", () => {
    expect(parseAllowedOrigins(undefined, "http://localhost:3000")).toEqual([
      "http://localhost:3000",
    ])
  })

  it("should_return_single_origin_when_env_has_one_value", () => {
    expect(parseAllowedOrigins("https://app.vercel.app", "fallback")).toEqual([
      "https://app.vercel.app",
    ])
  })

  it("should_split_comma_separated_list", () => {
    expect(
      parseAllowedOrigins("https://a.com,https://b.com,https://c.com", "fallback"),
    ).toEqual(["https://a.com", "https://b.com", "https://c.com"])
  })

  it("should_trim_whitespace_around_origins", () => {
    expect(parseAllowedOrigins(" https://a.com , https://b.com ", "fallback")).toEqual([
      "https://a.com",
      "https://b.com",
    ])
  })

  it("should_strip_trailing_slash_from_each_origin", () => {
    expect(parseAllowedOrigins("https://a.com/,https://b.com/", "fallback")).toEqual([
      "https://a.com",
      "https://b.com",
    ])
  })

  it("should_drop_empty_entries_from_trailing_commas", () => {
    expect(parseAllowedOrigins("https://a.com,,https://b.com,", "fallback")).toEqual([
      "https://a.com",
      "https://b.com",
    ])
  })
})
