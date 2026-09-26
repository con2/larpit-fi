/**
 * Comparators for Array.sort that put nulls after every non-null value, whichever direction
 * the non-null values go. They stand in for SQL `order by ... nulls last`, which the Prisma 8
 * ORM's `orderBy` cannot express (Postgres puts nulls first for DESC). Retire them, and the
 * in-memory sorts that use them, once the ORM grows a nulls option; until then they are only
 * fit for lists small enough to fetch whole. ISO date strings order correctly as strings.
 */

/** Ascending, nulls last. */
export function compareNullsLast<T extends string | Date>(
  a: T | null | undefined,
  b: T | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Descending, nulls last. Swapping the arguments of compareNullsLast would instead put the
 * nulls first, so callers wanting latest-first must use this.
 */
export function compareDescNullsLast<T extends string | Date>(
  a: T | null | undefined,
  b: T | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a > b ? -1 : a < b ? 1 : 0;
}
