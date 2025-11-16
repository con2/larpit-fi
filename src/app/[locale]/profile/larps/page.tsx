import { auth } from "@/auth";
import { Column, DataTable } from "@/components/DataTable";
import { DimensionFilters } from "@/components/DimensionFilters";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import { RelatedUserRole } from "@/generated/prisma";
import getLarpHref from "@/models/Larp";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import { Container } from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string[] }>;
}

async function getData(userId: string, roles: RelatedUserRole[]) {
  const relatedUsers = await prisma.relatedUser.findMany({
    where: {
      userId: userId,
      role: {
        in: roles,
      },
    },
    select: {
      larpId: true,
    },
    distinct: ["larpId"],
  });

  const larps = await prisma.larp.findMany({
    where: {
      id: {
        in: relatedUsers.map((relatedUser) => relatedUser.larpId),
      },
    },
    include: {
      municipality: {
        select: {
          nameFi: true,
        },
      },
      relatedUsers: {
        where: {
          userId: userId,
        },
      },
    },
    orderBy: [
      {
        startsAt: { sort: "desc", nulls: "last" },
      },
    ],
  });

  return larps;
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
      slug: "municipalityName",
      title: larpT.attributes.municipality.title,
      getCellContents: (row) => row.municipality?.nameFi,
    },
    {
      slug: "role",
      title: t.attributes.role.label,
      className: "col-2 align-middle",
      getCellContents: (row) => (
        <>
          {row.relatedUsers.map((relatedUser) => (
            <div key={relatedUser.role}>
              {relaTed.attributes.role.choices[relatedUser.role].title}
            </div>
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
    >
      <tfoot>
        <tr>
          <td colSpan={columns.length}>
            {t.tableFooter(rows.length, rows.length)}
          </td>
        </tr>
      </tfoot>
    </DataTable>
  );
}

const unimplementedRoles = [RelatedUserRole.EDITOR, RelatedUserRole.FAVORITE];

function getRoleFilters(t: Translations["RelatedUser"]) {
  return [
    {
      slug: "role",
      title: t.attributes.role.title,
      values: [
        { slug: "", title: t.filters.role.default },
        { slug: "ALL", title: t.filters.role.all },
        ...Object.entries(t.attributes.role.choices)
          .filter(([slug]) => !(unimplementedRoles as string[]).includes(slug))
          .map(([slug, { title }]) => ({ slug, title })),
      ],
    },
  ];
}

const defaultRoles = [
  RelatedUserRole.GAME_MASTER,
  RelatedUserRole.TEAM_MEMBER,
  RelatedUserRole.VOLUNTEER,
  RelatedUserRole.PLAYER,
];

export default async function OwnLarpsPage({ params, searchParams }: Props) {
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

  const filters = getRoleFilters(translations.RelatedUser);
  let { role: roles } = await searchParams;
  if (typeof roles === "string") {
    roles = [roles];
  }
  if (!roles || roles.length === 0 || roles.includes("")) {
    roles = defaultRoles;
  } else if (roles.includes("ALL")) {
    roles = Object.values(RelatedUserRole);
  }
  roles = roles.filter(
    (role) => RelatedUserRole[role as keyof typeof RelatedUserRole]
  );
  const rows = await getData(user.id, roles as RelatedUserRole[]);

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <DimensionFilters dimensions={filters} />
      <OwnLarpsTable rows={rows} translations={translations} locale={locale} />
    </Container>
  );
}
