import { toPlainDate } from "@con2/components/helpers";

import LarpYearList, {
  filterSearchParams,
  getYearCounts,
  type LarpListQuery,
  parseLarpListFilters,
} from "@/components/LarpYearList";
import {
  FilterGroup,
  FilterMenu,
  type FilterOption,
} from "@/components/ui/FilterBar";
import { compareTagNames, tagName } from "@/models/Tag.client";
import { getTagsWithCounts } from "@/models/Tag";
import { getReader } from "@/prisma/reader";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import styles from "./page.module.scss";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<LarpListQuery>;
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
  const tagT = translations.Tag;
  const query = await searchParams;
  const filters = parseLarpListFilters(query);

  const today = toPlainDate(new Date()).toString();
  const currentYear = Number(today.slice(0, 4));
  const numberFormat = new Intl.NumberFormat(locale);
  const formatCount = (count: number) => numberFormat.format(count);

  const [yearCounts, tags] = await Promise.all([
    getYearCounts(filters, today),
    getReader().then(getTagsWithCounts),
  ]);

  const timelineCounts = new Map<number, number>();
  for (const row of yearCounts) {
    if (row.year === null) continue;
    timelineCounts.set(row.year, Number(row.past) + Number(row.upcoming));
  }

  const carriedFilters = filterSearchParams(query).toString();
  const tagOptions: FilterOption[] = [
    ...tags
      .filter((tag) => tag.larpCount > 0)
      .sort(compareTagNames(locale))
      .map((tag) => ({
        title: tagName(tag, locale),
        href: `/tag/${tag.slug}${carriedFilters ? `?${carriedFilters}` : ""}`,
        current: false,
      })),
    { title: tagT.browseAll, href: "/tag", current: false },
  ];

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

      <LarpYearList
        locale={locale}
        query={query}
        basePath="/larp"
        filters={filters}
        yearCounts={yearCounts}
        today={today}
        extraFilters={
          tagOptions.length > 1 && (
            <FilterGroup label={tagT.listTitle} options={[]}>
              <FilterMenu
                summary={tagT.pick}
                isCurrent={false}
                options={tagOptions}
              />
            </FilterGroup>
          )
        }
      />
    </>
  );
}
