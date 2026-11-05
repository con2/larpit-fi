import LarpRow from "@/components/ui/LarpRow";
import SectionHeading from "@/components/ui/SectionHeading";
import { ensureEndsAt } from "@/models/Larp";
import { parseDates } from "@/prisma/dates";
import { dbRead } from "@/prisma/db";
import { queryRead, sql } from "@/prisma/sql";
import { getTranslations } from "@/translations";
import styles from "./page.module.scss";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string }>;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { search } = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.SearchPage;

  // TODO index for search
  // https://github.com/prisma/prisma/issues/8950
  const matchingLarpIds = search
    ? await queryRead<{ id: string }>(sql`
        select id from larp
        where to_tsvector('finnish', name) @@ phraseto_tsquery('finnish', ${search})
      `)
    : [];
  const larps =
    matchingLarpIds.length > 0
      ? parseDates(
          await dbRead.orm.public.Larp.where((l) =>
            l.id.in(matchingLarpIds.map((m) => m.id)),
          )
            .include("municipality", (m) => m.select("nameFi"))
            .orderBy((l) => l.startsAt.desc())
            .all(),
        )
      : [];
  const now = new Date();

  return (
    <div className="lf-container">
      <header className="lf-page-header">
        <h1 className="lf-display-l">{t.title}</h1>
        <form className={styles.form} role="search">
          <label htmlFor="SearchPage-searchTerm" className="visually-hidden">
            {t.searchTerm.title}
          </label>
          <input
            id="SearchPage-searchTerm"
            name="search"
            type="search"
            className="form-control"
            placeholder={t.searchTerm.placeholder + "…"}
            defaultValue={search}
          />
          <button type="submit" className="btn btn-primary">
            {t.submit}
          </button>
        </form>
      </header>

      {search && (
        <section className={`lf-section ${styles.results}`}>
          <SectionHeading count={larps.length}>{t.results}</SectionHeading>
          {larps.length > 0 ? (
            larps.map((larp) => (
              <LarpRow
                key={larp.id}
                larp={larp}
                locale={locale}
                messages={translations.Larp}
                past={(ensureEndsAt(larp) ?? now) < now}
              />
            ))
          ) : (
            <p className="lf-empty">{t.noResults}</p>
          )}
        </section>
      )}
    </div>
  );
}
