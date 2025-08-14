import LarpCard from "@/components/LarpCard";
import MainHeading from "@/components/MainHeading";
import prisma from "@/prisma";
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
  const larps = search
    ? await prisma.larp.findMany({
        where: {
          name: {
            search: search || "",
          },
        },
        orderBy: {
          startsAt: "desc",
        },
      })
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
