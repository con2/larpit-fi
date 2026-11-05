import { compareDescNullsLast } from "@/helpers/sort";
import { ensureEndsAt } from "@/models/Larp.client";
import { RelatedUserRole } from "@/prisma/enums";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";

export const ownLarpsFilters = [
  "all",
  "organizing",
  "played",
  "favourites",
] as const;
export type OwnLarpsFilter = (typeof ownLarpsFilters)[number];

/** CREATED_BY is left out: adding a page for a larp does not make one its organizer. */
const organizingRoles: RelatedUserRole[] = [
  RelatedUserRole.GAME_MASTER,
  RelatedUserRole.TEAM_MEMBER,
  RelatedUserRole.VOLUNTEER,
  RelatedUserRole.EDITOR,
];

const filterRoles: Record<Exclude<OwnLarpsFilter, "all">, RelatedUserRole[]> = {
  organizing: organizingRoles,
  played: [RelatedUserRole.PLAYER],
  favourites: [RelatedUserRole.FAVORITE],
};

/** Order of the role tags on a row. */
const roleTagOrder: RelatedUserRole[] = [
  RelatedUserRole.GAME_MASTER,
  RelatedUserRole.TEAM_MEMBER,
  RelatedUserRole.VOLUNTEER,
  RelatedUserRole.EDITOR,
  RelatedUserRole.PLAYER,
  RelatedUserRole.LOCAL_SIGNUP_YES,
  RelatedUserRole.LOCAL_SIGNUP_MAYBE,
  RelatedUserRole.LOCAL_SIGNUP_NO,
  RelatedUserRole.FAVORITE,
  RelatedUserRole.CREATED_BY,
];

export function parseOwnLarpsFilter(value: unknown): OwnLarpsFilter {
  return ownLarpsFilters.find((filter) => filter === value) ?? "all";
}

export interface RoleRow {
  larpId: string;
  role: RelatedUserRole;
}

export type OwnLarp = Awaited<ReturnType<typeof loadLarpsWithRoles>>[number];

export async function loadOwnLarps(userId: string) {
  const roleRows = await db.orm.public.RelatedUser.where({ userId })
    .select("larpId", "role")
    .all();
  return loadLarpsWithRoles(roleRows);
}

/** Latest first, undated larps last. */
export async function loadLarpsWithRoles(roleRows: RoleRow[]) {
  const rolesByLarp = new Map<string, Set<RelatedUserRole>>();
  for (const { larpId, role } of roleRows) {
    const roles = rolesByLarp.get(larpId) ?? new Set();
    roles.add(role);
    rolesByLarp.set(larpId, roles);
  }
  if (rolesByLarp.size === 0) return [];

  const larps = await db.orm.public.Larp.where((l) =>
    l.id.in([...rolesByLarp.keys()]),
  )
    .select(
      "id",
      "alias",
      "name",
      "type",
      "language",
      "tagline",
      "startsAt",
      "endsAt",
      "openness",
      "signupStartsAt",
      "signupEndsAt",
      "cancelledAt",
      "locationText",
      "updatedAt",
      "updateCount",
    )
    .include("municipality", (m) => m.select("nameFi"))
    .all();

  return parseDates(larps)
    .map((larp) => {
      const roles = rolesByLarp.get(larp.id) ?? new Set();
      return {
        ...larp,
        roles: roleTagOrder.filter((role) => roles.has(role)),
      };
    })
    .sort((a, b) => compareDescNullsLast(a.startsAt, b.startsAt));
}

export function filterOwnLarps(
  larps: OwnLarp[],
  filter: OwnLarpsFilter,
): OwnLarp[] {
  if (filter === "all") return larps;
  const roles = filterRoles[filter];
  return larps.filter((larp) =>
    larp.roles.some((role) => roles.includes(role)),
  );
}

export function countOwnLarps(
  larps: OwnLarp[],
): Record<OwnLarpsFilter, number> {
  return Object.fromEntries(
    ownLarpsFilters.map((filter) => [
      filter,
      filterOwnLarps(larps, filter).length,
    ]),
  ) as Record<OwnLarpsFilter, number>;
}

/**
 * The roles worth a tag on a row: an editor right is implied by being an organizer, and having
 * added the page only matters when nothing else ties the user to the larp.
 */
export function getRoleTags(roles: RelatedUserRole[]): RelatedUserRole[] {
  return roles.filter((role) => {
    if (role === RelatedUserRole.EDITOR) {
      return !roles.some(
        (other) => other !== role && organizingRoles.includes(other),
      );
    }
    if (role === RelatedUserRole.CREATED_BY) return roles.length === 1;
    return true;
  });
}

export function isOrganizing(roles: RelatedUserRole[]): boolean {
  return roles.some((role) => organizingRoles.includes(role));
}

export interface YearGroup {
  /** null for larps without a start date */
  year: number | null;
  larps: OwnLarp[];
}

/**
 * Splits larps that have not ended yet into `upcoming`; the rest are grouped by the year they
 * start in, keeping the order of the input.
 */
export function groupOwnLarps(
  larps: OwnLarp[],
  now: Date = new Date(),
): { upcoming: OwnLarp[]; years: YearGroup[] } {
  const upcoming: OwnLarp[] = [];
  const years: YearGroup[] = [];

  for (const larp of larps) {
    const endsAt = ensureEndsAt(larp);
    if (endsAt && endsAt >= now) {
      upcoming.push(larp);
      continue;
    }
    const year = larp.startsAt ? Number(larp.startsAt.slice(0, 4)) : null;
    const group = years.at(-1);
    if (group && group.year === year) group.larps.push(larp);
    else years.push({ year, larps: [larp] });
  }

  return { upcoming, years };
}
