import { Temporal } from "@js-temporal/polyfill";

/** Week rows are at least this many lanes high; a busier week grows to fit all of its bars. */
export const minLanesPerWeek = 3;

/** Calendar days as YYYY-MM-DD; a missing end means a one-day item. */
export interface CalendarSpan {
  startsAt: string;
  endsAt: string | null;
}

interface WeekBar<T> {
  item: T;
  /** 0-based. */
  lane: number;
  /** CSS grid columns of the week, Monday = 1; `endColumn` is exclusive. */
  startColumn: number;
  endColumn: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

export interface WeekLayout<T> {
  monday: Temporal.PlainDate;
  bars: WeekBar<T>[];
  laneCount: number;
}

function spanDates(item: CalendarSpan) {
  const start = Temporal.PlainDate.from(item.startsAt);
  const end = item.endsAt ? Temporal.PlainDate.from(item.endsAt) : start;
  return {
    start,
    end: Temporal.PlainDate.compare(end, start) < 0 ? start : end,
  };
}

function maxDate(a: Temporal.PlainDate, b: Temporal.PlainDate) {
  return Temporal.PlainDate.compare(a, b) >= 0 ? a : b;
}

function minDate(a: Temporal.PlainDate, b: Temporal.PlainDate) {
  return Temporal.PlainDate.compare(a, b) <= 0 ? a : b;
}

function overlaps(
  item: CalendarSpan,
  first: Temporal.PlainDate,
  last: Temporal.PlainDate,
): boolean {
  const { start, end } = spanDates(item);
  return (
    Temporal.PlainDate.compare(start, last) <= 0 &&
    Temporal.PlainDate.compare(end, first) >= 0
  );
}

/** Mondays of the ISO weeks that contain any day from `first` to `last`. */
export function weekMondays(
  first: Temporal.PlainDate,
  last: Temporal.PlainDate,
): Temporal.PlainDate[] {
  const mondays = [];
  for (
    let monday = first.subtract({ days: first.dayOfWeek - 1 });
    Temporal.PlainDate.compare(monday, last) <= 0;
    monday = monday.add({ days: 7 })
  ) {
    mondays.push(monday);
  }
  return mondays;
}

/**
 * Cuts the items to the week starting on `monday` and packs them into lanes: longest piece first,
 * then earliest start, then input order; each piece takes the first lane that is free on all of
 * its days.
 */
export function layoutWeek<T extends CalendarSpan>(
  items: T[],
  monday: Temporal.PlainDate,
): WeekLayout<T> {
  const sunday = monday.add({ days: 6 });

  const pieces = items
    .filter((item) => overlaps(item, monday, sunday))
    .map((item, index) => {
      const { start, end } = spanDates(item);
      const startColumn = maxDate(start, monday).dayOfWeek;
      const endColumn = minDate(end, sunday).dayOfWeek + 1;
      return {
        item,
        index,
        startColumn,
        endColumn,
        continuesBefore: Temporal.PlainDate.compare(start, monday) < 0,
        continuesAfter: Temporal.PlainDate.compare(end, sunday) > 0,
      };
    })
    .sort(
      (a, b) =>
        b.endColumn - b.startColumn - (a.endColumn - a.startColumn) ||
        a.startColumn - b.startColumn ||
        a.index - b.index,
    );

  const lanes: boolean[][] = [];
  const bars: WeekBar<T>[] = [];

  for (const piece of pieces) {
    const days = Array.from(
      { length: piece.endColumn - piece.startColumn },
      (_, i) => piece.startColumn - 1 + i,
    );
    let lane = lanes.findIndex((occupied) => days.every((d) => !occupied[d]));
    if (lane < 0) {
      lane = lanes.length;
      lanes.push(Array<boolean>(7).fill(false));
    }
    for (const day of days) lanes[lane][day] = true;
    bars.push({
      item: piece.item,
      lane,
      startColumn: piece.startColumn,
      endColumn: piece.endColumn,
      continuesBefore: piece.continuesBefore,
      continuesAfter: piece.continuesAfter,
    });
  }

  bars.sort((a, b) => a.lane - b.lane || a.startColumn - b.startColumn);

  return { monday, bars, laneCount: lanes.length };
}

interface AgendaEntry<T> {
  item: T;
  /** Set when the item lasts past the day it is listed on. */
  endsOn: Temporal.PlainDate | null;
}

interface AgendaDay<T> {
  date: Temporal.PlainDate;
  entries: AgendaEntry<T>[];
}

export interface AgendaWeek<T> {
  monday: Temporal.PlainDate;
  sunday: Temporal.PlainDate;
  days: AgendaDay<T>[];
}

/**
 * Lists each item once, on its first day within `first`…`last`, grouped by ISO week. Weeks without
 * items are kept so that the agenda shows them as empty.
 */
export function buildAgenda<T extends CalendarSpan>(
  items: T[],
  first: Temporal.PlainDate,
  last: Temporal.PlainDate,
): AgendaWeek<T>[] {
  const entriesByDay = new Map<string, AgendaEntry<T>[]>();
  for (const item of items) {
    if (!overlaps(item, first, last)) continue;
    const { start, end } = spanDates(item);
    const listedOn = maxDate(start, first);
    const key = listedOn.toString();
    const entries = entriesByDay.get(key) ?? [];
    entries.push({
      item,
      endsOn: Temporal.PlainDate.compare(end, listedOn) > 0 ? end : null,
    });
    entriesByDay.set(key, entries);
  }

  return weekMondays(first, last).map((monday) => {
    const days: AgendaDay<T>[] = [];
    for (let i = 0; i < 7; i++) {
      const date = monday.add({ days: i });
      const entries = entriesByDay.get(date.toString());
      if (entries) days.push({ date, entries });
    }
    return { monday, sunday: monday.add({ days: 6 }), days };
  });
}

/** Whether an agenda end marker can name just the weekday: the end falls later in the same week. */
export function endsWithinWeek(
  listedOn: Temporal.PlainDate,
  endsOn: Temporal.PlainDate,
): boolean {
  const days = listedOn.until(endsOn, { largestUnit: "days" }).days;
  return days > 0 && endsOn.dayOfWeek > listedOn.dayOfWeek && days < 7;
}
