import { describe, expect, it } from "vitest";

import {
  splitRunSuffix,
  typesetDashes,
  typesetMarkdownDashes,
} from "./larpName";

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

describe("splitRunSuffix", () => {
  it.each([
    ["Ehtoo (2. pelautus)", "Ehtoo", "2. pelautus"],
    [
      "Danakar: Räjähdysherkkä (3.\u00a0pelautus)",
      "Danakar: Räjähdysherkkä",
      "3.\u00a0pelautus",
    ],
    ["Briarhollow (Run 1)", "Briarhollow", "Run 1"],
    [
      "Curse the Darkness (Run 8/Finnish Run 1)",
      "Curse the Darkness",
      "Run 8/Finnish Run 1",
    ],
    ["Do Crime [English run]", "Do Crime", "English run"],
    ["Rakas viholliseni (pelautus 15)", "Rakas viholliseni", "pelautus 15"],
    ["Rakas viholliseni – Pelautus 13", "Rakas viholliseni", "Pelautus 13"],
    ["Rakas viholliseni – Superpelautus", "Rakas viholliseni", "Superpelautus"],
    ["Yö - 2. pelautus", "Yö", "2. pelautus"],
    ["Odysseus 2024 –\u00a0Run 2", "Odysseus 2024", "Run 2"],
    ["Shadows in Time - 22nd run", "Shadows in Time", "22nd run"],
    ["Abandon Ship, 11. pelautus", "Abandon Ship", "11. pelautus"],
    ["Yhtä matkaa - pelautukset 1 ja 2", "Yhtä matkaa", "pelautukset 1 ja 2"],
    ["Ævintýr (etäpelautus)", "Ævintýr", "etäpelautus"],
    [
      "Lapset (2. pelautus, Myssy-pelautus)",
      "Lapset",
      "2. pelautus, Myssy-pelautus",
    ],
    ["Monacon ruhtinaat 2. pelautus", "Monacon ruhtinaat", "2. pelautus"],
    ["Vihan itkuvirsi 2018 1.pelautus", "Vihan itkuvirsi 2018", "1.pelautus"],
    ["Arki-ilta Gothamissa V pelautus", "Arki-ilta Gothamissa", "V pelautus"],
    // Earlier brackets and dashes stay in the name.
    [
      "Inner Domain (Sisäinen valtakunta) - 2. run",
      "Inner Domain (Sisäinen valtakunta)",
      "2. run",
    ],
    [
      "Lucet - Yön perhosia (2. pelautus)",
      "Lucet – Yön perhosia",
      "2. pelautus",
    ],
    [
      "Z-ØM – Turvapaikka (lauantain pelautus)",
      "Z-ØM – Turvapaikka",
      "lauantain pelautus",
    ],
  ])("%j", (input, name, suffix) => {
    expect(splitRunSuffix(input)).toEqual({ name, suffix });
  });

  it.each([
    // Supercampaign – subcampaign: larp; no part of it names a run.
    "Pohjolan tuho – Kurssi 233: Kutsutut",
    "Pohjolan tuho – Kurssi 233",
    "On the Run: Final Episode",
    "Aldens (7. peli)",
    "Entine 2.0 syksyn toinen uudelleen pelautus (10.9.)",
    "Hukankurun etäopetuspäivä -etälarp",
    "Pirunpiilo 2",
  ])("does not split %j", (input) => {
    expect(splitRunSuffix(input)).toEqual({
      name: typesetDashes(input),
      suffix: null,
    });
  });
});
