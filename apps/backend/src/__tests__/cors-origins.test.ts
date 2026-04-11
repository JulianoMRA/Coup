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

  it("should_convert_wildcard_entry_to_regex", () => {
    const result = parseAllowedOrigins("https://coup-*-team.vercel.app", "fallback")
    expect(result).toHaveLength(1)
    expect(result[0]).toBeInstanceOf(RegExp)
  })

  it("should_match_preview_deploy_urls_via_wildcard", () => {
    const result = parseAllowedOrigins("https://coup-*-team.vercel.app", "fallback")
    const regex = result[0] as RegExp
    expect(regex.test("https://coup-87rc2n8ja-team.vercel.app")).toBe(true)
    expect(regex.test("https://coup-abc123-team.vercel.app")).toBe(true)
  })

  it("should_reject_origins_not_matching_wildcard_pattern", () => {
    const result = parseAllowedOrigins("https://coup-*-team.vercel.app", "fallback")
    const regex = result[0] as RegExp
    expect(regex.test("https://evil.com")).toBe(false)
    expect(regex.test("https://coup-x-team.vercel.appevil.com")).toBe(false)
    expect(regex.test("https://coup--team.vercel.app")).toBe(false)
  })

  it("should_escape_regex_metacharacters_in_literal_parts", () => {
    const result = parseAllowedOrigins("https://a.b-*.example.com", "fallback")
    const regex = result[0] as RegExp
    expect(regex.test("https://a.b-abc.example.com")).toBe(true)
    expect(regex.test("https://axb-abc.example.com")).toBe(false)
  })

  it("should_mix_exact_and_wildcard_entries", () => {
    const result = parseAllowedOrigins(
      "https://prod.vercel.app,https://coup-*-team.vercel.app",
      "fallback",
    )
    expect(result).toHaveLength(2)
    expect(result[0]).toBe("https://prod.vercel.app")
    expect(result[1]).toBeInstanceOf(RegExp)
  })
})
