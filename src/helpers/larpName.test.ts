import { describe, expect, it } from "vitest";

import { typesetDashes, typesetMarkdownDashes } from "./larpName";

describe("typesetDashes", () => {
  it.each([
    ["Yö - 2. pelautus", "Yö – 2. pelautus"],
    [
      "Lucet - Yön perhosia - 3. pelautus",
      "Lucet – Yön perhosia – 3. pelautus",
    ],
    ["A -\u00a0B", "A –\u00a0B"],
    // Hyphens attached to a word are compound-word hyphens, not dashes.
    ["Pekka Töpöhäntä -larppi", "Pekka Töpöhäntä -larppi"],
    ["Z-ØM – Turvapaikka", "Z-ØM – Turvapaikka"],
    ["Tehdään larppi! -kurssi", "Tehdään larppi! -kurssi"],
  ])("%j → %j", (input, expected) => {
    expect(typesetDashes(input)).toBe(expected);
  });

  it("leaves Markdown list items alone", () => {
    const list = "Ennen listaa:\n- yksi\n  - sisennetty\n - kaksi";
    expect(typesetDashes(list)).toBe(list);
  });
});

describe("typesetMarkdownDashes", () => {
  it("leaves code spans and fenced code blocks alone", () => {
    expect(
      typesetMarkdownDashes("A - B `x - y` C - D\n```\ne - f\n```\nG - H"),
    ).toBe("A – B `x - y` C – D\n```\ne - f\n```\nG – H");
  });
});
