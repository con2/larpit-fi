import { CopyButton } from "@con2/components";
import { toISODate } from "@con2/components/helpers";
import { Temporal } from "@js-temporal/polyfill";
import { and, or } from "@prisma/orm-postgres/orm-client";
import Link from "next/link";

import { PaletteContext } from "@/components/ui/CommandPalette";
import { CalendarIcon } from "@/components/ui/icons";
import FilterBar, {
  FilterGroup,
  type FilterOption,
} from "@/components/ui/FilterBar";
import { getSignupPillState } from "@/components/ui/signupPillState";
import { publicUrl, timezone } from "@/config";
import { parseDates } from "@/prisma/dates";
import { dbRead } from "@/prisma/db";
import { queryRead, sql } from "@/prisma/sql";
import { getTranslations } from "@/translations";

import Agenda from "./Agenda";
import { CalendarLarp } from "./CalendarBar";
import CalendarKeyboardNav from "./CalendarKeyboardNav";
import styles from "./calendar.module.scss";
import {
  CalendarFilters,
  CalendarSearchParams,
  calendarHref,
  filterLanguages,
  matchesFilters,
  parseFilters,
  toggleLanguage,
  typeGroups,
} from "./calendarFilters";
import { weekMondays } from "./calendarLayout";
import MonthGrid, { weekId } from "./MonthGrid";
import MonthSelect from "./MonthSelect";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CalendarSearchParams>;
}

interface MonthRow {
  year: number;
  month: number;
}

function parseMonth(
  monthParam: string | string[] | undefined,
  now: Temporal.PlainDate,
): Temporal.PlainYearMonth {
  if (typeof monthParam === "string" && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [year, month] = monthParam.split("-").map(Number);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      return Temporal.PlainYearMonth.from({ year, month });
    }
  }
  return Temporal.PlainYearMonth.from({ year: now.year, month: now.month });
}

