import { auth } from "@/auth";
import { DimensionFilters } from "@/components/DimensionFilters";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import { LarpRow } from "@/components/LarpTable";
import { LarpType, RelatedUserRole } from "@/generated/prisma/client";
import {
  parseSearchParam,
  createEnumValidator,
} from "@/helpers/parseSearchParam";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import { Container } from "react-bootstrap";
import OwnLarpsTableClient from "./OwnLarpsTableClient";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string[]; type?: string[] }>;
}

async function getData(
  userId: string,
  roles: RelatedUserRole[],
  types: LarpType[],
) {
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

/** Count total larps the user has any role in (unfiltered) */
async function getTotalCount(userId: string): Promise<number> {
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    select count(distinct larp_id) as count
    from related_user
    where user_id = ${userId}
  `;
  return Number(result[0].count);
}

type OwnLarp = Awaited<ReturnType<typeof getData>>[number];

/** Serialize OwnLarp for client component */
export type OwnLarpRow = LarpRow & {
  /** Pre-resolved role titles */
  roleTitles: string[];
};

function serializeLarps(
  larps: OwnLarp[],
  roleChoices: Record<string, string>,
): OwnLarpRow[] {
  return larps.map((larp) => ({
    id: larp.id,
    name: larp.name,
    alias: larp.alias,
    locationText: larp.locationText,
    startsAt: larp.startsAt,
    endsAt: larp.endsAt,
    language: larp.language,
    type: larp.type,
    municipality: larp.municipality,
    roleTitles: larp.relatedUsers.map((ru) => roleChoices[ru.role] ?? ru.role),
  }));
}

const unimplementedRoles = [RelatedUserRole.EDITOR, RelatedUserRole.FAVORITE];
const defaultTypes = [LarpType.ONE_SHOT, LarpType.CAMPAIGN_LARP];

function getFilters(translations: Translations) {
  const roleT = translations.RelatedUser;
  const larpT = translations.Larp;
  return [
    {
      slug: "role",
      title: roleT.attributes.role.title,
      values: [
        { slug: "", title: roleT.filters.role.default },
        { slug: "ALL", title: roleT.filters.role.all },
        ...Object.entries(roleT.attributes.role.choices)
          .filter(([slug]) => !(unimplementedRoles as string[]).includes(slug))
          .map(([slug, { title }]) => ({ slug, title })),
      ],
    },
    {
      slug: "type",
      title: larpT.filters.type.title,
      values: [
        { slug: "", title: larpT.filters.type.default },
        { slug: "ALL", title: larpT.filters.type.all },
        ...Object.entries(larpT.attributes.type.choices).map(
          ([slug, { title }]) => ({
            slug,
            title,
          }),
        ),
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

  const filters = getFilters(translations);
  const { role: rolesParam, type: typesParam } = await searchParams;

  const roles = parseSearchParam(rolesParam, {
    defaults: defaultRoles,
    allValues: Object.values(RelatedUserRole),
    isValid: createEnumValidator(RelatedUserRole),
  });

  const types = parseSearchParam(typesParam, {
    defaults: defaultTypes,
    allValues: Object.values(LarpType),
    isValid: createEnumValidator(LarpType),
  });

  const [rawLarps, totalCount] = await Promise.all([
    getData(user.id, roles, types),
    getTotalCount(user.id),
  ]);
  const larps = serializeLarps(
    rawLarps,
    translations.Larp.clientAttributes.role.choices,
  );

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <DimensionFilters dimensions={filters} />
      <OwnLarpsTableClient
        larps={larps}
        messages={translations.Larp.clientAttributes}
        locale={locale}
        totalCount={totalCount}
      />
    </Container>
  );
}
