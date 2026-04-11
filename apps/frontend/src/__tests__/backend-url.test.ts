import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { getBackendUrl } from "../lib/backend-url"

describe("getBackendUrl", () => {
  const originalEnv = process.env.NEXT_PUBLIC_BACKEND_URL

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_BACKEND_URL
  })

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = originalEnv
    }
  })

  it("should_return_localhost_default_when_env_is_unset", () => {
    expect(getBackendUrl()).toBe("http://localhost:3001")
  })

  it("should_return_env_value_unchanged_when_no_trailing_slash", () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "https://api.example.com"
    expect(getBackendUrl()).toBe("https://api.example.com")
  })

  it("should_strip_single_trailing_slash", () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "https://api.example.com/"
    expect(getBackendUrl()).toBe("https://api.example.com")
  })

  it("should_strip_multiple_trailing_slashes", () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "https://api.example.com///"
    expect(getBackendUrl()).toBe("https://api.example.com")
  })

  it("should_preserve_path_segments_without_trailing_slash", () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "https://api.example.com/v1/"
    expect(getBackendUrl()).toBe("https://api.example.com/v1")
  })
})
