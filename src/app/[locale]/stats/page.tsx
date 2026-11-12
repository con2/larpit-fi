import { toPlainDate } from "@con2/components/helpers";
import Link from "next/link";
import { ReactNode } from "react";

import { Language, LarpType, Openness } from "@/prisma/enums";
import { sql } from "@/prisma/sql";
import { getTranslations } from "@/translations";
import {
  ChartTable,
  ColumnChart,
  niceMax,
  ProportionBar,
  type ColumnBar,
  type ProportionItem,
  type Tone,
} from "./charts";
import AuroraHero from "@/components/ui/AuroraHero";
import FilterBar, {
  FilterGroup,
  type FilterOption,
} from "@/components/ui/FilterBar";
import styles from "./page.module.scss";
import { getReader } from "@/prisma/reader";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ since?: string }>;
}

type SinceFilter = "ALL_TIME" | "LAST_10_YEARS" | "POST_COVID" | "LAUNCH";
const sinceFilters: SinceFilter[] = [
  "ALL_TIME",
  "LAST_10_YEARS",
  "POST_COVID",
  "LAUNCH",
];

const topMunicipalityCount = 10;

const typeTones: Record<LarpType, Tone> = {
  ONE_SHOT: "text",
  CAMPAIGN_LARP: "ice",
  CAMPAIGN: "dim",
  MULTIPLE_RUNS: "ember",
  OTHER_EVENT: "border",
  OTHER_EVENT_SERIES: "aurora",
};

const languageTones: Record<Language, Tone> = {
  fi: "text",
  en: "ice",
  sv: "aurora",
  OTHER: "border",
};

const opennessTones: Record<Openness, Tone> = {
  OPEN: "aurora",
  TARGETED: "ice",
  INVITE_ONLY: "dim",
};

/**
 * The statistics count these types as larps unless they say otherwise. They are also the default
 * types of the larp list, whose counts the page should agree with.
 */
const larpTypes: LarpType[] = [LarpType.ONE_SHOT, LarpType.CAMPAIGN_LARP];

/** First year included, or null for all time. */
function getSinceYear(since: SinceFilter, currentYear: number): number | null {
  switch (since) {
    case "LAST_10_YEARS":
      return currentYear - 10;
    case "POST_COVID":
      return 2022;
    case "LAUNCH":
      return 2026;
    case "ALL_TIME":
      return null;
  }
}

/**
 * A fixed period is left out in the year it starts on the same year as the last 10 years, and
 * returns after that.
 */
function getAvailableSinceFilters(currentYear: number): SinceFilter[] {
  const lastTenYearsStart = currentYear - 10;
  return sinceFilters
    .filter(
      (since) =>
        since === "LAST_10_YEARS" ||
        getSinceYear(since, currentYear) !== lastTenYearsStart,
    )
    .sort(
      (a, b) =>
        (getSinceYear(a, currentYear) ?? 0) -
        (getSinceYear(b, currentYear) ?? 0),
    );
}

// Postgres bigint aggregates arrive from pg as decimal strings.
interface MuniRow {
  municipalityId: string;
  municipalityName: string;
  count: string;
}

interface YearRow {
  year: string;
  count: string;
}

interface TypeRow {
  type: LarpType;
  count: string;
}

interface LanguageRow {
  language: Language;
  count: string;
}

interface OpennessRow {
  openness: Openness | null;
  count: string;
}

interface MonthRow {
  month: string;
  count: string;
}

interface WeekRow {
  week: string;
  count: string;
}

interface PlayersRow {
  year: string;
  numPlayerCharacters: string;
  numTotalParticipants: string;
}

interface TotalsRow {
  thisYear: string;
  upcoming: string;
}

// percentile_cont returns double precision, which pg parses into numbers.
interface ShapeRow {
  larps: string;
  oneDay: string;
  weekend: string;
  medianPlayerCharacters: number | null;
  playerCharactersKnown: string;
  maxPlayerCharacters: number | null;
  medianTotalParticipants: number | null;
  totalParticipantsKnown: string;
  maxTotalParticipants: number | null;
  medianSignupWindow: number | null;
  signupWindowKnown: string;
  medianLeadTime: number | null;
  leadTimeKnown: string;
}

function sumOf<T>(rows: T[], get: (row: T) => string): number {
  return rows.reduce((sum, row) => sum + Number(get(row)), 0);
}

