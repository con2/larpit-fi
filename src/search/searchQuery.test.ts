import { describe, expect, it } from "vitest";

import {
  foldForeignLetters,
  foldForeignLettersSql,
  foreignLetterFolds,
  maxQueryLength,
  parseSearchQuery,
} from "./searchQuery";

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

  it("folds foreign letters but keeps Finnish ones in the folded query", () => {
    expect(parseSearchQuery("Erreàn Ævintýr Äänekoski").foldedTsquery).toBe(
      "errean & aevintyr & äänekoski:*",
    );
  });

  it("composes decomposed letters instead of dropping their marks", () => {
    // "pöllö" typed as o + combining diaeresis, as pasted from some macOS sources.
    const decomposed = "po\u0308llo\u0308";
    expect(parseSearchQuery(decomposed).tsquery).toBe("pöllö:*");
  });

  it("caps the input length", () => {
    const parsed = parseSearchQuery("a".repeat(maxQueryLength + 50));
    expect(parsed.text).toHaveLength(maxQueryLength);
    expect(parsed.tsquery).toBe(`${"a".repeat(maxQueryLength)}:*`);
  });
});

describe("foldForeignLetters", () => {
  it("folds marked letters and keeps å, ä and ö", () => {
    expect(foldForeignLetters("Balançoire Z-ØM Łódź Åland Öljy")).toBe(
      "balancoire z-om lodz åland öljy",
    );
  });

  it("has a SQL counterpart that lists every fold", () => {
    const sql = foldForeignLettersSql('"name"');
    for (const letter of Object.keys(foreignLetterFolds)) {
      expect(sql).toContain(letter);
    }
  });
});
