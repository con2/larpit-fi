/** Orders by the given values with nulls after every non-null value, for use with Array.sort. */
export function compareNullsLast(
  a: Date | null | undefined,
  b: Date | null | undefined,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return a.getTime() - b.getTime();
}
