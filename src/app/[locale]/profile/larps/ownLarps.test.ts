import { describe, expect, it } from "vitest";

import { groupOwnLarps, type OwnLarp } from "./ownLarps";

function larp(id: string, startsAt: string | null, endsAt?: string): OwnLarp {
  return { id, startsAt, endsAt: endsAt ?? null } as OwnLarp;
}

// Mid-November 2026: the current year has both upcoming and past larps.
const now = new Date("2026-11-15T12:00:00Z");

describe("groupOwnLarps", () => {
  it("splits the current year into upcoming and past, keeping other years whole", () => {
    const groups = groupOwnLarps(
      [
        larp("next-year", "2027-02-01"),
        larp("december", "2026-12-05"),
        larp("ongoing", "2026-11-14", "2026-11-16"),
        larp("october", "2026-10-03"),
        larp("last-year", "2025-06-01"),
        larp("undated", null),
      ],
      now,
    );

    expect(
      groups.map((group) => [
        group.year,
        group.part,
        group.anchor,
        group.larps.map((l) => l.id),
      ]),
    ).toEqual([
      [2027, null, "2027", ["next-year"]],
      [2026, "upcoming", "2026", ["december", "ongoing"]],
      [2026, "past", "2026-past", ["october"]],
      [2025, null, "2025", ["last-year"]],
      [null, null, "unknown", ["undated"]],
    ]);
  });

  it("does not split the current year when all of its larps are past", () => {
    const groups = groupOwnLarps([larp("october", "2026-10-03")], now);
    expect(groups).toEqual([
      expect.objectContaining({ year: 2026, part: null, anchor: "2026" }),
    ]);
  });
});
