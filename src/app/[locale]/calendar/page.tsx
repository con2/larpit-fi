import { FormattedDateRange } from "@/components/FormattedDateRange";
import MainHeading from "@/components/MainHeading";
import MaybeExternalLink from "@/components/MaybeExternalLink";
import { timezone } from "@/config";
import { getLarpHref } from "@/models/Larp.client";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { Temporal } from "@js-temporal/polyfill";
import Link from "next/link";
import { Container, Table } from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}

interface MonthRow {
  year: number;
  month: number;
}

const midnight = Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 });

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
  const s = ym.toPlainDate({ day: 1 }).toLocaleString(locale, { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatMonthOption(
  year: number,
  month: number,
  locale: string,
): string {
  const date = Temporal.PlainDate.from({ year, month, day: 1 });
  const longName = date.toLocaleString(locale, { month: "long", year: "numeric" });
  const capitalized = longName.charAt(0).toUpperCase() + longName.slice(1);
  const mm = String(month).padStart(2, "0");
  return `${capitalized} (${mm}/${year})`;
}

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
  const nextMonthFirstDay = nextMonth.toPlainDate({ day: 1 });
  const startDate = new Date(
    monthFirstDay
      .toZonedDateTime({ timeZone: timezone, plainTime: midnight })
      .toInstant().epochMilliseconds,
  );
  const endDate = new Date(
    nextMonthFirstDay
      .toZonedDateTime({ timeZone: timezone, plainTime: midnight })
      .toInstant().epochMilliseconds,
  );

  const [larps, monthRows] = await Promise.all([
    prisma.larp.findMany({
      where: { startsAt: { gte: startDate, lt: endDate } },
      orderBy: { startsAt: "asc" },
      include: { municipality: { select: { nameFi: true } } },
    }),
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

  const title = formatMonthTitle(currentMonth, locale);
  const currentMonthStr = toMonthParam(currentMonth);

  return (
    <Container>
      <MainHeading>{title}</MainHeading>

      <div className="d-flex align-items-center justify-content-between mb-4 gap-3 flex-wrap">
        <Link
          href={`/calendar?month=${toMonthParam(prevMonth)}`}
          className="btn btn-outline-secondary"
        >
          ← {t.navigation.previousMonth}
        </Link>

        <form action="/calendar" method="get" className="d-flex gap-2">
          <select
            name="month"
            className="form-select"
            aria-label={t.navigation.goToMonth}
            defaultValue={currentMonthStr}
          >
            {monthRows.map(({ year, month }) => {
              const value = `${year}-${String(month).padStart(2, "0")}`;
              return (
                <option key={value} value={value}>
                  {formatMonthOption(year, month, locale)}
                </option>
              );
            })}
          </select>
          <button type="submit" className="btn btn-outline-secondary">
            {t.navigation.go}
          </button>
        </form>

        <Link
          href={`/calendar?month=${toMonthParam(nextMonth)}`}
          className="btn btn-outline-secondary"
        >
          {t.navigation.nextMonth} →
        </Link>
      </div>

      {larps.length === 0 ? (
        <p className="text-muted">{t.noLarps}</p>
      ) : (
        <div className="table-responsive">
          <Table striped hover className="border rounded mb-4">
            <thead>
              <tr>
                <th>{t.attributes.date}</th>
                <th>{t.attributes.name}</th>
                <th>{t.attributes.location}</th>
              </tr>
            </thead>
            <tbody>
              {larps.map((larp) => (
                <tr key={larp.id}>
                  <td className="align-middle text-nowrap">
                    <FormattedDateRange
                      locale={locale}
                      start={larp.startsAt}
                      end={larp.endsAt}
                    />
                  </td>
                  <td className="align-middle" style={{ position: "relative" }}>
                    <MaybeExternalLink
                      href={getLarpHref(larp)}
                      className="stretched-link link-xxsubtle"
                    >
                      {larp.name}
                    </MaybeExternalLink>
                  </td>
                  <td className="align-middle">
                    {[larp.locationText, larp.municipality?.nameFi]
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}
