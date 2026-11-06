import { and, or } from "@prisma/orm-postgres/orm-client";
import { toPlainDate } from "@con2/components/helpers";
import {
  parseSearchParam,
  createEnumValidator,
} from "@con2/components/helpers";
import Link from "next/link";

import FilterBar, {
  FilterGroup,
  FilterMenu,
  type FilterOption,
} from "@/components/ui/FilterBar";
import LarpRow, { type LarpRowLarp } from "@/components/ui/LarpRow";
import { YearHeading } from "@/components/ui/SectionHeading";
import TypeTag from "@/components/ui/TypeTag";
import { compareDescNullsLast } from "@/helpers/sort";
import { parseDates } from "@/prisma/dates";
import { Language, LarpType } from "@/prisma/enums";
import { sql } from "@/prisma/sql";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import ExpandYearOnHash from "./ExpandYearOnHash";
import styles from "./page.module.scss";
import { getReader } from "@/prisma/reader";

type SearchParam = string | string[] | undefined;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    type?: SearchParam;
    language?: SearchParam;
    cancelled?: SearchParam;
    year?: SearchParam;
  }>;
}

type Cancelled = "hide" | "show" | "only";

const defaultTypes = [LarpType.ONE_SHOT, LarpType.CAMPAIGN_LARP];
const initialRowCount = 8;
/** The newest years are rendered with their rows until at least this many rows are on the page. */
const openRowBudget = 150;
const minOpenYearCount = 2;
const undatedKey = "unknown";

interface YearCountRow {
  year: number | null;
  past: string;
  upcoming: string;
}

/**
 * A year of larps, except that the current year is split into its upcoming and past larps. `key`
 * is the `?year=` value that renders the group in full.
 */
interface YearGroup {
  key: string;
  /** The first group of a year carries the `year-YYYY` anchor that the timeline links to. */
  anchor: string;
  year: number | null;
  part: "upcoming" | "past" | null;
  count: number;
}

function asList(value: SearchParam): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function first(value: SearchParam): string | undefined {
  return asList(value)[0];
}

/** Larps that have not ended yet count as upcoming, as on the front page and the calendar. */
function isUpcoming(larp: LarpRowLarp, today: string) {
  const lastDay = larp.endsAt ?? larp.startsAt;
  return lastDay !== null && lastDay >= today;
}

async function getYearCounts(
  types: LarpType[],
  languages: Language[],
  cancelled: Cancelled,
  today: string,
) {
  const { query: readQuery } = await getReader();
  return readQuery<YearCountRow>(sql`
    select
      extract(year from starts_at)::int as year,
      count(*) filter (
        where starts_at is null or coalesce(ends_at, starts_at) < ${today}::date
      ) as past,
      count(*) filter (
        where coalesce(ends_at, starts_at) >= ${today}::date
      ) as upcoming
    from larp
    where
      type::text = any(${types}::text[])
      and language::text = any(${languages}::text[])
      and (
        ${cancelled}::text = 'show'
        or (cancelled_at is not null) = (${cancelled}::text = 'only')
      )
    group by 1
    order by 1 desc nulls last
  `);
}

async function getLarpsOfYears(
  groups: YearGroup[],
  types: LarpType[],
  languages: Language[],
  cancelled: Cancelled,
): Promise<LarpRowLarp[]> {
  if (groups.length === 0) return [];

  const { db: reader } = await getReader();
  let larps = reader.orm.public.Larp.where((l) => l.type.in(types))
    .where((l) => l.language.in(languages))
    .where((l) =>
      or(
        ...groups.map((group) =>
          group.year === null
            ? l.startsAt.isNull()
            : and(
                l.startsAt.gte(`${group.year}-01-01`),
                l.startsAt.lt(`${group.year + 1}-01-01`),
              ),
        ),
      ),
    )
    .select(
      "id",
      "alias",
      "name",
      "type",
      "language",
      "tagline",
      "startsAt",
      "endsAt",
      "openness",
      "signupStartsAt",
      "signupEndsAt",
      "cancelledAt",
    )
    .include("municipality", (m) => m.select("nameFi"));
  if (cancelled === "hide") {
    larps = larps.where((l) => l.cancelledAt.isNull());
  } else if (cancelled === "only") {
    larps = larps.where((l) => l.cancelledAt.isNotNull());
  }
  return parseDates(await larps.all()).sort((a, b) =>
    compareDescNullsLast(a.startsAt, b.startsAt),
  );
}

