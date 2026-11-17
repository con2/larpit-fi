import { and, or } from "@prisma/orm-postgres/orm-client";
import {
  createEnumValidator,
  parseSearchParam,
} from "@con2/components/helpers";
import Link from "next/link";
import type { ReactNode } from "react";

import ExpandYearOnHash from "@/components/ExpandYearOnHash";
import FilterBar, {
  FilterGroup,
  FilterMenu,
  type FilterOption,
} from "@/components/ui/FilterBar";
import LarpRow, { type LarpRowLarp } from "@/components/ui/LarpRow";
import { YearHeading } from "@/components/ui/SectionHeading";
import type { TagChip } from "@/components/ui/TagChips";
import TypeTag from "@/components/ui/TypeTag";
import { compareDescNullsLast } from "@/helpers/sort";
import { getTagsOfLarps } from "@/models/Tag";
import { parseDates } from "@/prisma/dates";
import { Language, LarpType, Openness } from "@/prisma/enums";
import { getReader } from "@/prisma/reader";
import { sql } from "@/prisma/sql";
import { getTranslations } from "@/translations";
import styles from "./LarpYearList.module.scss";

type SearchParam = string | string[] | undefined;

export interface LarpListQuery {
  type?: SearchParam;
  language?: SearchParam;
  openness?: SearchParam;
  cancelled?: SearchParam;
  year?: SearchParam;
}

type Cancelled = "hide" | "show" | "only";

export interface LarpListFilters {
  types: LarpType[];
  languages: Language[];
  /** Null lists larps of any openness, including those without one. */
  openness: Openness[] | null;
  cancelled: Cancelled;
  selectedYear: string | undefined;
}

export interface YearCountRow {
  year: number | null;
  past: string;
  upcoming: string;
}

const defaultTypes = [LarpType.ONE_SHOT, LarpType.CAMPAIGN_LARP];
const initialRowCount = 8;
/** The newest years are rendered with their rows until at least this many rows are on the page. */
const openRowBudget = 150;
const minOpenYearCount = 2;
const undatedKey = "unknown";

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

export function parseLarpListFilters(query: LarpListQuery): LarpListFilters {
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
  const openness = asList(query.openness).filter(createEnumValidator(Openness));
  const cancelledParam = first(query.cancelled);
  const cancelled: Cancelled =
    cancelledParam === "show" || cancelledParam === "only"
      ? cancelledParam
      : "hide";
  return {
    types,
    languages,
    openness: openness.length > 0 ? openness : null,
    cancelled,
    selectedYear: first(query.year),
  };
}

/** The type, language, openness and cancelled filters of the query, to carry over to another list. */
export function filterSearchParams(query: LarpListQuery): URLSearchParams {
  const search = new URLSearchParams();
  for (const key of ["type", "language", "openness", "cancelled"] as const) {
    for (const value of asList(query[key])) search.append(key, value);
  }
  return search;
}

export async function getYearCounts(
  {
    types,
    languages,
    openness,
    cancelled,
  }: Omit<LarpListFilters, "selectedYear">,
  today: string,
  tagId: string | null = null,
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
        ${openness}::text[] is null
        or openness::text = any(${openness}::text[])
      )
      and (
        ${cancelled}::text = 'show'
        or (cancelled_at is not null) = (${cancelled}::text = 'only')
      )
      and (
        ${tagId}::uuid is null
        or exists (
          select 1 from larp_tag lt
          where lt.larp_id = larp.id and lt.tag_id = ${tagId}::uuid
        )
      )
    group by 1
    order by 1 desc nulls last
  `);
}

async function getLarpsOfYears(
  groups: YearGroup[],
  { types, languages, openness, cancelled }: LarpListFilters,
  tagId: string | null,
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
  if (tagId) {
    const tagged = await reader.orm.public.LarpTag.select("larpId")
      .where({ tagId })
      .all();
    const larpIds = tagged.map((row) => row.larpId);
    if (larpIds.length === 0) return [];
    larps = larps.where((l) => l.id.in(larpIds));
  }
  if (openness) {
    larps = larps.where((l) => l.openness.in(openness));
  }
  if (cancelled === "hide") {
    larps = larps.where((l) => l.cancelledAt.isNull());
  } else if (cancelled === "only") {
    larps = larps.where((l) => l.cancelledAt.isNotNull());
  }
  return parseDates(await larps.all()).sort((a, b) =>
    compareDescNullsLast(a.startsAt, b.startsAt),
  );
}

interface Props {
  locale: string;
  query: LarpListQuery;
  /** The path of the page the list is on, which the filter and expander links lead to. */
  basePath: string;
  filters: LarpListFilters;
  yearCounts: YearCountRow[];
  today: string;
  /** Lists only larps with this tag, and highlights it on the rows. */
  tagId?: string;
  /** More filters after the built-in ones. */
  extraFilters?: ReactNode;
}

export default async function LarpYearList({
  locale,
  query,
  basePath,
  filters,
  yearCounts,
  today,
  tagId,
  extraFilters,
}: Props) {
  const translations = getTranslations(locale);
  const t = translations.LarpListPage;
  const larpT = translations.Larp;
  const { selectedYear, cancelled } = filters;
  const currentYear = Number(today.slice(0, 4));
  const numberFormat = new Intl.NumberFormat(locale);
  const formatCount = (count: number) => numberFormat.format(count);

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

  const larps = await getLarpsOfYears(openGroups, filters, tagId ?? null);
  const tagsByLarp = await getTagsOfLarps(
    await getReader(),
    larps.map((larp) => larp.id),
  );
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

  const listHref = (
    overrides: Record<string, string | string[] | null>,
    hash = "",
  ): string => {
    const search = new URLSearchParams();
    const current: Record<string, string[]> = {
      type: asList(query.type),
      language: asList(query.language),
      openness: asList(query.openness),
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
    return `${basePath}${queryString ? `?${queryString}` : ""}${hash}`;
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
  const selectedOpenness = filters.openness ?? [];
  const opennessChips: FilterOption[] = [
    {
      title: t.chips.openness.all,
      href: listHref({ openness: null, year: null }),
      current: selectedOpenness.length === 0,
    },
    ...Object.values(Openness).map((value) => ({
      title: t.chips.openness[value],
      fullTitle: larpT.attributes.openness.choices[value].title,
      href: listHref({
        openness: toggled(selectedOpenness, value),
        year: null,
      }),
      current: selectedOpenness.includes(value),
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
      const tags: TagChip[] = tagsByLarp.get(larp.id) ?? [];
      return (
        <LarpRow
          key={larp.id}
          larp={larp}
          locale={locale}
          messages={larpT}
          dateFormat="short"
          past={past}
          tags={tags}
          currentTagId={tagId}
          aside={
            past ? (
              <TypeTag type={larp.type} messages={larpT} small />
            ) : undefined
          }
        />
      );
    });

  return (
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
          label={larpT.filters.openness.title}
          options={opennessChips}
        />
        <FilterGroup
          label={larpT.filters.cancelled.title}
          options={cancelledChips}
        />
        {extraFilters}
      </FilterBar>

      {groups.length === 0 && <p className="lf-empty">{t.empty}</p>}

      {groups.map((group) => {
        const yearLabel = group.year === null ? t.noDate : String(group.year);
        const heading = (
          <YearHeading
            year={
              group.part ? (
                <>
                  {yearLabel} <span className="lf-count">{t[group.part]}</span>
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
    </div>
  );
}
