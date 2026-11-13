import z from "zod";

/**
 * Larp columns that a moderator decides one by one when merging two larp pages. `cancelledAt`
 * is shown as a yes/no; the chosen side's timestamp is kept as is.
 */
export const mergeableFields = [
  "name",
  "tagline",
  "type",
  "language",
  "openness",
  "description",
  "fluffText",
  "locationText",
  "municipalityId",
  "numPlayerCharacters",
  "numTotalParticipants",
  "startsAt",
  "endsAt",
  "signupStartsAt",
  "signupEndsAt",
  "cancelledAt",
  "alias",
  "headerImageId",
] as const;

export type MergeableField = (typeof mergeableFields)[number];

export type MergeSide = "a" | "b";

type MergeFieldValue = string | number | null;

export type MergeableLarp = Record<MergeableField, MergeFieldValue>;

/**
 * - `identical`: nothing to decide.
 * - `filled`: only one side has a value, which is preselected.
 * - `keepA`: both sides have one, A's is preselected and B's is not lost (an alias becomes a
 *   redirect; an image is replaceable).
 * - `conflict`: both sides have differing values; the moderator must confirm a choice.
 */
export type MergeFieldStatus = "identical" | "filled" | "keepA" | "conflict";

export interface MergeFieldDiff {
  field: MergeableField;
  status: MergeFieldStatus;
  defaultSide: MergeSide;
}

/** Fields that always have a meaningful value, so neither side counts as empty. */
const neverEmptyFields: ReadonlySet<MergeableField> = new Set([
  "type",
  "language",
  "cancelledAt",
]);

const keepAFields: ReadonlySet<MergeableField> = new Set([
  "alias",
  "headerImageId",
]);

function isEmpty(value: MergeFieldValue): boolean {
  return value === null || value === "";
}

function isSame(
  field: MergeableField,
  a: MergeFieldValue,
  b: MergeFieldValue,
): boolean {
  // Cancellation is a yes/no; the moment it was recorded does not matter.
  if (field === "cancelledAt") return (a === null) === (b === null);
  if (isEmpty(a) && isEmpty(b)) return true;
  return a === b;
}

export function diffLarps(
  a: MergeableLarp,
  b: MergeableLarp,
): MergeFieldDiff[] {
  return mergeableFields.map((field) => {
    const aValue = a[field];
    const bValue = b[field];
    if (isSame(field, aValue, bValue)) {
      return { field, status: "identical", defaultSide: "a" };
    }
    if (!neverEmptyFields.has(field)) {
      if (isEmpty(aValue)) return { field, status: "filled", defaultSide: "b" };
      if (isEmpty(bValue)) return { field, status: "filled", defaultSide: "a" };
    }
    if (keepAFields.has(field)) {
      return { field, status: "keepA", defaultSide: "a" };
    }
    return { field, status: "conflict", defaultSide: "a" };
  });
}

export type MergeLinkOrigin = "a" | "b" | "both";

export interface MergeLinkInput {
  id: string;
  type: string;
  href: string;
  title: string | null;
}

export interface MergeLink extends MergeLinkInput {
  origin: MergeLinkOrigin;
}

/** Drops differences that do not change where a link leads: host case and trailing slashes. */
function normalizeLinkHref(href: string): string {
  const trimmed = href.trim();
  try {
    const url = new URL(trimmed);
    // URL lowercases the scheme and host but keeps the case of the rest.
    return url.href.replace(/\/+$/, "");
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

/**
 * A's and B's links as one list keyed by type and normalized address. Where both larps have
 * the same link, A's row represents it.
 */
export function unionLinks(
  aLinks: MergeLinkInput[],
  bLinks: MergeLinkInput[],
): MergeLink[] {
  const key = (link: MergeLinkInput) =>
    `${link.type} ${normalizeLinkHref(link.href)}`;
  const result = new Map<string, MergeLink>();
  for (const link of aLinks) {
    if (!result.has(key(link))) result.set(key(link), { ...link, origin: "a" });
  }
  for (const link of bLinks) {
    const existing = result.get(key(link));
    if (!existing) {
      result.set(key(link), { ...link, origin: "b" });
    } else if (existing.origin === "a") {
      existing.origin = "both";
    }
  }
  return [...result.values()];
}

export const customNameMaxLength = 200;

const zSide = z.enum(["a", "b"]);

export const MergeChoices = z.object({
  fields: z.partialRecord(z.enum(mergeableFields), zSide),
  // NFC, like the name when it is edited (see ModerationRequestContent).
  customName: z.string().normalize().trim().max(customNameMaxLength).optional(),
  keepLinkIds: z.array(z.uuid()),
  aUpdateCount: z.number().int(),
  bUpdateCount: z.number().int(),
  aUpdatedAt: z.iso.datetime({ offset: true }),
  bUpdatedAt: z.iso.datetime({ offset: true }),
});

export type MergeChoices = z.infer<typeof MergeChoices>;

/**
 * The side each differing field takes, or null when a conflict has no explicit choice. A custom
 * name replaces the name whichever side is chosen for it.
 */
export function resolveMergeSides(
  diff: MergeFieldDiff[],
  choices: Pick<MergeChoices, "fields" | "customName">,
): Partial<Record<MergeableField, MergeSide>> | null {
  const sides: Partial<Record<MergeableField, MergeSide>> = {};
  for (const { field, status, defaultSide } of diff) {
    if (status === "identical") continue;
    const explicit = choices.fields[field];
    if (
      status === "conflict" &&
      !explicit &&
      !(field === "name" && choices.customName)
    ) {
      return null;
    }
    sides[field] = explicit ?? defaultSide;
  }
  return sides;
}
