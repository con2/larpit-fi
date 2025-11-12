import { Column, DataTable } from "@/components/DataTable";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import MainHeading from "@/components/MainHeading";
import { LarpType } from "@/generated/prisma";
import getLarpHref from "@/models/Larp";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import Link from "next/link";
import { Container } from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string[] }>;
}

const defaultTypes = [LarpType.ONE_SHOT, LarpType.CAMPAIGN_LARP];

async function getData(types: LarpType[]) {
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
      slug: "type",
      title: t.attributes.type.title,
      className: "col-2",
      getCellContents: (row) => t.attributes.type.choices[row.type].title,
    },
    {
      slug: "dateRange",
      title: <>{t.attributes.dateRange.title} 🔼</>,
      className: "col-2",
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

export default async function LarpListPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.Larp;

  let { type: types } = await searchParams;
  if (typeof types === "string") {
    types = [types];
  }
  if (!types || types.length === 0) {
    types = defaultTypes;
  }
  if (types.includes("ALL")) {
    types = Object.values(LarpType);
  }
  types = types.filter((type) => LarpType[type as keyof typeof LarpType]);
  const [larps, totalCount] = await Promise.all([
    getData(types as LarpType[]),
    prisma.larp.count(),
  ]);
  const isShowingAll = Object.values(LarpType).every((status) =>
    types.includes(status)
  );

  return (
    <Container>
      <MainHeading>{t.listTitle}</MainHeading>
      {isShowingAll ? (
        <p className="text-muted text-center">{t.actions.showAll.active}</p>
      ) : (
        <p className="text-muted text-center">
          {t.actions.showAll.inactive}{" "}
          <Link className="link-subtle" href="/larp?type=ALL">
            {t.actions.showAll.title}
          </Link>
          .
        </p>
      )}
      <LarpTable
        larps={larps}
        messages={t}
        locale={locale}
        totalCount={totalCount}
      />
    </Container>
  );
}
