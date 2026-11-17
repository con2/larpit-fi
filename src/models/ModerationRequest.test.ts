import { describe, expect, it } from "vitest";

import { LarpLinkType, SubmitterRole } from "@/prisma/enums";
import {
  type ApprovalSelection,
  countChanges,
  ModerationRequestContent,
  type RequestChanges,
  splitRequestChanges,
} from "./ModerationRequest";

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

describe("splitRequestChanges", () => {
  const changes: RequestChanges = {
    newContent: { name: "New name", tagline: "New tagline" },
    addLinks: [
      { type: LarpLinkType.HOMEPAGE, href: "https://a.example" },
      { type: LarpLinkType.PHOTOS, href: "https://b.example" },
    ],
    removeLinks: [],
    addTags: ["tag-1", "tag-2"],
    removeTags: ["tag-3"],
    addRelatedLarps: [],
    removeRelatedLarps: [],
    role: SubmitterRole.GAME_MASTER,
  };

  const everything: ApprovalSelection = {
    fields: ["name", "tagline"],
    addLinks: [0, 1],
    removeLinks: [],
    addTags: [0, 1],
    removeTags: [0],
    addRelatedLarps: [],
    removeRelatedLarps: [],
    role: true,
  };

  it("applies everything when there is no selection", () => {
    expect(splitRequestChanges(changes)).toEqual({
      applied: changes,
      declined: null,
    });
  });

  it("declines nothing when the selection covers every change", () => {
    expect(splitRequestChanges(changes, everything)).toEqual({
      applied: changes,
      declined: null,
    });
  });

  it("moves unselected fields, list entries and the role to declined", () => {
    const { applied, declined } = splitRequestChanges(changes, {
      ...everything,
      fields: ["name"],
      addLinks: [1],
      removeTags: [],
      role: false,
    });

    expect(applied).toEqual({
      ...changes,
      newContent: { name: "New name" },
      addLinks: [changes.addLinks[1]],
      removeTags: [],
      role: SubmitterRole.NONE,
    });
    expect(declined).toEqual({
      newContent: { tagline: "New tagline" },
      addLinks: [changes.addLinks[0]],
      removeLinks: [],
      addTags: [],
      removeTags: ["tag-3"],
      addRelatedLarps: [],
      removeRelatedLarps: [],
      role: SubmitterRole.GAME_MASTER,
    });
    expect(countChanges(applied) + countChanges(declined!)).toBe(
      countChanges(changes),
    );
  });

  it("does not count a declined role when the request asked for none", () => {
    const { declined } = splitRequestChanges(
      { ...changes, role: SubmitterRole.NONE },
      { ...everything, role: false },
    );
    expect(declined).toBeNull();
  });
});
