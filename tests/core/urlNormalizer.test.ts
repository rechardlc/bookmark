import { describe, expect, it } from "vitest";
import { normalizeUrl } from "../../src/core/urlNormalizer";

describe("normalizeUrl", () => {
  it("removes common tracking parameters and hash fragments", () => {
    expect(
      normalizeUrl("https://example.com/page?utm_source=x&gclid=abc&id=42#section")
    ).toBe("https://example.com/page?id=42");
  });

  it("normalizes host casing and removes trailing slashes from non-root paths", () => {
    expect(normalizeUrl("HTTPS://Example.COM/Docs/")).toBe("https://example.com/Docs");
  });

  it("returns the trimmed original value when URL parsing fails", () => {
    expect(normalizeUrl(" not a url ")).toBe("not a url");
  });
});
