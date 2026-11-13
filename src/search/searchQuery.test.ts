import { describe, expect, it } from "vitest";

import { maxQueryLength, parseSearchQuery } from "./searchQuery";

describe("parseSearchQuery", () => {
  it("makes the last word a prefix term and ANDs the words", () => {
    expect(parseSearchQuery("  velhon  odys ").tsquery).toBe("velhon & odys:*");
  });

  it("strips punctuation and tsquery operators from words", () => {
    expect(parseSearchQuery("a&b | !c:* (d) 'e' <-> f").tsquery).toBe(
      "ab & c & d & e & f:*",
    );
  });

  it("keeps letters outside ASCII and digits", () => {
    expect(parseSearchQuery("Äänekoski 2025").tsquery).toBe(
      "Äänekoski & 2025:*",
    );
  });

  it("returns no tsquery for empty or punctuation-only input", () => {
    expect(parseSearchQuery("   ").tsquery).toBeNull();
    expect(parseSearchQuery("&& !! --").tsquery).toBeNull();
  });

  it("caps the input length", () => {
    const parsed = parseSearchQuery("a".repeat(maxQueryLength + 50));
    expect(parsed.text).toHaveLength(maxQueryLength);
    expect(parsed.tsquery).toBe(`${"a".repeat(maxQueryLength)}:*`);
  });
});
