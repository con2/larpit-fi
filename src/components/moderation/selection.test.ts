import { describe, expect, it } from "vitest";

import { parseApprovalSelection } from "./selection";

describe("parseApprovalSelection", () => {
  it("reads fields, list indexes and the role from checkbox values", () => {
    expect(
      parseApprovalSelection([
        "fields:name",
        "fields:startsAt",
        "addLinks:0",
        "addLinks:2",
        "removeTags:1",
        "role",
      ]),
    ).toEqual({
      fields: ["name", "startsAt"],
      addLinks: [0, 2],
      removeLinks: [],
      addTags: [],
      removeTags: [1],
      addRelatedLarps: [],
      removeRelatedLarps: [],
      role: true,
    });
  });

  it("ignores values it does not know", () => {
    expect(
      parseApprovalSelection(["addLinks:x", "unknown:1", "newContent:name"]),
    ).toMatchObject({ fields: [], addLinks: [], role: false });
  });
});
