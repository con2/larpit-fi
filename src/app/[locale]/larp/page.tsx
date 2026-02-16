import { DimensionFilters } from "@/components/DimensionFilters";
import { LarpTable } from "@/components/LarpTable";
import MainHeading from "@/components/MainHeading";
import { Language, LarpType } from "@/generated/prisma/client";
import {
  parseSearchParam,
  createEnumValidator,
} from "@/helpers/parseSearchParam";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import { Container } from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string[]; language?: string[] }>;
}

const defaultTypes = [LarpType.ONE_SHOT, LarpType.CAMPAIGN_LARP];

async function getData(types: LarpType[], languages: Language[]) {
  return prisma.larp.findMany({
    where: {
      type: {
        in: types,
      },
      language: {
        in: languages,
      },
    },
    include: {
      municipality: {
        select: {
          nameFi: true,
        },
      },
    },
    orderBy: [
      {
        startsAt: {
          sort: "desc",
          nulls: "last",
        },
      },
    ],
  });
}

function getLarpFilters(t: Translations["Larp"]) {
  return [
    {
      slug: "language",
      title: t.attributes.language.title,
      values: [
        { slug: "", title: t.filters.language.all },
        ...Object.entries(t.attributes.language.choices).map(
          ([slug, title]) => ({
            slug,
            title,
          }),
        ),
      ],
    },
    {
      slug: "type",
      title: t.filters.type.title,
      values: [
        { slug: "", title: t.filters.type.default },
        { slug: "ALL", title: t.filters.type.all },
        ...Object.entries(t.attributes.type.choices).map(
          ([slug, { title }]) => ({
            slug,
            title,
          }),
        ),
      ],
    },
  ];
}

export default async function LarpListPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.Larp;

  const filters = getLarpFilters(t);
  const { type: typesParam, language: languagesParam } = await searchParams;

  const types = parseSearchParam(typesParam, {
    defaults: defaultTypes,
    allValues: Object.values(LarpType),
    isValid: createEnumValidator(LarpType),
  });

  const languages = parseSearchParam(languagesParam, {
    defaults: Object.values(Language),
    allValues: Object.values(Language),
    isValid: createEnumValidator(Language),
  });

  const [larps, totalCount] = await Promise.all([
    getData(types, languages),
    prisma.larp.count(),
  ]);

  return (
    <Container>
      <MainHeading>{t.listTitle}</MainHeading>
      <DimensionFilters dimensions={filters} />
      <LarpTable
        larps={larps}
        messages={t.clientAttributes}
        locale={locale}
        totalCount={totalCount}
      />
    </Container>
  );
}
