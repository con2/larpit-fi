import { auth } from "@/auth";
import { Column, DataTable } from "@/components/DataTable";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import getLarpHref from "@/models/Larp";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import { Container } from "react-bootstrap";
import { groupBy, sortBy } from "underscore";

interface Props {
  params: Promise<{ locale: string }>;
}

async function getData(userId: string) {
  const relatedUsers = await prisma.relatedUser.findMany({
    where: {
      userId: userId,
    },
    include: {
      larp: {
        select: {
          id: true,
          name: true,
          locationText: true,
          startsAt: true,
          endsAt: true,
          alias: true,
        },
      },
    },
    orderBy: [
      {
        larp: {
          startsAt: "desc",
        },
      },
    ],
  });

  const rows = Object.entries(groupBy(relatedUsers, (row) => row.larpId)).map(
    ([_larpId, rows]) => {
      const larp = rows[0].larp;
      return {
        ...larp,
        roles: rows.map((row) => row.role),
      };
    }
  );

  return sortBy(rows, (row) => row.startsAt).reverse();
}

type OwnLarp = Awaited<ReturnType<typeof getData>>[number];

function OwnLarpsTable({
  rows,
  translations,
  locale,
}: {
  rows: OwnLarp[];
  translations: Translations;
  locale: string;
}) {
  const t = translations.OwnLarpsPage;
  const larpT = translations.Larp;
  const relaTed = translations.RelatedUser;
  const columns: Column<OwnLarp>[] = [
    {
      slug: "name",
      title: larpT.attributes.name.title,
      getCellContents: (row) => row.name,
    },
    {
      slug: "locationText",
      title: larpT.attributes.locationText.title,
      getCellContents: (row) => row.locationText,
    },
    {
      slug: "role",
      title: t.attributes.role.label,
      className: "col-2 align-middle",
      getCellContents: (row) => (
        <>
          {row.roles.map((role) => (
            <div key={role}>{relaTed.attributes.role.choices[role].title}</div>
          ))}
        </>
      ),
    },
    {
      slug: "dateRange",
      title: <>{larpT.attributes.dateRange.title} 🔼</>,
      className: "col-2 align-middle",
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
      rows={rows}
      getRowHref={(row) => getLarpHref(row)}
    />
  );
}

export default async function OwnLarpsPage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.OwnLarpsPage;

  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
      })
    : null;
  if (!user) {
    return <LoginRequired messages={translations.LoginRequired} />;
  }

  const rows = await getData(user.id);

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <OwnLarpsTable rows={rows} translations={translations} locale={locale} />
    </Container>
  );
}
