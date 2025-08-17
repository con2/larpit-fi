import { Column, DataTable } from "@/components/DataTable";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import MainHeading from "@/components/MainHeading";
import { LarpType } from "@/generated/prisma";
import getLarpHref from "@/models/Larp";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import Link from "next/link";
import { Container } from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string[] }>;
}

const defaultTypes = [LarpType.ONE_SHOT, LarpType.CAMPAIGN_LARP];

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

  const isShowingAll = Object.values(LarpType).every((status) =>
    types.includes(status)
  );

  const larps = await prisma.larp.findMany({
    orderBy: {
      startsAt: {
        sort: "desc",
        nulls: "last",
      },
    },
    where: {
      type: {
        in: types as LarpType[],
      },
    },
  });

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
      <DataTable
        // TODO rounded doesn't work on bootstrap .table?
        className="table table-striped table-hover border rounded mb-5"
        columns={columns}
        rows={larps}
        getRowHref={(row) => getLarpHref(row)}
      />
    </Container>
  );
}
