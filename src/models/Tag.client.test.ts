import { describe, expect, it } from "vitest";

import {
  diffLarpTags,
  maxTagsPerLarp,
  parseTagIdsFromFormData,
  suggestTagSlug,
  tagDescriptionExcerpt,
  tagMatches,
  tagsFieldMarker,
} from "./Tag.client";

describe("suggestTagSlug", () => {
  it("slugifies the English name", () => {
    expect(suggestTagSlug("Post-apocalyptic")).toBe("post-apocalyptic");
    expect(suggestTagSlug("Horror & Mystery")).toBe("horror-mystery");
    expect(suggestTagSlug("Café Society")).toBe("cafe-society");
  });

  it("does not end the slug in a hyphen when it cuts a long name", () => {
    const slug = suggestTagSlug(`${"a".repeat(59)} b`);
    expect(slug).toBe("a".repeat(59));
  });
});

describe("parseTagIdsFromFormData", () => {
  it("returns null when the form has no tags field", () => {
    const data = new FormData();
    data.append("tagId", "a");
    expect(parseTagIdsFromFormData(data)).toBeNull();
  });

  it("reads every tagId once", () => {
    const data = new FormData();
    data.append(tagsFieldMarker, "1");
    for (const id of ["a", "b", "a", " ", "c"]) data.append("tagId", id);
    expect(parseTagIdsFromFormData(data)).toEqual(["a", "b", "c"]);
  });

  it("reads an empty selection as no tags, so that the tags are removed", () => {
    const data = new FormData();
    data.append(tagsFieldMarker, "1");
    expect(parseTagIdsFromFormData(data)).toEqual([]);
  });

  it("keeps at most maxTagsPerLarp tags", () => {
    const data = new FormData();
    data.append(tagsFieldMarker, "1");
    for (let i = 0; i < maxTagsPerLarp + 5; i++) data.append("tagId", `t${i}`);
    expect(parseTagIdsFromFormData(data)).toHaveLength(maxTagsPerLarp);
  });
});

describe("diffLarpTags", () => {
  it("adds the new and removes the dropped tags", () => {
    expect(diffLarpTags(["a", "b"], ["b", "c"])).toEqual({
      addTags: ["c"],
      removeTags: ["a"],
    });
  });

  it("finds nothing to do when the tags stay the same in another order", () => {
    expect(diffLarpTags(["a", "b"], ["b", "a"])).toEqual({
      addTags: [],
      removeTags: [],
    });
  });
});

describe("tagMatches", () => {
  const tag = { nameFi: "Kauhu", nameEn: "Horror" };

  it("matches either name, ignoring case", () => {
    expect(tagMatches(tag, "kau")).toBe(true);
    expect(tagMatches(tag, "HORR")).toBe(true);
    expect(tagMatches(tag, "scifi")).toBe(false);
  });

  it("folds foreign letters", () => {
    expect(tagMatches({ nameFi: "Erreàn", nameEn: "Erreàn" }, "errean")).toBe(
      true,
    );
  });
});

describe("tagDescriptionExcerpt", () => {
  it("drops Markdown syntax and keeps link texts", () => {
    expect(tagDescriptionExcerpt("**Dark** [stories](https://x.fi)")).toBe(
      "Dark stories",
    );
  });

  it("cuts at a word boundary", () => {
    expect(tagDescriptionExcerpt("one two three", 9)).toBe("one two…");
  });
});