function toMonthParam(ym: { year: number; month: number }): string {
  return `${ym.year}-${String(ym.month).padStart(2, "0")}`;
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={direction === "left" ? "M10 3 L5 8 L10 13" : "M6 3 L11 8 L6 13"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function CalendarPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const search = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.CalendarPage;
  const pillMessages = translations.CommandPalette.pill;

  const filters = parseFilters(search);
  const now = Temporal.Now.plainDateISO(timezone);
  const currentMonth = parseMonth(search.month, now);
  const prevMonth = currentMonth.subtract({ months: 1 });
  const nextMonth = currentMonth.add({ months: 1 });
  const thisMonth = Temporal.PlainYearMonth.from({
    year: now.year,
    month: now.month,
  });
  const expandedWeek = typeof search.expand === "string" ? search.expand : null;

  const monthFirstDay = currentMonth.toPlainDate({ day: 1 });
  const monthLastDay = currentMonth.toPlainDate({
    day: currentMonth.daysInMonth,
  });
  const mondays = weekMondays(monthFirstDay, monthLastDay);
  const gridStart = mondays[0];
  const gridEnd = mondays[mondays.length - 1].add({ days: 6 });

  const [larpRows, monthRows, holidays] = await Promise.all([
    dbRead.orm.public.Larp.where((l) => l.startsAt.lte(toISODate(gridEnd)))
      .where((l) =>
        or(
          l.endsAt.gte(toISODate(gridStart)),
          and(l.endsAt.isNull(), l.startsAt.gte(toISODate(gridStart))),
        ),
      )
      .orderBy((l) => l.startsAt.asc())
      .include("municipality", (m) => m.select("nameFi"))
      .all(),
    queryRead<MonthRow>(sql`
      select
        extract(year from starts_at)::int as year,
        extract(month from starts_at)::int as month
      from larp
      where starts_at is not null
      group by year, month
      order by year desc, month desc
    `),
    dbRead.orm.public.Holiday.where((h) => h.date.gte(toISODate(gridStart)))
      .where((h) => h.date.lte(toISODate(gridEnd)))
      .all(),
  ]);

  const larps: CalendarLarp[] = parseDates(larpRows).flatMap((larp) =>
    larp.startsAt &&
    matchesFilters(larp, getSignupPillState(larp)?.kind === "open", filters)
      ? [{ ...larp, startsAt: larp.startsAt }]
      : [],
  );

  const holidayTitles = new Map(
    holidays.map((h) => [h.date, locale === "fi" ? h.titleFi : h.titleEn]),
  );

  const monthParam = toMonthParam(currentMonth);
  const monthOptions = monthRows.some((row) => toMonthParam(row) === monthParam)
    ? monthRows
    : [...monthRows, currentMonth].sort(
        (a, b) => b.year - a.year || b.month - a.month,
      );

  const prevHref = calendarHref(toMonthParam(prevMonth), filters);
  const nextHref = calendarHref(toMonthParam(nextMonth), filters);
  const todayHref = calendarHref(toMonthParam(thisMonth), filters);

  const icalUrl = `${publicUrl}/api/calendar?locale=${locale}`;
  const webcalUrl = icalUrl.replace(/^https?:/, "webcal:");

  const option = (
    title: string,
    target: CalendarFilters,
    current: boolean,
    fullTitle?: string,
  ): FilterOption => ({
    title,
    fullTitle,
    href: calendarHref(monthParam, target),
    current,
  });

  return (
    <div className={`lf-container ${styles.page}`}>
      <CalendarKeyboardNav
        prevHref={prevHref}
        nextHref={nextHref}
        todayHref={todayHref}
      />
      <PaletteContext
        title={t.title}
        commands={[
          {
            id: "subscribe",
            label: translations.CommandPalette.commands.subscribe,
            icon: "calendar",
            href: "#subscribe",
          },
          {
            id: "jumpToToday",
            label: translations.CommandPalette.commands.jumpToToday,
            icon: "today",
            href: todayHref,
            shortcut: "T",
          },
        ]}
      />

      <header className={styles.header}>
        <div className={styles.heading}>
          <p className="lf-eyebrow">{t.title}</p>
          <div className={styles.titleRow}>
            <Link
              href={prevHref}
              className={styles.arrow}
              aria-label={t.navigation.previousMonth}
              title={t.navigation.previousMonth}
            >
              <ChevronIcon direction="left" />
            </Link>
            <h1 className={`lf-display-l ${styles.title}`}>
              {t.monthNames[currentMonth.month - 1]}{" "}
              <span className={styles.year}>{currentMonth.year}</span>
            </h1>
            <Link
              href={nextHref}
              className={styles.arrow}
              aria-label={t.navigation.nextMonth}
              title={t.navigation.nextMonth}
            >
              <ChevronIcon direction="right" />
            </Link>
            <Link
              href={todayHref}
              className={`lf-link-quiet ${styles.todayLink}`}
              aria-current={currentMonth.equals(thisMonth) ? "date" : undefined}
            >
              {t.jumpToToday}
            </Link>
          </div>
        </div>

        <div className={styles.tools}>
          <form action="/calendar" method="get" className={styles.monthForm}>
            <label htmlFor="CalendarPage-month" className="lf-label">
              {t.navigation.goToMonth}
            </label>
            {filters.type && (
              <input type="hidden" name="type" value={filters.type} />
            )}
            {filters.signupOpen && (
              <input type="hidden" name="open" value="1" />
            )}
            {filters.languages.length > 0 && (
              <input
                type="hidden"
                name="lang"
                value={filters.languages.join(",")}
              />
            )}
            <MonthSelect
              id="CalendarPage-month"
              key={monthParam}
              className={styles.monthSelect}
              options={monthOptions.map(({ year, month }) => ({
                value: toMonthParam({ year, month }),
                label: `${year}/${String(month).padStart(2, "0")} ${t.monthNames[month - 1]}`,
              }))}
              defaultValue={monthParam}
            />
            <noscript>
              <button type="submit" className="btn btn-outline-secondary">
                {t.navigation.go}
              </button>
            </noscript>
          </form>
        </div>
      </header>

      <FilterBar label={t.filters.label}>
        <FilterGroup
          label={t.filters.type}
          scroll={false}
          options={[
            option(t.filters.all, { ...filters, type: null }, !filters.type),
            ...typeGroups.map((group) =>
              option(
                t.filters[group],
                { ...filters, type: group },
                filters.type === group,
              ),
            ),
          ]}
        />
        <FilterGroup
          label={t.filters.signup}
          scroll={false}
          options={[
            option(
              t.filters.signupOpen,
              { ...filters, signupOpen: !filters.signupOpen },
              filters.signupOpen,
            ),
          ]}
        />
        <FilterGroup
          label={t.filters.language}
          scroll={false}
          options={[
            option(
              t.filters.all,
              { ...filters, languages: [] },
              filters.languages.length === 0,
            ),
            ...filterLanguages.map((language) =>
              option(
                language.toUpperCase(),
                toggleLanguage(filters, language),
                filters.languages.includes(language),
                t.filters.languages[language],
              ),
            ),
          ]}
        />
      </FilterBar>

      <div className={styles.gridScroll}>
        <MonthGrid
          larps={larps}
          mondays={mondays}
          month={currentMonth}
          today={now}
          holidayTitles={holidayTitles}
          expandedWeek={expandedWeek}
          weekHref={(monday, expanded) =>
            calendarHref(
              monthParam,
              filters,
              expanded ? { expand: weekId(monday) } : {},
              weekId(monday),
            )
          }
          locale={locale}
          messages={t}
          pillMessages={pillMessages}
        />
      </div>

      <Agenda
        larps={larps}
        month={currentMonth}
        today={now}
        holidayTitles={holidayTitles}
        subscribeHref="#subscribe"
        locale={locale}
        messages={t}
        pillMessages={pillMessages}
      />

      <div className={styles.legendRow}>
        <ul className={styles.legend} aria-label={t.legend.title}>
          <li>
            <span className={`${styles.swatch} ${styles.swatchOpen}`} />
            {t.legend.signupOpen}
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchSoon}`} />
            {t.legend.openingSoon}
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchOver}`} />
            {t.legend.signupOver}
          </li>
          <li>
            <span
              className={`${styles.dot} ${styles.dotHollow} ${styles.swatchInviteOnly}`}
            />
            {t.legend.inviteOnly}
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchEvent}`} />
            {t.legend.event}
          </li>
          <li>
            <span className={`${styles.swatch} ${styles.swatchCancelled}`} />
            {t.legend.cancelled}
          </li>
        </ul>
        <p className={styles.keyboardHint}>{t.keyboardNavigation}</p>
      </div>

      <section
        id="subscribe"
        aria-labelledby="CalendarPage-subscribe"
        className={`lf-surface ${styles.subscribe}`}
      >
        <h2
          id="CalendarPage-subscribe"
          className={`h6 m-0 ${styles.subscribeTitle}`}
        >
          {t.subscribe.title}
        </h2>
        <code className={styles.icsUrl} aria-label={t.subscribe.urlLabel}>
          {icalUrl}
        </code>
        <CopyButton
          data={icalUrl}
          className="btn btn-outline-secondary"
          messages={{ title: t.subscribe.copy, success: t.subscribe.copied }}
        />
        <a href={webcalUrl} className={`btn btn-primary ${styles.buttonIcon}`}>
          <CalendarIcon size={14} />
          {t.subscribe.button}
        </a>
        <span className={styles.subscribeHelp}>{t.subscribe.help}</span>
      </section>
    </div>
  );
}
