import { Markdown } from "@con2/components";
import type { Metadata } from "next";
import Link from "next/link";

import LarpRow from "@/components/ui/LarpRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { toSupportedLanguage } from "@/i18n/locales";
import { ensureEndsAt } from "@/models/Larp.client";
import { pagePathInUiLanguage } from "@/models/Page.client";
import { getReader } from "@/prisma/reader";
import { allowSearch } from "@/search/rateLimit";
import { searchLarps, searchPages } from "@/search/search";
import { parseSearchQuery } from "@/search/searchQuery";
import { getTranslations } from "@/translations";
import styles from "./page.module.scss";

type SearchParam = string | string[] | undefined;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: SearchParam; count?: SearchParam }>;
}

const larpCountStep = 20;
const maxLarpCount = 200;
const pageLimit = 20;

function first(value: SearchParam): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parseLarpCount(value: SearchParam): number {
  const count = parseInt(first(value), 10);
  if (!Number.isFinite(count)) return larpCountStep;
  return Math.min(Math.max(count, larpCountStep), maxLarpCount);
}

function searchHref(text: string, count: number) {
  const params = new URLSearchParams({ search: text });
  if (count > larpCountStep) params.set("count", String(count));
  return `/search?${params}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const { text } = parseSearchQuery(first((await searchParams).search));
  const t = getTranslations(locale).SearchPage;
  if (!text) return { title: t.title };
  return {
    title: t.resultsTitle.replace("{query}", text),
    robots: { index: false },
  };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { search, count } = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.SearchPage;
  const query = parseSearchQuery(first(search));
  const larpCount = parseLarpCount(count);

  const header = (
    <header className="lf-container lf-page-header">
      <h1 className="lf-display-l">{t.title}</h1>
      <form className={styles.form} role="search" action="/search">
        <label htmlFor="SearchPage-search" className="visually-hidden">
          {t.searchTerm.title}
        </label>
        <input
          id="SearchPage-search"
          name="search"
          type="search"
          className={`form-control ${styles.input}`}
          placeholder={t.searchTerm.placeholder}
          defaultValue={query.text}
          autoFocus={!query.text}
        />
        <button type="submit" className="btn btn-primary">
          {t.submit}
        </button>
      </form>
    </header>
  );

  if (!query.text) {
    return (
      <>
        {header}
        <div className={`lf-container ${styles.body}`}>
          <p className={`lf-dim ${styles.prompt}`}>{t.prompt}</p>
        </div>
      </>
    );
  }

  if (!(await allowSearch())) {
    return (
      <>
        {header}
        <div className={`lf-container ${styles.body}`}>
          <p className="lf-empty">{t.rateLimited}</p>
        </div>
      </>
    );
  }

  const reader = await getReader();
  const language = toSupportedLanguage(locale);
  const [larps, pages] = await Promise.all([
    searchLarps(reader, query, { limit: larpCount }),
    searchPages(reader, query, language, { limit: pageLimit }),
  ]);
  const now = new Date();

  return (
    <>
      {header}
      <div className={`lf-container ${styles.body}`}>
        {larps.total === 0 && pages.total === 0 && (
          <p className="lf-empty">{t.noResults}</p>
        )}

        {pages.total > 0 && (
          <section className={styles.section}>
            <SectionHeading count={pages.total}>{t.pages}</SectionHeading>
            {pages.results.map((page) => (
              <div key={page.slug} className={`lf-row ${styles.pageRow}`}>
                <div className="lf-row__main">
                  <Link
                    href={pagePathInUiLanguage(page.slug)}
                    className={`lf-row__title ${styles.pageTitle}`}
                  >
                    {page.title}
                  </Link>
                  {page.ingress.trim() && (
                    <div className={`lf-row__sub ${styles.ingress}`}>
                      <Markdown input={page.ingress} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {larps.total > 0 && (
          <section className={styles.section}>
            <SectionHeading count={larps.total}>{t.larps}</SectionHeading>
            {larps.results.map((larp) => (
              <LarpRow
                key={larp.id}
                larp={larp}
                locale={locale}
                messages={translations.Larp}
                past={(ensureEndsAt(larp) ?? now) < now}
              />
            ))}
            {larps.total > larps.results.length && larpCount < maxLarpCount && (
              <Link
                href={searchHref(query.text, larpCount + larpCountStep)}
                scroll={false}
                className={styles.more}
              >
                {t.showMore} ↓
              </Link>
            )}
          </section>
        )}
      </div>
    </>
  );
}
