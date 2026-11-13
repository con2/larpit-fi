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
async function loadLarpsWithRoles(roleRows: RoleRow[]) {
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

export interface YearGroup {
  /** null for larps without a start date */
  year: number | null;
  /** Set only for the current year, which is split into its upcoming and past larps. */
  part: "upcoming" | "past" | null;
  /** The first group of a year carries the `year-YYYY` anchor. */
  anchor: string;
  larps: OwnLarp[];
}

export function isUpcomingLarp(larp: OwnLarp, now: Date = new Date()) {
  const endsAt = ensureEndsAt(larp);
  return !!endsAt && endsAt >= now;
}

/**
 * Groups larps by the year they start in, keeping the order of the input. The current year is split
 * into its upcoming and past larps when it has both, as on the All larps page.
 */
export function groupOwnLarps(
  larps: OwnLarp[],
  now: Date = new Date(),
): YearGroup[] {
  const currentYear = now.getFullYear();
  const byKey = new Map<string, YearGroup>();

  for (const larp of larps) {
    const year = larp.startsAt ? Number(larp.startsAt.slice(0, 4)) : null;
    const part =
      year === currentYear
        ? isUpcomingLarp(larp, now)
          ? "upcoming"
          : "past"
        : null;
    const key = `${year ?? "unknown"}-${part ?? ""}`;
    const group = byKey.get(key);
    if (group) group.larps.push(larp);
    else
      byKey.set(key, {
        year,
        part,
        anchor: year === null ? "unknown" : String(year),
        larps: [larp],
      });
  }

  const groups = [...byKey.values()];
  const currentYearParts = groups.filter((group) => group.part);
  if (currentYearParts.length === 1) {
    currentYearParts[0].part = null;
  } else if (currentYearParts.length === 2) {
    const past = currentYearParts.find((group) => group.part === "past")!;
    past.anchor = `${currentYear}-past`;
  }
  return groups;
}
