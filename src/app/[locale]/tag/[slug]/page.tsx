import { Markdown } from "@con2/components";
import { toPlainDate } from "@con2/components/helpers";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { auth } from "@/auth";
import LarpYearList, {
  getYearCounts,
  type LarpListQuery,
  parseLarpListFilters,
} from "@/components/LarpYearList";
import { getTagBySlug } from "@/models/Tag";
import { tagDescription, tagName } from "@/models/Tag.client";
import { canModerate, getUserFromSession } from "@/models/User";
import { Language, LarpType } from "@/prisma/enums";
import { getReader } from "@/prisma/reader";
import { getTranslations } from "@/translations";
import styles from "../page.module.scss";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<LarpListQuery>;
}

const getTag = cache(async (slug: string) =>
  getTagBySlug(await getReader(), slug),
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const tag = await getTag(slug);
  if (!tag) return {};
  return {
    title: tagName(tag, locale),
    description: tagDescription(tag, locale) || undefined,
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const query = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.Tag;

  const tag = await getTag(slug);
  if (!tag) notFound();

  const filters = parseLarpListFilters(query);
  const today = toPlainDate(new Date()).toString();
  const [yearCounts, allYearCounts, user] = await Promise.all([
    getYearCounts(filters, today, tag.id),
    getYearCounts(
      {
        types: Object.values(LarpType),
        languages: Object.values(Language),
        cancelled: "hide",
      },
      today,
      tag.id,
    ),
    auth().then(getUserFromSession),
  ]);

  const numberFormat = new Intl.NumberFormat(locale);
  const formatCount = (count: number) => numberFormat.format(count);
  let larpCount = 0;
  let upcomingCount = 0;
  let firstYear: number | null = null;
  for (const row of allYearCounts) {
    larpCount += Number(row.past) + Number(row.upcoming);
    upcomingCount += Number(row.upcoming);
    if (row.year !== null && (firstYear === null || row.year < firstYear)) {
      firstYear = row.year;
    }
  }
  const facts = [
    t.larpCount(formatCount(larpCount)),
    upcomingCount > 0 && t.upcomingCount(formatCount(upcomingCount)),
    firstYear !== null && t.firstIn(firstYear),
  ].filter(Boolean);
  const description = tagDescription(tag, locale);

  return (
    <>
      <header className="lf-container lf-page-header">
        <p className="lf-eyebrow">
          <Link href="/tag" className="lf-row-link">
            {t.title}
          </Link>
        </p>
        <h1 className="lf-display-l">{tagName(tag, locale)}</h1>
        {description && (
          <div className="lf-prose">
            <Markdown input={description} />
          </div>
        )}
        <p className={`lf-data lf-muted ${styles.facts}`}>
          {facts.join(" · ")}
        </p>
        <div className={styles.headerLinks}>
          <Link href="/tag" className="lf-more-link">
            {t.allTags} →
          </Link>
          {canModerate(user) && (
            <Link
              href={`/tag?edit=${encodeURIComponent(tag.slug)}`}
              className="lf-more-link"
            >
              {t.actions.editTag}
            </Link>
          )}
        </div>
      </header>

      <LarpYearList
        locale={locale}
        query={query}
        basePath={`/tag/${tag.slug}`}
        filters={filters}
        yearCounts={yearCounts}
        today={today}
        tagId={tag.id}
      />
    </>
  );
}