function YearTimeline({
  counts,
  currentYear,
  formatCount,
  messages: t,
}: {
  counts: Map<number, number>;
  currentYear: number;
  formatCount: (count: number) => string;
  messages: Translations["LarpListPage"];
}) {
  const years = [...counts.keys()];
  if (years.length === 0) return null;
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  const maxCount = Math.max(...counts.values());
  const slots: number[] = [];
  for (let year = firstYear; year <= lastYear; year++) slots.push(year);

  const isLabelled = (year: number) =>
    year === firstYear ||
    year === lastYear ||
    year === currentYear ||
    (year % 5 === 0 &&
      year - firstYear >= 3 &&
      lastYear - year >= 3 &&
      Math.abs(currentYear - year) >= 3);

  return (
    <div className={styles.timelineScroll}>
      <nav aria-label={t.timeline} className={styles.timeline}>
        <div className={styles.timelineBars}>
          {slots.map((year) => {
            const count = counts.get(year) ?? 0;
            const variant =
              year === currentYear
                ? styles.barCurrent
                : year > currentYear
                  ? styles.barUpcoming
                  : "";
            const style = {
              height: count
                ? `${Math.max((count / maxCount) * 100, 3)}%`
                : undefined,
            };
            if (count === 0) {
              return (
                <span
                  key={year}
                  className={`${styles.bar} ${styles.barEmpty}`}
                  aria-hidden="true"
                />
              );
            }
            return (
              <a
                key={year}
                href={`#year-${year}`}
                className={`${styles.bar} ${variant}`}
                style={style}
                aria-label={t.yearBar(year, formatCount(count))}
                title={t.yearBar(year, formatCount(count))}
                aria-current={year === currentYear ? "true" : undefined}
              />
            );
          })}
        </div>
        <div className={styles.timelineLabels} aria-hidden="true">
          {slots.map((year) => (
            <span
              key={year}
              className={year === currentYear ? styles.labelCurrent : ""}
            >
              {isLabelled(year) && <span>{year}</span>}
            </span>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default async function LarpListPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.LarpListPage;
  const larpT = translations.Larp;
  const query = await searchParams;

  const types = parseSearchParam(query.type, {
    defaults: defaultTypes,
    allValues: Object.values(LarpType),
    isValid: createEnumValidator(LarpType),
  });
  const languages = parseSearchParam(query.language, {
    defaults: Object.values(Language),
    allValues: Object.values(Language),
    isValid: createEnumValidator(Language),
  });
  const cancelledParam = first(query.cancelled);
  const cancelled: Cancelled =
    cancelledParam === "show" || cancelledParam === "only"
      ? cancelledParam
      : "hide";
  const selectedYear = first(query.year);

  const today = toPlainDate(new Date()).toString();
  const currentYear = Number(today.slice(0, 4));
  const numberFormat = new Intl.NumberFormat(locale);
  const formatCount = (count: number) => numberFormat.format(count);

  const yearCounts = await getYearCounts(types, languages, cancelled, today);

  const groups: YearGroup[] = yearCounts.flatMap((row): YearGroup[] => {
    const past = Number(row.past);
    const upcoming = Number(row.upcoming);
    if (row.year === null) {
      return [
        {
          key: undatedKey,
          anchor: undatedKey,
          year: null,
          part: null,
          count: past + upcoming,
        },
      ];
    }
    const year = String(row.year);
    if (row.year !== currentYear || upcoming === 0 || past === 0) {
      return [
        {
          key: year,
          anchor: year,
          year: row.year,
          part: null,
          count: past + upcoming,
        },
      ];
    }
    return [
      {
        key: `${year}-upcoming`,
        anchor: year,
        year: row.year,
        part: "upcoming",
        count: upcoming,
      },
      {
        key: `${year}-past`,
        anchor: `${year}-past`,
        year: row.year,
        part: "past",
        count: past,
      },
    ];
  });
  const openKeys = new Set<string>();
  let openRowCount = 0;
  for (const group of groups) {
    if (openKeys.size >= minOpenYearCount && openRowCount >= openRowBudget) {
      break;
    }
    openKeys.add(group.key);
    openRowCount += group.count;
  }
  if (selectedYear) openKeys.add(selectedYear);
  const openGroups = groups.filter((group) => openKeys.has(group.key));

  const larps = await getLarpsOfYears(openGroups, types, languages, cancelled);
  const splitKeys = new Set(
    groups.filter((group) => group.part).map((group) => group.key),
  );
  const larpsByKey = new Map<string, LarpRowLarp[]>();
  for (const larp of larps) {
    const year = larp.startsAt?.slice(0, 4) ?? undatedKey;
    const partKey = `${year}-${isUpcoming(larp, today) ? "upcoming" : "past"}`;
    const key = splitKeys.has(partKey) ? partKey : year;
    larpsByKey.set(key, [...(larpsByKey.get(key) ?? []), larp]);
  }

  const timelineCounts = new Map<number, number>();
  for (const row of yearCounts) {
    if (row.year === null) continue;
    timelineCounts.set(row.year, Number(row.past) + Number(row.upcoming));
  }

  const listHref = (
    overrides: Record<string, string | string[] | null>,
    hash = "",
  ): string => {
    const search = new URLSearchParams();
    const current: Record<string, string[]> = {
      type: asList(query.type),
      language: asList(query.language),
      cancelled: asList(query.cancelled),
      year: asList(query.year),
    };
    for (const [key, values] of Object.entries(current)) {
      const override = overrides[key];
      if (override === null) continue;
      const effective =
        override === undefined
          ? values
          : typeof override === "string"
            ? [override].filter(Boolean)
            : override;
      for (const value of effective) search.append(key, value);
    }
    const queryString = search.toString();
    return `/larp${queryString ? `?${queryString}` : ""}${hash}`;
  };

  /** The selection after clicking a value's chip: the value is added or removed. */
  const toggled = <T extends string>(selected: T[], value: T): T[] | null => {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    return next.length > 0 ? next : null;
  };

  const rawTypes = asList(query.type);
  const allTypesSelected = rawTypes.includes("ALL");
  const selectedTypes = allTypesSelected
    ? []
    : rawTypes.filter(createEnumValidator(LarpType));
  const onlyOtherEventsSelected =
    selectedTypes.length === 1 && selectedTypes[0] === LarpType.OTHER_EVENT;
  const typeChips: FilterOption[] = [
    {
      title: t.chips.type.default,
      href: listHref({ type: null, year: null }),
      current: !allTypesSelected && selectedTypes.length === 0,
    },
    {
      title: t.chips.type.other,
      href: listHref({ type: LarpType.OTHER_EVENT, year: null }),
      current: onlyOtherEventsSelected,
    },
    {
      title: t.chips.type.all,
      href: listHref({ type: "ALL", year: null }),
      current: allTypesSelected,
    },
  ];
  const singleTypeChips: FilterOption[] = Object.values(LarpType).map(
    (type) => ({
      title: larpT.attributes.type.choices[type].title,
      href: listHref({ type: toggled(selectedTypes, type), year: null }),
      current: selectedTypes.includes(type),
    }),
  );
  const typeMenuSummary =
    selectedTypes.length === 0 || onlyOtherEventsSelected
      ? t.chips.type.pick
      : selectedTypes.length === 1
        ? larpT.attributes.type.choices[selectedTypes[0]].title
        : t.chips.type.selected(selectedTypes.length);

  const selectedLanguages = asList(query.language).filter(
    createEnumValidator(Language),
  );
  const languageChips: FilterOption[] = [
    {
      title: t.chips.language.all,
      href: listHref({ language: null, year: null }),
      current: selectedLanguages.length === 0,
    },
    ...Object.values(Language).map((language) => ({
      title:
        language === Language.OTHER
          ? larpT.attributes.language.choices[language]
          : language.toUpperCase(),
      fullTitle:
        language === Language.OTHER
          ? undefined
          : larpT.attributes.language.choices[language],
      href: listHref({
        language: toggled(selectedLanguages, language),
        year: null,
      }),
      current: selectedLanguages.includes(language),
    })),
  ];
  const cancelledChips: FilterOption[] = (
    ["hide", "show", "only"] as const
  ).map((value) => ({
    title: t.chips.cancelled[value],
    href: listHref({
      cancelled: value === "hide" ? null : value,
      year: null,
    }),
    current: cancelled === value,
  }));

  const renderRows = (rows: LarpRowLarp[]) =>
    rows.map((larp) => {
      const past = !isUpcoming(larp, today);
      return (
        <LarpRow
          key={larp.id}
          larp={larp}
          locale={locale}
          messages={larpT}
          dateFormat="short"
          past={past}
          aside={
            past ? (
              <TypeTag type={larp.type} messages={larpT} small />
            ) : undefined
          }
        />
      );
    });

  return (
    <>
      <header className="lf-container lf-page-header">
        <div className={styles.headerText}>
          <p className="lf-eyebrow">{t.eyebrow}</p>
          <h1 className="lf-display-l">{larpT.listTitle}</h1>
        </div>
        <YearTimeline
          counts={timelineCounts}
          currentYear={currentYear}
          formatCount={formatCount}
          messages={t}
        />
      </header>

      <div className={`lf-container ${styles.body}`}>
        <FilterBar>
          <FilterGroup label={larpT.filters.type.title} options={typeChips}>
            <FilterMenu
              summary={typeMenuSummary}
              isCurrent={selectedTypes.length > 0 && !onlyOtherEventsSelected}
              options={singleTypeChips}
            />
          </FilterGroup>
          <FilterGroup
            label={larpT.filters.language.title}
            options={languageChips}
          />
          <FilterGroup
            label={larpT.filters.cancelled.title}
            options={cancelledChips}
          />
        </FilterBar>

        {groups.length === 0 && <p className="lf-empty">{t.empty}</p>}

        {groups.map((group) => {
          const yearLabel = group.year === null ? t.noDate : String(group.year);
          const heading = (
            <YearHeading
              year={
                group.part ? (
                  <>
                    {yearLabel}{" "}
                    <span className="lf-count">{t[group.part]}</span>
                  </>
                ) : (
                  yearLabel
                )
              }
              count={t.larpCount(formatCount(group.count))}
              id={`year-${group.anchor}`}
            />
          );

          if (!openKeys.has(group.key)) {
            return (
              <section key={group.key} className={styles.year}>
                {heading}
                <Link
                  href={listHref({ year: group.key }, `#year-${group.anchor}`)}
                  className={styles.expand}
                >
                  {group.year === null
                    ? t.showUndated(formatCount(group.count))
                    : t.showYear(formatCount(group.count), yearLabel)}{" "}
                  ↓
                </Link>
              </section>
            );
          }

          const rows = larpsByKey.get(group.key) ?? [];
          const expanded = group.key === selectedYear;
          const initialRows = expanded ? rows : rows.slice(0, initialRowCount);
          const otherRows = expanded ? [] : rows.slice(initialRowCount);
          return (
            <section key={group.key} className={styles.year}>
              {heading}
              {renderRows(initialRows)}
              {otherRows.length > 0 && (
                <details className={styles.more}>
                  <summary className={styles.expand}>
                    {t.showOthers(formatCount(otherRows.length), yearLabel)} ↓
                  </summary>
                  {renderRows(otherRows)}
                </details>
              )}
            </section>
          );
        })}
      </div>

      <ExpandYearOnHash
        collapsedHrefs={Object.fromEntries(
          groups
            .filter((group) => !openKeys.has(group.key))
            .map((group) => [
              `#year-${group.anchor}`,
              listHref({ year: group.key }, `#year-${group.anchor}`),
            ]),
        )}
      />
    </>
  );
}
