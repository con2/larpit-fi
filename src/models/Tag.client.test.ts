import { describe, expect, it } from "vitest";

import {
  diffLarpTags,
  parseLarpTagsFromFormData,
  parseTagsFromFormData,
  tagFieldNames,
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

const [a, b, c] = [
  "019a0000-0000-7000-8000-00000000000a",
  "019a0000-0000-7000-8000-00000000000b",
  "019a0000-0000-7000-8000-00000000000c",
];

describe("parseTagsFromFormData", () => {
  it("returns null when the form has no tags field", () => {
    const data = new FormData();
    data.append("tagId", a);
    expect(parseTagsFromFormData(data)).toBeNull();
  });

  it("reads every loaded and picked tag once, skipping what is not an id", () => {
    const data = new FormData();
    data.append(tagsFieldMarker, "1");
    data.append("tagLoaded", a);
    for (const id of [a, b, a, " ", "nonsense", c]) data.append("tagId", id);
    expect(parseTagsFromFormData(data)).toEqual({
      loaded: [a],
      desired: [a, b, c],
    });
  });

  it("reads an empty selection as no tags, so that the tags are removed", () => {
    const data = new FormData();
    data.append(tagsFieldMarker, "1");
    data.append("tagLoaded", a);
    expect(parseTagsFromFormData(data)).toEqual({ loaded: [a], desired: [] });
  });
});

describe("parseLarpTagsFromFormData", () => {
  it("reads only the fields of the given larp when a form tags several", () => {
    const [larpA, larpB] = [b, c];
    const data = new FormData();
    data.append(tagFieldNames(larpA).loaded, a);
    data.append(tagFieldNames(larpA).desired, b);
    data.append(tagFieldNames(larpB).desired, c);
    expect(parseLarpTagsFromFormData(data, larpA)).toEqual({
      loaded: [a],
      desired: [b],
    });
    expect(parseLarpTagsFromFormData(data, larpB)).toEqual({
      loaded: [],
      desired: [c],
    });
  });
});

describe("diffLarpTags", () => {
  it("adds the new and removes the dropped tags", () => {
    expect(diffLarpTags([a, b], [b, c], [a, b])).toEqual({
      addTags: [c],
      removeTags: [a],
    });
  });

  it("finds nothing to do when the tags stay the same in another order", () => {
    expect(diffLarpTags([a, b], [b, a], [a, b])).toEqual({
      addTags: [],
      removeTags: [],
    });
  });

  it("keeps a tag that someone else added after the form was loaded", () => {
    expect(diffLarpTags([a], [a], [a, c])).toEqual({
      addTags: [],
      removeTags: [],
    });
  });

  it("does not re-add or re-remove what someone else already changed", () => {
    expect(diffLarpTags([a], [b], [b])).toEqual({
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
