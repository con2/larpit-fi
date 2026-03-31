import AutoSubmitForm from "@/components/AutoSubmitForm";
import MainHeading from "@/components/MainHeading";
import MaybeExternalLink from "@/components/MaybeExternalLink";
import { timezone } from "@/config";
import { toSupportedLanguage } from "@/i18n/locales";
import { getLarpHref } from "@/models/Larp.client";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { Temporal } from "@js-temporal/polyfill";
import Link from "next/link";
import { Container, Table } from "react-bootstrap";
import MonthSelect from "./MonthSelect";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}

interface MonthRow {
  year: number;
  month: number;
}

const midnight = Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 });

// A known Monday used only for deriving weekday header names
const REFERENCE_MONDAY = Temporal.PlainDate.from("2024-01-01");

function parseMonth(
  monthParam: string | undefined,
  now: Temporal.PlainDate,
): Temporal.PlainYearMonth {
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      return Temporal.PlainYearMonth.from({ year, month });
    }
  }
  return Temporal.PlainYearMonth.from({ year: now.year, month: now.month });
}

function toMonthParam(ym: Temporal.PlainYearMonth): string {
  return `${ym.year}-${String(ym.month).padStart(2, "0")}`;
}

function formatMonthTitle(ym: Temporal.PlainYearMonth, locale: string): string {
  const s = ym
    .toPlainDate({ day: 1 })
    .toLocaleString(toSupportedLanguage(locale), {
      month: "long",
      year: "numeric",
    });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatMonthOption(
  year: number,
  month: number,
  locale: string,
): string {
  const monthName = Temporal.PlainDate.from({ year, month, day: 1 }).toLocaleString(
    toSupportedLanguage(locale),
    { month: "long" },
  );
  return `${year}/${String(month).padStart(2, "0")} ${monthName}`;
}

type LarpRow = Awaited<ReturnType<typeof prisma.larp.findMany>>[number] & {
  municipality: { nameFi: string } | null;
};

export default async function CalendarPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { month: monthParam } = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.CalendarPage;

  const now = Temporal.Now.plainDateISO(timezone);
  const currentMonth = parseMonth(monthParam, now);
  const prevMonth = currentMonth.subtract({ months: 1 });
  const nextMonth = currentMonth.add({ months: 1 });

  const monthFirstDay = currentMonth.toPlainDate({ day: 1 });
  const monthLastDay = currentMonth.toPlainDate({
    day: currentMonth.daysInMonth,
  });

  // Grid always starts on the Monday on or before the 1st (dayOfWeek: 1=Mon…7=Sun)
  const gridStart = monthFirstDay.subtract({
    days: monthFirstDay.dayOfWeek - 1,
  });
  // Grid always ends on the Sunday on or after the last day
  const gridEnd = monthLastDay.add({ days: 7 - monthLastDay.dayOfWeek });

  const gridStartDate = new Date(
    gridStart
      .toZonedDateTime({ timeZone: timezone, plainTime: midnight })
      .toInstant().epochMilliseconds,
  );
  const gridEndDate = new Date(
    gridEnd
      .add({ days: 1 })
      .toZonedDateTime({ timeZone: timezone, plainTime: midnight })
      .toInstant().epochMilliseconds,
  );

  const [larps, monthRows] = await Promise.all([
    prisma.larp.findMany({
      where: {
        startsAt: { lt: gridEndDate },
        OR: [
          { endsAt: { gte: gridStartDate } },
          { endsAt: null, startsAt: { gte: gridStartDate } },
        ],
      },
      orderBy: { startsAt: "asc" },
      include: { municipality: { select: { nameFi: true } } },
    }) as Promise<LarpRow[]>,
    prisma.$queryRaw<MonthRow[]>`
      select
        extract(year from starts_at at time zone ${timezone})::int as year,
        extract(month from starts_at at time zone ${timezone})::int as month
      from larp
      where starts_at is not null
      group by year, month
      order by year desc, month desc
    `,
  ]);

  // Group larps by day in Helsinki timezone; multi-day larps appear on every day [startDate, endDate]
  const larpsOnDay = new Map<string, LarpRow[]>();
  for (const larp of larps) {
    if (!larp.startsAt) continue;
    const startDate = Temporal.Instant.fromEpochMilliseconds(
      larp.startsAt.getTime(),
    )
      .toZonedDateTimeISO(timezone)
      .toPlainDate();
    const endDate = larp.endsAt
      ? Temporal.Instant.fromEpochMilliseconds(larp.endsAt.getTime())
          .toZonedDateTimeISO(timezone)
          .toPlainDate()
      : startDate;
    for (
      let date = startDate;
      Temporal.PlainDate.compare(date, endDate) <= 0;
      date = date.add({ days: 1 })
    ) {
      const key = date.toString();
      const bucket = larpsOnDay.get(key) ?? [];
      bucket.push(larp);
      larpsOnDay.set(key, bucket);
    }
  }

  // Build one entry per week row
  const weeks = [];
  for (
    let day = gridStart;
    Temporal.PlainDate.compare(day, gridEnd) <= 0;
    day = day.add({ days: 7 })
  ) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = day.add({ days: i });
      return {
        date,
        isCurrentMonth:
          date.year === currentMonth.year && date.month === currentMonth.month,
        larps: larpsOnDay.get(date.toString()) ?? [],
      };
    });
    weeks.push({ weekNumber: day.weekOfYear!, days });
  }

  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    REFERENCE_MONDAY.add({ days: i }).toLocaleString(
      toSupportedLanguage(locale),
      {
        weekday: "short",
      },
    ),
  );

  return (
    <Container fluid>
      <MainHeading>{formatMonthTitle(currentMonth, locale)}</MainHeading>

      <div className="d-flex align-items-center justify-content-between mb-4 gap-3 flex-wrap">
        <Link
          href={`/calendar?month=${toMonthParam(prevMonth)}`}
          className="btn btn-outline-secondary bg-white"
        >
          ← {t.navigation.previousMonth}
        </Link>

        <AutoSubmitForm action="/calendar" method="get" className="flex-grow-1">
          <MonthSelect
            options={monthRows.map(({ year, month }) => ({
              value: `${year}-${String(month).padStart(2, "0")}`,
              label: formatMonthOption(year, month, locale),
            }))}
            defaultValue={toMonthParam(currentMonth)}
          />
          <noscript>
            <button type="submit" className="btn btn-outline-secondary bg-white">
              {t.navigation.go}
            </button>
          </noscript>
        </AutoSubmitForm>

        <Link
          href={`/calendar?month=${toMonthParam(nextMonth)}`}
          className="btn btn-outline-secondary bg-white"
        >
          {t.navigation.nextMonth} →
        </Link>
      </div>

      <div className="table-responsive">
        <Table bordered className="mb-4" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th
                className="text-center text-muted fw-normal"
                style={{ width: "3rem" }}
              >
                {t.weekNumber}
              </th>
              {weekdayNames.map((name) => (
                <th
                  key={name}
                  className="text-center fw-semibold"
                  style={{ width: "calc((100% - 3rem) / 7)" }}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map(({ weekNumber, days }) => (
              <tr key={weekNumber} style={{ height: "6rem" }}>
                <td className="text-center text-muted align-top small">
                  {weekNumber}
                </td>
                {days.map(({ date, isCurrentMonth, larps: dayLarps }) => (
                  <td
                    key={date.toString()}
                    className={`align-top${!isCurrentMonth ? " bg-light" : ""}`}
                  >
                    <div
                      className={`small fw-semibold mb-1${!isCurrentMonth ? " text-muted" : ""}`}
                    >
                      {date.day}
                    </div>
                    {dayLarps.map((larp) => (
                      <div key={larp.id} className="small">
                        <MaybeExternalLink
                          href={getLarpHref(larp)}
                          className={`link-xxsubtle d-block text-truncate${!isCurrentMonth ? " text-muted" : ""}`}
                        >
                          {larp.name}
                        </MaybeExternalLink>
                      </div>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </Container>
  );
}
