/**
 * Client-safe content page helpers.
 * This file imports nothing from the database layer, so client components and unit tests can use it.
 */
import { supportedLanguages } from "@/i18n/locales";

export const frontPageSlug = "front-page";
export const seeAlsoSlug = "see-also";

/** The front page and the see also page are looked up by slug, so they cannot be renamed or deleted. */
export const protectedPageSlugs: readonly string[] = [
  frontPageSlug,
  seeAlsoSlug,
];

export type PageAdminAction = "edit" | "header-image" | "delete";

/**
 * A slug may not start with a segment that a route under `src/app/[locale]` already owns, or the
 * route would shadow the page. Keep this in sync with the top-level routes and the static
 * segments under `page/`.
 */
const reservedFirstSegments: readonly string[] = [
  "_next",
  "api",
  "api-docs",
  "calendar",
  "contact",
  "larp",
  "moderate",
  "page",
  "profile",
  "search",
  "stats",
  "user",
  "verify",
  "new",
  "edit",
  "header-image",
  "delete",
  ...supportedLanguages,
];

const slugPattern = /^[a-z0-9-]+(\/[a-z0-9-]+)*$/;

export type PageSlugError = "invalid" | "reserved" | "taken" | "protected";

export function validatePageSlug(slug: string): PageSlugError | null {
  if (slug.length > 200 || !slugPattern.test(slug)) return "invalid";
  if (reservedFirstSegments.includes(slug.split("/")[0])) return "reserved";
  return null;
}

/** Slugs with a slash are served at the site root; the others under `/page/`. */
export function isRootPageSlug(slug: string): boolean {
  return slug.includes("/");
}

/** Where a page is shown when its language is the UI language. */
export function pagePathInUiLanguage(slug: string): string {
  if (slug === frontPageSlug) return "/";
  if (isRootPageSlug(slug)) return `/${slug}`;
  return `/page/${slug}`;
}

/**
 * Where a content page is shown whatever the UI language. The front page of every language is the
 * site root. Root pages carry the language prefix, which switches the UI to the page's language,
 * because they are looked up in the UI language.
 */
export function contentPagePath(slug: string, language: string): string {
  if (slug === frontPageSlug) return "/";
  if (isRootPageSlug(slug)) return `/${language}/${slug}`;
  return `/page/${slug}/${language}`;
}

export function pageAdminPath(
  action: PageAdminAction,
  slug: string,
  language: string,
): string {
  return `/page/${action}/${language}/${slug}`;
}

/** Parses the menu position field: blank means the page is not in the info menu. */
export function parseMenuPosition(
  value: FormDataEntryValue | null,
): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const position = Number(value);
  return Number.isInteger(position) ? position : null;
}
