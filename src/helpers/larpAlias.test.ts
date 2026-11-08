import { describe, expect, it } from "vitest";

import type { Language } from "@/prisma/enums";

import { parseRunNumber, suggestLarpAlias } from "./larpAlias";

describe("parseRunNumber", () => {
  it.each([
    ["2. pelautus", 2],
    ["1.pelautus", 1],
    ["Pelautus 13", 13],
    ["22nd run", 22],
    ["Run 3", 3],
    ["V pelautus", 5],
    ["Run IV", 4],
    ["Run XII", 12],
    ["toinen pelautus", 2],
    ["Kuudes pelautus", 6],
    ["Second Run", 2],
  ])("%j → %d", (suffix, runNumber) => {
    expect(parseRunNumber(suffix)).toBe(runNumber);
  });

  it.each([
    "English run",
    "etäpelautus",
    "pelautukset 1 ja 2",
    "Run 8/Finnish Run 1",
    // Roman numerals only count in upper case, and ordinal words only as whole words.
    "lauantain pelautus",
    "Secondary run",
    "vi run",
  ])("finds no single run number in %j", (suffix) => {
    expect(parseRunNumber(suffix)).toBeNull();
  });
});

describe("suggestLarpAlias", () => {
  it.each<[string, Language, string]>([
    ["Welcome to Grayhaven – 2. pelautus", "fi", "welcome-to-grayhaven-p2"],
    ["Mars: 2175 (2. pelautus)", "fi", "mars-2175-p2"],
    ["Rakas viholliseni – Pelautus 11", "fi", "rakas-viholliseni-p11"],
    ["Arki-ilta Gothamissa V pelautus", "fi", "arki-ilta-gothamissa-p5"],
    ["Odysseus 2024 – Run 2", "en", "odysseus-2024-run2"],
    ["Debÿtante Möshpit (2nd Run)", "en", "debytante-moshpit-run2"],
    [
      "The Winter Queen's Masquerade (Run 8)",
      "en",
      "the-winter-queens-masquerade-run8",
    ],
    ["Korpkvädet (Run 2)", "sv", "korpkvadet-run2"],
    // Without a single run number, the whole name goes into the alias.
    ["Daemon (English run)", "en", "daemon-english-run"],
    [
      "Curse the Darkness (Run 8/Finnish Run 1)",
      "en",
      "curse-the-darkness-run-8-finnish-run-1",
    ],
    [
      "Tulenpunaisten ruusujen valtakunta",
      "fi",
      "tulenpunaisten-ruusujen-valtakunta",
    ],
    ["Ævintýr", "fi", "aevintyr"],
    [
      "Łódź/Litzmannstadt 1944 (pelautus 2)",
      "fi",
      "lodz-litzmannstadt-1944-p2",
    ],
    [
      "Knutepunkt/Knutpunkt/Knudepunkt/Solmukohta",
      "en",
      "knutepunkt-knutpunkt-knudepunkt-solmukohta",
    ],
  ])("%j (%s) → %j", (name, language, alias) => {
    expect(suggestLarpAlias(name, language, 100)).toBe(alias);
  });

  it("cuts a long name at a word boundary and keeps the run number", () => {
    expect(
      suggestLarpAlias("Kolmas tähti oikealta (2. pelautus)", "fi", 16),
    ).toBe("kolmas-tahti-p2");
  });

  it("suggests nothing for a name without letters or digits", () => {
    expect(suggestLarpAlias("!!!", "fi", 100)).toBeNull();
  });
});
