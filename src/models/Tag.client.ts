/**
 * Client-safe tag helpers.
 * This file imports nothing from the database layer, so client components and unit tests can use it.
 */
import { slugify } from "@/helpers/larpAlias";
import { foldForeignLetters } from "@/search/searchQuery";
import { validate as validateUuid } from "uuid";

export const tagSlugMaxLength = 60;

export const tagSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface TagNames {
  nameFi: string;
  nameEn: string;
}

export interface TagDescriptions {
  descriptionFi: string;
  descriptionEn: string;
}

/** A tag of the vocabulary as the tags field, chips and the palette see it. */
export interface TagSummary extends TagNames, TagDescriptions {
  id: string;
  slug: string;
  larpCount: number;
}

export function suggestTagSlug(nameEn: string): string {
  return slugify(nameEn).slice(0, tagSlugMaxLength).replace(/-$/, "");
}

export function tagName(tag: TagNames, locale: string): string {
  return locale === "fi" ? tag.nameFi : tag.nameEn;
}

export function otherTagName(tag: TagNames, locale: string): string {
  return locale === "fi" ? tag.nameEn : tag.nameFi;
}

export function tagDescription(tag: TagDescriptions, locale: string): string {
  return locale === "fi" ? tag.descriptionFi : tag.descriptionEn;
}

/** The description as one line of plain text, cut at a word boundary near `maxLength`. */
export function tagDescriptionExcerpt(
  markdown: string,
  maxLength = 90,
): string {
  const text = markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : text.slice(0, maxLength)).trimEnd()}…`;
}

export function compareTagNames(locale: string) {
  const collator = new Intl.Collator(locale === "fi" ? "fi" : "en");
  return (a: TagNames, b: TagNames) =>
    collator.compare(tagName(a, locale), tagName(b, locale));
}

/** Whether either name of the tag contains the query, ignoring case and foreign letters. */
export function tagMatches(tag: TagNames, query: string): boolean {
  const needle = foldForeignLetters(query.trim());
  if (!needle) return true;
  return [tag.nameFi, tag.nameEn].some((name) =>
    foldForeignLetters(name).includes(needle),
  );
}

/** Marks a form that has the tags field, so that a form without it leaves the tags alone. */
export const tagsFieldMarker = "tagsField";

function tagIdsOf(data: FormData, name: string): string[] {
  const ids = data
    .getAll(name)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => validateUuid(value));
  return [...new Set(ids)];
}

/**
 * Reads the tags field of a larp form: the tags the larp had when the form was loaded (`tagLoaded`)
 * and the ones picked (`tagId`). Null when the form has no tags field. The fields repeat, which
 * `normalizeFormData` does not support.
 */
export function parseTagsFromFormData(
  data: FormData,
): { loaded: string[]; desired: string[] } | null {
  if (!data.has(tagsFieldMarker)) return null;
  return {
    loaded: tagIdsOf(data, "tagLoaded"),
    desired: tagIdsOf(data, "tagId"),
  };
}

/**
 * The changes the editor made between loading and submitting the form, against the tags the larp
 * has now: a tag that someone else added or removed meanwhile, and this editor did not touch,
 * stays as it is now.
 */
export function diffLarpTags(
  loaded: string[],
  desired: string[],
  current: string[],
): { addTags: string[]; removeTags: string[] } {
  const loadedSet = new Set(loaded);
  const desiredSet = new Set(desired);
  const currentSet = new Set(current);
  return {
    addTags: desired.filter((id) => !loadedSet.has(id) && !currentSet.has(id)),
    removeTags: loaded.filter(
      (id) => !desiredSet.has(id) && currentSet.has(id),
    ),
  };
}