function maxOf<T>(rows: T[], get: (row: T) => string): number {
  return rows.reduce((max, row) => Math.max(max, Number(get(row))), 0);
}

const dayMs = 86_400_000;

/**
 * The month (1–12) in which the Saturday of each ISO week (index 1–53) most often falls. Larps
 * most commonly fall on Saturdays. The weekdays of the Gregorian calendar repeat every 28 years
 * between 1901 and 2099, so 2001–2028 covers every way the weeks can fall.
 */
const isoWeekMonths: number[] = (() => {
  const counts = Array.from({ length: 54 }, () =>
    new Array<number>(13).fill(0),
  );
  for (let year = 2001; year <= 2028; year++) {
    const jan4 = Date.UTC(year, 0, 4);
    const mondayOfWeek1 =
      jan4 - ((new Date(jan4).getUTCDay() || 7) - 1) * dayMs;
    for (let week = 1; week <= 53; week++) {
      const monday = mondayOfWeek1 + (week - 1) * 7 * dayMs;
      const thursday = new Date(monday + 3 * dayMs);
      if (thursday.getUTCFullYear() !== year) continue;
      const saturday = new Date(monday + 5 * dayMs);
      counts[week][saturday.getUTCMonth() + 1]++;
    }
  }
  return counts.map((months) =>
    months.reduce(
      (best, count, month) => (count > months[best] ? month : best),
      0,
    ),
  );
})();

function Section({
  title,
  children,
  description,
  wide,
}: {
  title: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  wide?: boolean;
}) {
  return (
    <section className={wide ? styles.sectionWide : styles.section}>
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      {children}
      {description && (
        <div
          className={`${styles.description}${wide ? ` ${styles.descriptionWide}` : ""}`}
        >
          {description}
        </div>
      )}
    </section>
  );
}

