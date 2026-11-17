import { describe, expect, it } from "vitest";

import {
  EditAction,
  LarpLinkType,
  RelatedLarpType,
  SubmitterRole,
} from "@/prisma/enums";
import { summarizeRequest } from "./ModerationQueue";

const emptyRequest = {
  action: EditAction.UPDATE,
  newContent: {},
  addLinks: [],
  removeLinks: [],
  addTags: [],
  removeTags: [],
  addRelatedLarps: [],
  removeRelatedLarps: [],
  submitterRole: SubmitterRole.NONE,
};

const larpA = "01900000-0000-7000-8000-000000000001";
const larpB = "01900000-0000-7000-8000-000000000002";

describe("summarizeRequest", () => {
  it("counts every change of an update, fields in display order", () => {
    const summary = summarizeRequest({
      ...emptyRequest,
      newContent: { description: "Text", name: "Name", isCancelled: true },
      addLinks: [{ type: LarpLinkType.HOMEPAGE, href: "https://a.example" }],
      removeLinks: [
        { type: LarpLinkType.PHOTOS, href: "https://b.example" },
        { type: LarpLinkType.OTHER, href: "https://c.example" },
      ],
      addTags: [larpA],
      addRelatedLarps: [
        { leftId: larpA, rightId: larpB, type: RelatedLarpType.SEQUEL },
      ],
      submitterRole: SubmitterRole.GAME_MASTER,
    });

    expect(summary).toEqual({
      fieldKeys: ["name", "isCancelled", "description"],
      addsRole: true,
      linksAdded: 1,
      linksRemoved: 2,
      tagsAdded: 1,
      tagsRemoved: 0,
      relationsAdded: 1,
      relationsRemoved: 0,
      marksCancelled: true,
      total: 9,
    });
  });

  it("does not report un-cancelling as cancelling", () => {
    const summary = summarizeRequest({
      ...emptyRequest,
      newContent: { isCancelled: false },
    });
    expect(summary.marksCancelled).toBe(false);
    expect(summary.fieldKeys).toEqual(["isCancelled"]);
  });

  it("leaves the unset flags of a new larp out of its fields", () => {
    const summary = summarizeRequest({
      ...emptyRequest,
      action: EditAction.CREATE,
      newContent: { name: "New larp", tagline: "Tagline" },
    });
    expect(summary.fieldKeys).toEqual(["name", "tagline"]);
    expect(summary.marksCancelled).toBe(false);
  });

  it("skips stored entries that no longer parse", () => {
    const summary = summarizeRequest({
      ...emptyRequest,
      removeLinks: [{ href: "https://untyped.example" }],
    });
    expect(summary.linksRemoved).toBe(0);
    expect(summary.total).toBe(0);
  });
});
