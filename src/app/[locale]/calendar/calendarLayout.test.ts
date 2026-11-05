import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";

import {
  buildAgenda,
  endsWithinWeek,
  layoutWeek,
  weekMondays,
} from "./calendarLayout";

const date = Temporal.PlainDate.from;

// 2027-02-01 is a Monday (ISO week 5).
const monday = date("2027-02-01");

function item(id: string, startsAt: string, endsAt: string | null = null) {
  return { id, startsAt, endsAt };
}

function summary(
  layout: ReturnType<typeof layoutWeek<ReturnType<typeof item>>>,
) {
  return layout.bars.map((bar) => [
    bar.item.id,
    bar.lane,
    bar.startColumn,
    bar.endColumn,
  ]);
}

describe("weekMondays", () => {
  it("covers every ISO week touching the range", () => {
    // February 2027 starts on a Monday and ends on a Sunday.
    expect(
      weekMondays(date("2027-02-01"), date("2027-02-28")).map(String),
    ).toEqual(["2027-02-01", "2027-02-08", "2027-02-15", "2027-02-22"]);
    // November 2026 starts on a Sunday and ends on a Monday.
    expect(
      weekMondays(date("2026-11-01"), date("2026-11-30")).map(String),
    ).toEqual([
      "2026-10-26",
      "2026-11-02",
      "2026-11-09",
      "2026-11-16",
      "2026-11-23",
      "2026-11-30",
    ]);
  });
});

describe("layoutWeek", () => {
  it("spans multi-day items over grid columns instead of repeating them", () => {
    const layout = layoutWeek([item("a", "2027-02-05", "2027-02-07")], monday);
    expect(summary(layout)).toEqual([["a", 0, 5, 8]]);
    expect(layout.bars[0].continuesBefore).toBe(false);
    expect(layout.bars[0].continuesAfter).toBe(false);
  });

  it("cuts items crossing the week boundary and marks the continuation", () => {
    const crossing = item("a", "2027-01-30", "2027-02-02");
    const thisWeek = layoutWeek([crossing], monday);
    expect(summary(thisWeek)).toEqual([["a", 0, 1, 3]]);
    expect(thisWeek.bars[0].continuesBefore).toBe(true);
    expect(thisWeek.bars[0].continuesAfter).toBe(false);

    const previousWeek = layoutWeek([crossing], date("2027-01-25"));
    expect(summary(previousWeek)).toEqual([["a", 0, 6, 8]]);
    expect(previousWeek.bars[0].continuesAfter).toBe(true);
  });

  it("leaves out items of other weeks", () => {
    const layout = layoutWeek(
      [item("before", "2027-01-31"), item("after", "2027-02-08")],
      monday,
    );
    expect(layout.bars).toEqual([]);
    expect(layout.laneCount).toBe(0);
  });

  it("places the longest item first and reuses free lanes", () => {
    const layout = layoutWeek(
      [
        item("monday", "2027-02-01"),
        item("weekend", "2027-02-05", "2027-02-07"),
        item("tuesday", "2027-02-02"),
        item("friday", "2027-02-05"),
      ],
      monday,
    );
    // The weekend takes lane 0; Monday and Tuesday fit beside it, Friday collides with it.
    expect(summary(layout)).toEqual([
      ["monday", 0, 1, 2],
      ["tuesday", 0, 2, 3],
      ["weekend", 0, 5, 8],
      ["friday", 1, 5, 6],
    ]);
    expect(layout.laneCount).toBe(2);
  });

  it("orders equally long items by start and then by input order", () => {
    const layout = layoutWeek(
      [
        item("b", "2027-02-03"),
        item("c", "2027-02-02"),
        item("a", "2027-02-03"),
      ],
      monday,
    );
    expect(summary(layout)).toEqual([
      ["c", 0, 2, 3],
      ["b", 0, 3, 4],
      ["a", 1, 3, 4],
    ]);
  });

  it("counts the items beyond the visible lanes per day", () => {
    const sixOnSaturday = Array.from({ length: 6 }, (_, i) =>
      item(`sat${i}`, "2027-02-06"),
    );
    const layout = layoutWeek(
      [...sixOnSaturday, item("long", "2027-02-04", "2027-02-07")],
      monday,
    );
    expect(layout.laneCount).toBe(7);
    // "long" takes lane 0, so the Saturday items take lanes 1–6 and three are collapsed.
    expect(layout.hiddenCountByDay).toEqual([0, 0, 0, 0, 0, 3, 0]);
  });

  it("treats an end before the start as a one-day item", () => {
    const layout = layoutWeek([item("a", "2027-02-03", "2027-02-01")], monday);
    expect(summary(layout)).toEqual([["a", 0, 3, 4]]);
  });
});

describe("buildAgenda", () => {
  it("lists items once on their first day within the range, grouped by week", () => {
    const agenda = buildAgenda(
      [
        item("started-earlier", "2027-01-29", "2027-02-02"),
        item("weekend", "2027-02-05", "2027-02-07"),
        item("one-day", "2027-02-05"),
        item("next-month", "2027-03-01"),
      ],
      date("2027-02-01"),
      date("2027-02-28"),
    );

    expect(agenda.map((week) => week.monday.toString())).toEqual([
      "2027-02-01",
      "2027-02-08",
      "2027-02-15",
      "2027-02-22",
    ]);
    expect(
      agenda[0].days.map((day) => [
        day.date.toString(),
        day.entries.map((e) => [e.item.id, e.endsOn?.toString() ?? null]),
      ]),
    ).toEqual([
      ["2027-02-01", [["started-earlier", "2027-02-02"]]],
      [
        "2027-02-05",
        [
          ["weekend", "2027-02-07"],
          ["one-day", null],
        ],
      ],
    ]);
    expect(agenda[1].days).toEqual([]);
  });
});

describe("endsWithinWeek", () => {
  it("is true only for a later day of the same ISO week", () => {
    expect(endsWithinWeek(date("2027-02-05"), date("2027-02-07"))).toBe(true);
    expect(endsWithinWeek(date("2027-02-05"), date("2027-02-05"))).toBe(false);
    expect(endsWithinWeek(date("2027-02-06"), date("2027-02-08"))).toBe(false);
    expect(endsWithinWeek(date("2027-02-01"), date("2027-02-08"))).toBe(false);
  });
});
