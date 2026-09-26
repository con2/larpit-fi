/**
 * Orders by the given values with nulls after every non-null value, for use with Array.sort.
 * Stands in for SQL `order by ... desc nulls last`, which the Prisma 8 ORM's `orderBy` cannot
 * express (Postgres puts nulls first for DESC). Retire this, and the in-memory sorts that use it,
 * once the ORM grows a nulls option; until then it is only fit for lists small enough to fetch whole.
 * ISO date strings order correctly as strings.
 */
export function compareNullsLast<T extends string | Date>(
  a: T | null | undefined,
  b: T | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}
