import { Column, DataTable } from "@/components/DataTable";
import { DimensionFilters } from "@/components/DimensionFilters";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import MainHeading from "@/components/MainHeading";
import { Language, LarpType } from "@/generated/prisma";
import getLarpHref from "@/models/Larp";
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
    orderBy: {
      startsAt: {
        sort: "desc",
        nulls: "last",
      },
    },
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
  });
}

type LarpListLarp = Awaited<ReturnType<typeof getData>>[number];

function LarpTable({
  larps,
  messages: t,
  locale,
  totalCount,
}: {
  larps: LarpListLarp[];
  messages: Translations["Larp"];
  locale: string;
  totalCount: number;
}) {
  const columns: Column<(typeof larps)[number]>[] = [
    {
      slug: "name",
      title: t.attributes.name.title,
    },
    {
      slug: "locationText",
      title: t.attributes.locationText.title,
    },
    {
      slug: "municipalityName",
      title: t.attributes.municipality.title,
      getCellContents: (row) => row.municipality?.nameFi,
    },
    {
      slug: "language",
      title: t.attributes.language.title,
      getCellContents: (row) => t.attributes.language.choices[row.language],
    },
    {
      slug: "type",
      title: t.attributes.type.title,
      getCellContents: (row) => t.attributes.type.choices[row.type].title,
    },
    {
      slug: "dateRange",
      title: <>{t.attributes.dateRange.title} 🔼</>,
      getCellContents: (row) => (
        <FormattedDateRange
          start={row.startsAt}
          end={row.endsAt}
          locale={locale}
        />
      ),
    },
  ];

  return (
    <DataTable
      // TODO rounded doesn't work on bootstrap .table?
      className="table table-striped table-hover border rounded mb-5"
      columns={columns}
      rows={larps}
      getRowHref={(row) => getLarpHref(row)}
    >
      <tfoot>
        <tr>
          <td colSpan={columns.length}>
            {t.tableFooter(larps.length, totalCount)}
          </td>
        </tr>
      </tfoot>
    </DataTable>
  );
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
          })
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
          })
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
  let { type: types, language: languages } = await searchParams;

  if (typeof types === "string") {
    types = [types];
  }
  if (!types || types.length === 0 || types.includes("")) {
    types = defaultTypes;
  } else if (types.includes("ALL")) {
    types = Object.values(LarpType);
  }
  types = types.filter((type) => LarpType[type as keyof typeof LarpType]);

  if (typeof languages === "string") {
    languages = [languages];
  }
  if (!languages || languages.length === 0 || languages.includes("")) {
    languages = Object.keys(t.attributes.language.choices);
  } else {
    languages = languages.filter(
      (language) =>
        t.attributes.language.choices[
          language as keyof typeof t.attributes.language.choices
        ]
    );
  }

  const [larps, totalCount] = await Promise.all([
    getData(types as LarpType[], languages as Language[]),
    prisma.larp.count(),
  ]);

  return (
    <Container>
      <MainHeading>{t.listTitle}</MainHeading>
      <DimensionFilters dimensions={filters} />
      <LarpTable
        larps={larps}
        messages={t}
        locale={locale}
        totalCount={totalCount}
      />
    </Container>
  );
}
