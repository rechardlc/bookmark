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

  it("preserves query values ending in a slash", () => {
    expect(normalizeUrl("https://example.com/path?next=/")).toBe(
      "https://example.com/path?next=/"
    );
  });

  it("preserves trailing slash on root paths", () => {
    expect(normalizeUrl("https://example.com/")).toBe("https://example.com/");
  });

  it("removes uppercase tracking parameter names", () => {
    expect(normalizeUrl("https://example.com/page?UTM_SOURCE=x&id=42")).toBe(
      "https://example.com/page?id=42"
    );
  });

  it("preserves ref as a normal query parameter", () => {
    expect(normalizeUrl("https://example.com/page?ref=docs&id=42")).toBe(
      "https://example.com/page?ref=docs&id=42"
    );
  });

  it("preserves non-tracking query parameters", () => {
    expect(normalizeUrl("https://example.com/page?category=docs&id=42")).toBe(
      "https://example.com/page?category=docs&id=42"
    );
  });
});
