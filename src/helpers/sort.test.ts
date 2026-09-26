import { describe, expect, it } from "vitest";
import { compareDescNullsLast, compareNullsLast } from "./sort";

const dates = [null, "2024-01-01", undefined, "2026-01-01", "2025-01-01"];

describe("compareNullsLast", () => {
  it("sorts ascending with nulls last", () => {
    expect([...dates].sort(compareNullsLast)).toEqual([
      "2024-01-01",
      "2025-01-01",
      "2026-01-01",
      null,
      undefined,
    ]);
  });
});

describe("compareDescNullsLast", () => {
  it("sorts descending with nulls still last", () => {
    expect([...dates].sort(compareDescNullsLast)).toEqual([
      "2026-01-01",
      "2025-01-01",
      "2024-01-01",
      null,
      undefined,
    ]);
  });
});
