import { describe, expect, it } from "vitest";

import {
  contentPagePath,
  pagePathInUiLanguage,
  parseMenuPosition,
  pickPageLanguage,
  validatePageSlug,
} from "./Page.client";

describe("validatePageSlug", () => {
  it("accepts flat slugs and slugs with slashes", () => {
    expect(validatePageSlug("see-also")).toBeNull();
    expect(validatePageSlug("larppaus/mita-on-larppaus")).toBeNull();
  });

  it("refuses uppercase, empty segments and other characters", () => {
    for (const slug of [
      "Larppaus",
      "larppaus/",
      "/larppaus",
      "a//b",
      "ä",
      "",
    ]) {
      expect(validatePageSlug(slug)).toBe("invalid");
    }
  });

  it("refuses slugs whose first segment a route or a language owns", () => {
    for (const slug of [
      "calendar/x",
      "larp/what-is-larp",
      "page",
      "fi/larppaus",
      "new",
      "api/x",
    ]) {
      expect(validatePageSlug(slug)).toBe("reserved");
    }
  });
});

describe("page paths", () => {
  it("serves the front page at the root, root pages by slug and others under /page", () => {
    expect(contentPagePath("front-page", "en")).toBe("/");
    expect(contentPagePath("larppaus/sanasto", "fi")).toBe(
      "/fi/larppaus/sanasto",
    );
    expect(contentPagePath("see-also", "fi")).toBe("/page/see-also/fi");

    expect(pagePathInUiLanguage("larppaus/sanasto")).toBe("/larppaus/sanasto");
    expect(pagePathInUiLanguage("see-also")).toBe("/page/see-also");
  });
});

describe("parseMenuPosition", () => {
  it("treats a blank field as no position", () => {
    expect(parseMenuPosition("")).toBeNull();
    expect(parseMenuPosition("  ")).toBeNull();
    expect(parseMenuPosition(null)).toBeNull();
    expect(parseMenuPosition("3")).toBe(3);
    expect(parseMenuPosition("-1")).toBe(-1);
  });
});

describe("pickPageLanguage", () => {
  const fi = { language: "fi", title: "Sanasto" };
  const en = { language: "en", title: "Glossary" };

  it("prefers the UI language and falls back to the language that has the page", () => {
    expect(pickPageLanguage([en, fi], "fi")).toBe(fi);
    expect(pickPageLanguage([fi], "en")).toBe(fi);
    expect(pickPageLanguage([], "fi")).toBeNull();
  });
});
