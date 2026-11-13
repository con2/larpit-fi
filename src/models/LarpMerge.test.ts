import { describe, expect, it } from "vitest";

import {
  diffLarps,
  type MergeableLarp,
  mergeableFields,
  resolveMergeSides,
  unionLinks,
} from "./LarpMerge.client";

const emptyLarp = Object.fromEntries(
  mergeableFields.map((field) => [field, null]),
) as MergeableLarp;

function larp(fields: Partial<MergeableLarp>): MergeableLarp {
  return {
    ...emptyLarp,
    name: "Kalevala",
    type: "ONE_SHOT",
    language: "fi",
    ...fields,
  };
}

function statusOf(a: MergeableLarp, b: MergeableLarp, field: string) {
  return diffLarps(a, b).find((d) => d.field === field);
}

describe("diffLarps", () => {
  it("treats null and the empty string as the same empty value", () => {
    expect(
      statusOf(larp({ tagline: "" }), larp({ tagline: null }), "tagline"),
    ).toMatchObject({ status: "identical" });
  });

  it("preselects the filled side when the other is empty", () => {
    expect(
      statusOf(larp({ tagline: "" }), larp({ tagline: "B" }), "tagline"),
    ).toMatchObject({ status: "filled", defaultSide: "b" });
    expect(
      statusOf(
        larp({ numPlayerCharacters: 0 }),
        larp({}),
        "numPlayerCharacters",
      ),
    ).toMatchObject({ status: "filled", defaultSide: "a" });
  });

  it("asks the moderator when both sides have differing values", () => {
    expect(
      statusOf(larp({ tagline: "A" }), larp({ tagline: "B" }), "tagline"),
    ).toMatchObject({ status: "conflict", defaultSide: "a" });
  });

  it("compares cancellation as yes or no, and never treats not cancelled as empty", () => {
    expect(
      statusOf(
        larp({ cancelledAt: "2027-01-01T00:00:00Z" }),
        larp({ cancelledAt: "2027-02-01T00:00:00Z" }),
        "cancelledAt",
      ),
    ).toMatchObject({ status: "identical" });
    expect(
      statusOf(
        larp({}),
        larp({ cancelledAt: "2027-02-01T00:00:00Z" }),
        "cancelledAt",
      ),
    ).toMatchObject({ status: "conflict" });
  });

  it("keeps A's alias and header image by default without asking", () => {
    const a = larp({ alias: "a", headerImageId: "image-a" });
    const b = larp({ alias: "b", headerImageId: "image-b" });
    expect(statusOf(a, b, "alias")).toMatchObject({
      status: "keepA",
      defaultSide: "a",
    });
    expect(statusOf(a, b, "headerImageId")).toMatchObject({
      status: "keepA",
      defaultSide: "a",
    });
    expect(statusOf(larp({}), b, "alias")).toMatchObject({
      status: "filled",
      defaultSide: "b",
    });
  });
});

describe("resolveMergeSides", () => {
  const diff = diffLarps(
    larp({ name: "A", tagline: "" }),
    larp({ name: "B", tagline: "B" }),
  );

  it("refuses while a conflict has no explicit choice", () => {
    expect(resolveMergeSides(diff, { fields: {} })).toBeNull();
  });

  it("takes explicit choices and the defaults of the rest", () => {
    expect(resolveMergeSides(diff, { fields: { name: "b" } })).toEqual({
      name: "b",
      tagline: "b",
    });
  });

  it("accepts a custom name as the decision on the name", () => {
    expect(
      resolveMergeSides(diff, { fields: {}, customName: "Kalevala" }),
    ).toEqual({ name: "a", tagline: "b" });
  });
});

describe("unionLinks", () => {
  const link = (id: string, href: string, type = "HOMEPAGE") => ({
    id,
    type,
    href,
    title: null,
  });

  it("tags each link with the larp it comes from and merges equal addresses", () => {
    expect(
      unionLinks(
        [link("a1", "https://Example.com/larp/"), link("a2", "https://a.fi")],
        [
          link("b1", "https://example.com/larp"),
          link("b2", "https://example.com/larp", "PHOTOS"),
        ],
      ).map((l) => [l.id, l.origin]),
    ).toEqual([
      ["a1", "both"],
      ["a2", "a"],
      ["b2", "b"],
    ]);
  });

  it("keeps the case of paths, which servers may treat as different", () => {
    expect(
      unionLinks(
        [link("a1", "https://example.com/Larp")],
        [link("b1", "https://example.com/larp")],
      ),
    ).toHaveLength(2);
  });
});