export default async function StatsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.StatsPage;
  const larpT = translations.Larp;
  const { query: readQuery } = await getReader();

  const today = toPlainDate(new Date()).toString();
  const currentYear = Number(today.slice(0, 4));
  const availableSinceFilters = getAvailableSinceFilters(currentYear);
  const { since: sinceParam } = await searchParams;
  const since: SinceFilter = !sinceFilters.includes(sinceParam as SinceFilter)
    ? "ALL_TIME"
    : availableSinceFilters.includes(sinceParam as SinceFilter)
      ? (sinceParam as SinceFilter)
      : "LAST_10_YEARS";
  const sinceYear = getSinceYear(since, currentYear);
  const cutoff = `${sinceYear ?? 1960}-01-01`;

  const numberFormat = new Intl.NumberFormat(locale);
  const formatCount = (value: number) => numberFormat.format(value);
  const percentFormat = new Intl.NumberFormat(locale, { style: "percent" });
  const formatShare = (share: number) => percentFormat.format(share);
  const monthName = (month: number, style: "long" | "short") =>
    new Intl.DateTimeFormat(locale, { month: style }).format(
      new Date(2000, month - 1, 1),
    );

  const [
    muniRows,
    yearRows,
    monthRows,
    weekRows,
    typeRows,
    languageRows,
    opennessRows,
    playersRows,
    [totals],
    [shape],
  ] = await Promise.all([
    readQuery<MuniRow>(sql`
      select
        m.id as "municipalityId",
        m.name_fi as "municipalityName",
        count(l.id) as count
      from
        municipality m
        join larp l on l.municipality_id = m.id
      where
        l.starts_at >= ${cutoff}::date
        and l.type::text = any(${larpTypes}::text[])
        and l.cancelled_at is null
      group by m.id, m.name_fi
      having count(l.id) > 0
      order by count desc, m.name_fi asc
    `),
    readQuery<YearRow>(sql`
      with year_range as (
        select generate_series(
          (select extract(year from min(starts_at))::int from larp where starts_at >= ${cutoff}::date and type::text = any(${larpTypes}::text[]) and cancelled_at is null),
          least(extract(year from current_date)::int + 10, (select extract(year from max(starts_at))::int from larp where starts_at >= ${cutoff}::date and type::text = any(${larpTypes}::text[]) and cancelled_at is null))
        ) as year
      )
      select
        yr.year::bigint as year,
        coalesce(count(l.id), 0) as count
      from
        year_range yr
        left join larp l on
          extract(year from l.starts_at) = yr.year
          and l.type::text = any(${larpTypes}::text[])
          and l.cancelled_at is null
      group by yr.year
      order by yr.year asc
    `),
    readQuery<MonthRow>(sql`
      with month_range as (
        select generate_series(1, 12) as month
      )
      select
        mr.month::bigint as month,
        coalesce(count(l.id), 0) as count
      from
        month_range mr
        left join larp l on
          extract(month from l.starts_at) = mr.month
          and l.starts_at >= ${cutoff}::date
          and l.type::text = any(${larpTypes}::text[])
          and l.cancelled_at is null
      group by mr.month
      order by mr.month asc
    `),
    readQuery<WeekRow>(sql`
      with week_range as (
        select generate_series(1, 53) as week
      )
      select
        wr.week::bigint as week,
        coalesce(count(l.id), 0) as count
      from
        week_range wr
        left join larp l on
          extract(week from l.starts_at) = wr.week
          and l.starts_at >= ${cutoff}::date
          and l.type::text = any(${larpTypes}::text[])
          and l.cancelled_at is null
      group by wr.week
      order by wr.week asc
    `),
    readQuery<TypeRow>(sql`
      select
        l.type as type,
        count(l.id) as count
      from
        larp l
      where
        (l.starts_at >= ${cutoff}::date or ${since === "ALL_TIME"}::boolean and l.starts_at is null)
        and l.cancelled_at is null
      group by l.type
      having count(l.id) > 0
      order by count desc, l.type asc
    `),
    readQuery<LanguageRow>(sql`
      select
        l.language as language,
        count(l.id) as count
      from
        larp l
      where
        l.type::text = any(${larpTypes}::text[])
        and l.cancelled_at is null
        and l.starts_at >= ${cutoff}::date
      group by l.language
      having count(l.id) > 0
      order by count desc, l.language asc
    `),
    readQuery<OpennessRow>(sql`
      select
        l.openness as openness,
        count(l.id) as count
      from
        larp l
      where
        l.type::text = any(${larpTypes}::text[])
        and l.cancelled_at is null
        and l.starts_at >= ${cutoff}::date
      group by l.openness
      order by l.openness asc nulls last
    `),
    // some larps have 0 for numTotalParticipants denoting unknown total participants
    // some larps have null for numTotalParticipants denoting unknown total participants
    // either way, default them to numPlayerCharacters for normalization
    readQuery<PlayersRow>(sql`
      with year_range as (
        select generate_series(
          (select extract(year from min(starts_at))::int from larp where starts_at >= ${cutoff}::date and type::text = any(${larpTypes}::text[]) and cancelled_at is null),
          least(extract(year from current_date)::int + 10, (select extract(year from max(starts_at))::int from larp where starts_at >= ${cutoff}::date and type::text = any(${larpTypes}::text[]) and cancelled_at is null))
        ) as year
      ),
      normalized_data_points as (
        select
          extract(year from starts_at) as year,
          num_player_characters,
          case
            when num_total_participants = 0 then num_player_characters
            when num_total_participants is null then num_player_characters
            else num_total_participants
          end as num_total_participants
        from larp
        where
          starts_at >= ${cutoff}::date
          and type::text = any(${larpTypes}::text[])
          and cancelled_at is null
      )
      select
        yr.year::varchar as year,
        coalesce(sum(ndp.num_player_characters), 0) as "numPlayerCharacters",
        coalesce(sum(ndp.num_total_participants), 0) as "numTotalParticipants"
      from
        year_range yr
        left join normalized_data_points ndp on yr.year = ndp.year
      group by yr.year
      order by yr.year asc
    `),
    readQuery<TotalsRow>(sql`
      select
        count(*) filter (
          where extract(year from starts_at) = ${currentYear}
        ) as "thisYear",
        count(*) filter (
          where coalesce(ends_at, starts_at) >= ${today}::date
        ) as upcoming
      from larp
      where
        type::text = any(${larpTypes}::text[])
        and cancelled_at is null
    `),
    readQuery<ShapeRow>(sql`
      select
        count(*) as larps,
        count(*) filter (where ends_at is null or ends_at = starts_at) as "oneDay",
        count(*) filter (
          where extract(isodow from starts_at) = 5 and ends_at = starts_at + 2
        ) as weekend,
        percentile_cont(0.5) within group (order by num_player_characters)
          filter (where num_player_characters > 0) as "medianPlayerCharacters",
        count(*) filter (where num_player_characters > 0) as "playerCharactersKnown",
        max(num_player_characters) as "maxPlayerCharacters",
        percentile_cont(0.5) within group (order by num_total_participants)
          filter (where num_total_participants > 0) as "medianTotalParticipants",
        count(*) filter (where num_total_participants > 0) as "totalParticipantsKnown",
        max(num_total_participants) as "maxTotalParticipants",
        percentile_cont(0.5) within group (order by signup_ends_at - signup_starts_at)
          filter (where signup_ends_at >= signup_starts_at) as "medianSignupWindow",
        count(*) filter (where signup_ends_at >= signup_starts_at) as "signupWindowKnown",
        percentile_cont(0.5) within group (order by starts_at - signup_starts_at)
          filter (where starts_at >= signup_starts_at) as "medianLeadTime",
        count(*) filter (where starts_at >= signup_starts_at) as "leadTimeKnown"
      from larp
      where
        type::text = any(${larpTypes}::text[])
        and cancelled_at is null
        and starts_at >= ${cutoff}::date
    `),
  ]);

  const sinceOptions: FilterOption[] = availableSinceFilters.map((value) => {
    const year = getSinceYear(value, currentYear);
    return {
      title:
        value === "LAST_10_YEARS" ? `${year}–` : t.filters.since.short[value],
      fullTitle:
        value === "LAST_10_YEARS"
          ? t.filters.since.lastTenYears(currentYear - 10)
          : t.filters.since.choices[value],
      href: value === "ALL_TIME" ? "/stats" : `/stats?since=${value}`,
      current: value === since,
    };
  });

  const typeTotal = sumOf(typeRows, (row) => row.count);
  const yearTotal = sumOf(yearRows, (row) => row.count);
  const recordedYears = yearRows
    .filter((row) => Number(row.count) > 0 && Number(row.year) <= currentYear)
    .map((row) => Number(row.year));
  const firstYear = recordedYears.length ? Math.min(...recordedYears) : null;
  const lastYear = recordedYears.length ? Math.max(...recordedYears) : null;

  const yearMax = maxOf(yearRows, (row) => row.count);
  const peakYear = yearRows.find((row) => Number(row.count) === yearMax);
  const yearChartMax = niceMax(yearMax);
  const yearFirst = Number(yearRows[0]?.year);
  const yearLast = Number(yearRows[yearRows.length - 1]?.year);
  const isAxisYear = (year: number) =>
    year === yearFirst ||
    year === yearLast ||
    year === currentYear ||
    (year % 5 === 0 &&
      year - yearFirst >= 3 &&
      yearLast - year >= 3 &&
      Math.abs(currentYear - year) >= 3);
  const yearBars: ColumnBar[] = yearRows.map((row) => {
    const year = Number(row.year);
    const count = Number(row.count);
    return {
      key: row.year,
      segments: [
        {
          value: count,
          tone:
            year === currentYear
              ? "aurora"
              : year > currentYear
                ? "iceHalf"
                : "border",
        },
      ],
      title: `${row.year}: ${t.larpCount(formatCount(count))}`,
      href: `/larp#year-${year}`,
      axisLabel: isAxisYear(year) ? row.year : undefined,
      highlightLabel: year === currentYear,
    };
  });

  const monthMax = maxOf(monthRows, (row) => row.count);
  const monthMin = monthRows.reduce(
    (min, row) => Math.min(min, Number(row.count)),
    Infinity,
  );
  const busiestMonth = monthRows.find((row) => Number(row.count) === monthMax);
  const quietestMonth = monthRows.find((row) => Number(row.count) === monthMin);
  const monthBars: ColumnBar[] = monthRows.map((row) => {
    const month = Number(row.month);
    const count = Number(row.count);
    const isBusiest = row === busiestMonth;
    return {
      key: row.month,
      segments: [{ value: count, tone: isBusiest ? "aurora" : "border" }],
      title: `${monthName(month, "long")}: ${t.larpCount(formatCount(count))}`,
      axisLabel: monthName(month, "short"),
      highlightLabel: isBusiest,
    };
  });

  const weekMax = maxOf(weekRows, (row) => row.count);
  const busiestWeek = weekRows.find((row) => Number(row.count) === weekMax);
  // Week 53 exists only in some years, so it would nearly always be the quietest.
  const quietestWeek = weekRows
    .filter((row) => Number(row.week) <= 52)
    .reduce<WeekRow | undefined>(
      (min, row) =>
        min === undefined || Number(row.count) < Number(min.count) ? row : min,
      undefined,
    );
  const weekBars: ColumnBar[] = weekRows.map((row) => {
    const week = Number(row.week);
    const count = Number(row.count);
    const month = isoWeekMonths[week];
    // The Saturday of week 53 falls in January, but the week still ends the year.
    const startsMonth = month > isoWeekMonths[week - 1];
    return {
      key: row.week,
      segments: [{ value: count, tone: "ice" }],
      title: `${t.attributes.week.title} ${week}: ${t.larpCount(formatCount(count))}`,
      axisLabel: week === 1 || week % 10 === 0 ? row.week : undefined,
      groupLabel: startsMonth ? monthName(month, "short") : undefined,
    };
  });

  const playersMax = maxOf(playersRows, (row) => row.numTotalParticipants);
  const playersBars: ColumnBar[] = playersRows.map((row) => {
    const year = Number(row.year);
    const characters = Number(row.numPlayerCharacters);
    const total = Number(row.numTotalParticipants);
    return {
      key: row.year,
      segments: [
        { value: characters, tone: "ice" },
        { value: total - characters, tone: "dim" },
      ],
      title: `${row.year}: ${larpT.attributes.numPlayerCharacters.title} ${formatCount(characters)}, ${larpT.attributes.numTotalParticipants.title} ${formatCount(total)}`,
      axisLabel: isAxisYear(year) ? row.year : undefined,
    };
  });
  const playerCharactersTotal = sumOf(
    playersRows,
    (row) => row.numPlayerCharacters,
  );
  const totalParticipantsTotal = sumOf(
    playersRows,
    (row) => row.numTotalParticipants,
  );

  const muniMax = maxOf(muniRows, (row) => row.count);
  const renderMunicipality = (row: MuniRow, index: number) => (
    <li key={row.municipalityId} className={styles.muniRow}>
      <span className={styles.muniName}>{row.municipalityName}</span>
      <span className={styles.muniTrack} aria-hidden="true">
        <span
          className={index === 0 ? styles.toneAurora : styles.toneIce}
          style={{ width: `${(Number(row.count) / muniMax) * 100}%` }}
        />
      </span>
      <span className={styles.muniCount}>{formatCount(Number(row.count))}</span>
    </li>
  );

  const typeItems: ProportionItem[] = typeRows.map((row) => ({
    key: row.type,
    label: (
      <Link href={`/larp?type=${row.type}`}>
        {larpT.attributes.type.choices[row.type]?.title ?? row.type}
      </Link>
    ),
    count: Number(row.count),
    tone: typeTones[row.type] ?? "border",
  }));
  const languageItems: ProportionItem[] = languageRows.map((row) => ({
    key: row.language,
    label: (
      <Link href={`/larp?language=${row.language}`}>
        {larpT.attributes.language.choices[row.language] ?? row.language}
      </Link>
    ),
    count: Number(row.count),
    tone: languageTones[row.language] ?? "border",
  }));
  const opennessItems: ProportionItem[] = opennessRows.map((row) => ({
    key: row.openness ?? "null",
    label: row.openness
      ? larpT.attributes.openness.choices[row.openness].title
      : t.openness.notRecorded,
    count: Number(row.count),
    tone: row.openness ? opennessTones[row.openness] : "raised",
  }));
  const opennessTotal = sumOf(opennessRows, (row) => row.count);
  const opennessUnrecorded = Number(
    opennessRows.find((row) => row.openness === null)?.count ?? 0,
  );

  const shapeLarps = Number(shape?.larps ?? 0);
  const shapeFigures: { value: string; label: string }[] = [];
  if (shape && shapeLarps > 0) {
    shapeFigures.push(
      {
        value: formatShare(Number(shape.oneDay) / shapeLarps),
        label: t.shape.oneDay,
      },
      {
        value: formatShare(Number(shape.weekend) / shapeLarps),
        label: t.shape.weekend,
      },
    );
    if (shape.medianPlayerCharacters !== null) {
      shapeFigures.push({
        value: formatCount(shape.medianPlayerCharacters),
        label: t.shape.medianPlayerCharacters(
          formatCount(Number(shape.playerCharactersKnown)),
          formatCount(shape.maxPlayerCharacters ?? 0),
        ),
      });
    }
    if (shape.medianTotalParticipants !== null) {
      shapeFigures.push({
        value: formatCount(shape.medianTotalParticipants),
        label: t.shape.medianTotalParticipants(
          formatCount(Number(shape.totalParticipantsKnown)),
          formatCount(shape.maxTotalParticipants ?? 0),
        ),
      });
    }
    if (shape.medianSignupWindow !== null) {
      shapeFigures.push({
        value: formatCount(shape.medianSignupWindow),
        label: t.shape.medianSignupWindow(
          formatCount(Number(shape.signupWindowKnown)),
        ),
      });
    }
    if (shape.medianLeadTime !== null) {
      shapeFigures.push({
        value: formatCount(shape.medianLeadTime),
        label: t.shape.medianLeadTime(formatCount(Number(shape.leadTimeKnown))),
      });
    }
  }

  return (
    <>
      <AuroraHero>
        <header className={`lf-page-header border-0 ${styles.header}`}>
          <div className={styles.headerText}>
            <p className="lf-eyebrow">{t.eyebrow}</p>
            <h1 className="lf-display-l">{t.title}</h1>
            <div className={styles.lede}>{t.message}</div>
          </div>
          <dl className={styles.totals} aria-label={t.totals.label}>
            <div>
              <dt>{t.totals.pages}</dt>
              <dd>{formatCount(typeTotal)}</dd>
            </div>
            {firstYear !== null && lastYear !== null && (
              <div>
                <dt>{t.totals.years(firstYear, lastYear)}</dt>
                <dd>{formatCount(lastYear - firstYear + 1)}</dd>
              </div>
            )}
            <div>
              <dt>{t.totals.thisYear}</dt>
              <dd>{formatCount(Number(totals?.thisYear ?? 0))}</dd>
            </div>
            <div>
              <dt>{t.totals.upcoming}</dt>
              <dd className={styles.totalAccent}>
                {formatCount(Number(totals?.upcoming ?? 0))}
              </dd>
            </div>
          </dl>
        </header>
      </AuroraHero>

      <div className={`lf-container ${styles.body}`}>
        <FilterBar>
          <FilterGroup label={t.filters.since.title} options={sinceOptions} />
        </FilterBar>

        <Section
          wide
          title={t.reports.year.title}
          description={
            peakYear &&
            t.peakYear(peakYear.year, formatCount(Number(peakYear.count)))
          }
        >
          <ColumnChart
            bars={yearBars}
            max={yearChartMax}
            gridlines={[yearChartMax / 2, yearChartMax]}
            minWidth={Math.max(yearBars.length * 14, 320)}
            formatCount={formatCount}
          />
          <ChartTable
            caption={t.reports.year.title}
            headers={[t.attributes.year.title, t.attributes.count.title]}
            rows={[
              ...yearRows.map((row) => [
                row.year,
                formatCount(Number(row.count)),
              ]),
              [t.attributes.total.title, formatCount(yearTotal)],
            ]}
          />
        </Section>

        <div className={styles.grid}>
          <div className={styles.gridColumn}>
            <Section
              title={t.reports.month.title}
              description={
                busiestMonth &&
                quietestMonth &&
                t.monthSummary(
                  monthName(Number(busiestMonth.month), "long"),
                  formatCount(Number(busiestMonth.count)),
                  monthName(Number(quietestMonth.month), "long"),
                  formatCount(Number(quietestMonth.count)),
                )
              }
            >
              <ColumnChart bars={monthBars} max={monthMax || 1} height={120} />
              <ChartTable
                caption={t.reports.month.title}
                headers={[t.attributes.month.title, t.attributes.count.title]}
                rows={monthRows.map((row) => [
                  monthName(Number(row.month), "long"),
                  formatCount(Number(row.count)),
                ])}
              />
            </Section>

            <Section title={t.reports.municipality.title}>
              {muniRows.length > 0 && (
                <ol className={styles.muniList}>
                  {muniRows
                    .slice(0, topMunicipalityCount)
                    .map(renderMunicipality)}
                </ol>
              )}
              {muniRows.length > topMunicipalityCount && (
                <details className={styles.more}>
                  <summary>
                    {t.allMunicipalities(formatCount(muniRows.length))} ↓
                  </summary>
                  <ol
                    className={styles.muniList}
                    start={topMunicipalityCount + 1}
                  >
                    {muniRows
                      .slice(topMunicipalityCount)
                      .map((row, index) =>
                        renderMunicipality(row, index + topMunicipalityCount),
                      )}
                  </ol>
                </details>
              )}
            </Section>
          </div>

          <div className={styles.gridColumn}>
            <Section title={t.reports.type.title}>
              <ProportionBar
                items={typeItems}
                formatCount={formatCount}
                formatShare={formatShare}
              />
              <div className={styles.description}>
                {t.reports.type.description}
              </div>
              <div className={styles.subsection}>
                <h3 className={styles.subTitle}>{t.reports.language.title}</h3>
                <ProportionBar
                  items={languageItems}
                  formatCount={formatCount}
                  formatShare={formatShare}
                />
              </div>
            </Section>

            <Section title={t.shape.title}>
              {shapeFigures.length > 0 && (
                <dl className={styles.figures}>
                  {shapeFigures.map((figure) => (
                    <div key={figure.label}>
                      <dt>{figure.label}</dt>
                      <dd>{figure.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className={styles.description}>{t.shape.description}</div>
              <div className={styles.subsection}>
                <h3 className={styles.subTitle}>{t.openness.title}</h3>
                <ProportionBar
                  items={opennessItems}
                  formatCount={formatCount}
                  formatShare={formatShare}
                />
                {opennessUnrecorded > 0 && (
                  <div className={styles.description}>
                    {t.openness.unrecordedShare(
                      formatShare(opennessUnrecorded / opennessTotal),
                    )}
                  </div>
                )}
              </div>
            </Section>
          </div>
        </div>

        <Section
          wide
          title={t.reports.week.title}
          description={
            <>
              {busiestWeek && quietestWeek && (
                <p>
                  {t.weekSummary(
                    busiestWeek.week,
                    t.larpCount(formatCount(Number(busiestWeek.count))),
                    quietestWeek.week,
                    t.larpCount(formatCount(Number(quietestWeek.count))),
                  )}
                </p>
              )}
              <p>{t.reports.week.description}</p>
            </>
          }
        >
          <ColumnChart
            bars={weekBars}
            max={weekMax || 1}
            height={120}
            minWidth={53 * 12}
          />
          <ChartTable
            caption={t.reports.week.title}
            headers={[
              t.attributes.week.title,
              t.attributes.month.title,
              t.attributes.count.title,
            ]}
            rows={weekRows.map((row) => [
              row.week,
              monthName(isoWeekMonths[Number(row.week)], "long"),
              formatCount(Number(row.count)),
            ])}
          />
        </Section>

        <Section
          wide
          title={t.reports.players.title}
          description={t.reports.players.description}
        >
          <ColumnChart
            bars={playersBars}
            max={niceMax(playersMax)}
            gridlines={[niceMax(playersMax) / 2, niceMax(playersMax)]}
            minWidth={Math.max(playersBars.length * 14, 320)}
            formatCount={formatCount}
          />
          <ul className={styles.legend}>
            <li>
              <span
                className={`${styles.swatch} ${styles.toneIce}`}
                aria-hidden="true"
              />
              {larpT.attributes.numPlayerCharacters.title}{" "}
              <span className={styles.legendValue}>
                {formatCount(playerCharactersTotal)}
              </span>
            </li>
            <li>
              <span
                className={`${styles.swatch} ${styles.toneDim}`}
                aria-hidden="true"
              />
              {t.otherParticipants}{" "}
              <span className={styles.legendValue}>
                {formatCount(totalParticipantsTotal - playerCharactersTotal)}
              </span>
            </li>
          </ul>
          <ChartTable
            caption={t.reports.players.title}
            headers={[
              t.attributes.year.title,
              larpT.attributes.numPlayerCharacters.title,
              larpT.attributes.numTotalParticipants.title,
            ]}
            rows={[
              ...playersRows.map((row) => [
                row.year,
                formatCount(Number(row.numPlayerCharacters)),
                formatCount(Number(row.numTotalParticipants)),
              ]),
              [
                t.attributes.total.title,
                formatCount(playerCharactersTotal),
                formatCount(totalParticipantsTotal),
              ],
            ]}
          />
        </Section>
      </div>
    </>
  );
}
