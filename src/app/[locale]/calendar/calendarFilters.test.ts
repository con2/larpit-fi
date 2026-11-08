import { describe, expect, it } from "vitest";

import {
  CalendarFilters,
  calendarHref,
  matchesFilters,
  parseFilters,
  toggleLanguage,
} from "./calendarFilters";

const none: CalendarFilters = { type: null, signupOpen: false, languages: [] };

describe("parseFilters", () => {
  it("ignores unknown values", () => {
    expect(parseFilters({ type: "bogus", open: "yes", lang: "de" })).toEqual(
      none,
    );
  });

  it("accepts comma-separated and repeated languages in canonical order", () => {
    expect(parseFilters({ lang: "en,fi" }).languages).toEqual(["fi", "en"]);
    expect(parseFilters({ lang: ["sv", "fi"] }).languages).toEqual([
      "fi",
      "sv",
    ]);
  });
});

describe("matchesFilters", () => {
  const finnishCampaign = { type: "CAMPAIGN_LARP", language: "fi" } as const;

  it("matches everything without filters", () => {
    expect(matchesFilters(finnishCampaign, false, none)).toBe(true);
  });

  it("combines the type group, signup open and languages", () => {
    const filters: CalendarFilters = {
      type: "campaigns",
      signupOpen: true,
      languages: ["sv", "fi"],
    };
    expect(matchesFilters(finnishCampaign, true, filters)).toBe(true);
    expect(matchesFilters(finnishCampaign, false, filters)).toBe(false);
    expect(
      matchesFilters(finnishCampaign, true, { ...filters, type: "larps" }),
    ).toBe(false);
    expect(
      matchesFilters(finnishCampaign, true, { ...filters, languages: ["en"] }),
    ).toBe(false);
  });
});

describe("calendarHref", () => {
  it("leaves defaults out", () => {
    expect(calendarHref(null, none)).toBe("/calendar");
  });

  it("keeps the month and filters", () => {
    expect(
      calendarHref("2027-02", {
        type: "events",
        signupOpen: true,
        languages: ["fi", "en"],
      }),
    ).toBe("/calendar?month=2027-02&type=events&open=1&lang=fi%2Cen");
  });
});

describe("toggleLanguage", () => {
  it("adds and removes a language", () => {
    const fi = toggleLanguage(none, "fi");
    expect(fi.languages).toEqual(["fi"]);
    expect(toggleLanguage(fi, "fi").languages).toEqual([]);
  });
});
