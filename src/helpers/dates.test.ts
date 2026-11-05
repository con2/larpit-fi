import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDateRange,
  formatDateTime,
  formatShortDateRange,
} from "./dates";

describe("formatDate", () => {
  it("writes English dates as day, abbreviated month and year", () => {
    expect(formatDate("2027-11-24", "en")).toBe("24 Nov 2027");
  });

  it("writes Finnish and Swedish dates with dots", () => {
    expect(formatDate("2027-02-06", "fi")).toBe("6.2.2027");
    expect(formatDate("2027-02-06", "sv")).toBe("6.2.2027");
  });
});

describe("formatDateRange", () => {
  it("renders a one-day range as a single date", () => {
    expect(formatDateRange("2027-11-24", "2027-11-24", "en")).toBe(
      "24 Nov 2027",
    );
    expect(formatDateRange("2027-11-24", null, "en")).toBe("24 Nov 2027");
  });

  it("shares month and year within a month", () => {
    expect(formatDateRange("2027-04-16", "2027-04-18", "en")).toBe(
      "16–18 Apr 2027",
    );
    expect(formatDateRange("2027-04-16", "2027-04-18", "fi")).toBe(
      "16.–18.4.2027",
    );
  });

  it("shares the year within a year, keeping the dash off a new line in English", () => {
    expect(formatDateRange("2027-11-30", "2027-12-02", "en")).toBe(
      "30 Nov – 2 Dec 2027",
    );
    expect(formatDateRange("2027-11-30", "2027-12-02", "fi")).toBe(
      "30.11.–2.12.2027",
    );
  });

  it("writes both dates in full across a year boundary", () => {
    expect(formatDateRange("2026-12-30", "2027-01-02", "en")).toBe(
      "30 Dec 2026 – 2 Jan 2027",
    );
    expect(formatDateRange("2026-12-30", "2027-01-02", "fi")).toBe(
      "30.12.2026–2.1.2027",
    );
  });

  it("is empty without dates", () => {
    expect(formatDateRange(null, undefined, "en")).toBe("");
  });
});

describe("formatShortDateRange", () => {
  it("drops the year", () => {
    expect(formatShortDateRange("2026-11-06", "2026-11-07", "en")).toBe(
      "6–7 Nov",
    );
    expect(formatShortDateRange("2026-11-06", "2026-11-07", "fi")).toBe(
      "6.–7.11.",
    );
    expect(formatShortDateRange("2026-11-30", "2026-12-02", "en")).toBe(
      "30 Nov – 2 Dec",
    );
  });
});

describe("formatDateTime", () => {
  it("formats in Helsinki time", () => {
    // 16:00 UTC is 18:00 in Helsinki in February.
    expect(formatDateTime(new Date("2027-02-27T16:00:00Z"), "en")).toBe(
      "27 Feb 2027 18:00",
    );
    expect(formatDateTime(new Date("2027-02-27T16:00:00Z"), "fi", true)).toBe(
      "la 27.2.2027 18:00",
    );
  });
});
