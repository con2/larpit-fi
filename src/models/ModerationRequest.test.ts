import { describe, expect, it } from "vitest";

import { ModerationRequestContent } from "./ModerationRequest";

describe("ModerationRequestContent", () => {
  it("treats empty participant counts as unknown rather than zero", () => {
    const content = ModerationRequestContent.parse({
      name: "Larp",
      numPlayerCharacters: "",
      numTotalParticipants: "",
    });
    expect(content.numPlayerCharacters).toBeNull();
    expect(content.numTotalParticipants).toBeNull();
  });

  it("parses filled participant counts as integers", () => {
    const content = ModerationRequestContent.parse({
      name: "Larp",
      numPlayerCharacters: "12",
      numTotalParticipants: "15",
    });
    expect(content.numPlayerCharacters).toBe(12);
    expect(content.numTotalParticipants).toBe(15);
  });
});
