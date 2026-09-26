import LarpCard from "@/components/LarpCard";
import MainHeading from "@/components/MainHeading";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { query, sql } from "@/prisma/sql";
import { getTranslations } from "@/translations";
import Container from "react-bootstrap/Container";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search: string }>;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { search } = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.SearchPage;

  // TODO index for search
  // https://github.com/prisma/prisma/issues/8950
  const matchingLarpIds = search
    ? await query<{ id: string }>(sql`
        select id from larp
        where to_tsvector('finnish', name) @@ phraseto_tsquery('finnish', ${search})
      `)
    : [];
  const larps =
    matchingLarpIds.length > 0
      ? parseDates(
          await db.orm.public.Larp.where((l) =>
            l.id.in(matchingLarpIds.map((m) => m.id)),
          )
            .include("municipality", (m) => m.select("nameFi"))
            .orderBy((l) => l.startsAt.desc())
            .all(),
        )
      : [];

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <form className="mb-5">
        <label htmlFor="SearchPage-searchTerm" className="visually-hidden">
          {t.searchTerm.title}
        </label>
        <input
          id="SearchPage-searchTerm"
          name="search"
          type="text"
          className="form-control fs-5"
          placeholder={t.searchTerm.placeholder + "…"}
          defaultValue={search}
        />
      </form>
      <div className="row mb-3">
        {larps.map((larp) => (
          <LarpCard
            larp={larp}
            locale={locale}
            key={larp.id}
            messages={translations.Larp}
          />
        ))}
      </div>
    </Container>
  );
}
