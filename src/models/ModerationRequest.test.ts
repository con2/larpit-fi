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

  it("stores text composed, so search treats pasted letters like typed ones", () => {
    const content = ModerationRequestContent.parse({
      name: "Po\u0308llo\u0308",
      tagline: "Errea\u0300n",
    });
    expect(content.name).toBe("Pöllö");
    expect(content.tagline).toBe("Erreàn");
  });
});
