import { describe, expect, it } from "vitest";

import { DisplayNameSchema } from "./User";

describe("DisplayNameSchema", () => {
  it("rejects bidi controls that would reorder the text after the name", () => {
    for (const control of ["‮", "‪", "⁦", "⁩"]) {
      expect(DisplayNameSchema.safeParse(`Matti${control}ja`).success).toBe(
        false,
      );
    }
  });

  it("rejects control characters such as newlines", () => {
    expect(DisplayNameSchema.safeParse("Matti\nMeikäläinen").success).toBe(
      false,
    );
  });

  it("keeps emoji joined with zero-width joiners", () => {
    const name = "Matti \u{1f9d9}‍♂️";
    expect(DisplayNameSchema.parse(name)).toBe(name);
  });

  it("composes pasted letters and trims", () => {
    expect(DisplayNameSchema.parse("  Mölli ")).toBe("Mölli");
  });
});
