import { Language, LarpType } from "@/prisma/enums";

export const typeGroups = ["larps", "campaigns", "events"] as const;
export type TypeGroup = (typeof typeGroups)[number];

export const filterLanguages = [Language.fi, Language.en, Language.sv] as const;
export type FilterLanguage = (typeof filterLanguages)[number];

/** Must agree with the tag variants in components/ui/TypeTag, which the chips are named after. */
export const typeGroupByType: Record<LarpType, TypeGroup> = {
  [LarpType.ONE_SHOT]: "larps",
  [LarpType.MULTIPLE_RUNS]: "larps",
  [LarpType.CAMPAIGN_LARP]: "campaigns",
  [LarpType.CAMPAIGN]: "campaigns",
  [LarpType.OTHER_EVENT]: "events",
  [LarpType.OTHER_EVENT_SERIES]: "events",
};

/**
 * `type` null means All. Signup open and the languages narrow the type selection further; selected
 * languages are alternatives to each other, so FI + SV shows larps in either.
 */
export interface CalendarFilters {
  type: TypeGroup | null;
  signupOpen: boolean;
  languages: FilterLanguage[];
}

export interface CalendarSearchParams {
  month?: string | string[];
  type?: string | string[];
  open?: string | string[];
  lang?: string | string[];
  expand?: string | string[];
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function all(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).flatMap((v) => v.split(","));
}

export function parseFilters(params: CalendarSearchParams): CalendarFilters {
  const type = first(params.type);
  return {
    type: typeGroups.find((group) => group === type) ?? null,
    signupOpen: first(params.open) === "1",
    languages: filterLanguages.filter((language) =>
      all(params.lang).includes(language),
    ),
  };
}

export function matchesFilters(
  larp: { type: LarpType; language: Language },
  isSignupOpen: boolean,
  filters: CalendarFilters,
): boolean {
  if (filters.type && typeGroupByType[larp.type] !== filters.type) return false;
  if (filters.signupOpen && !isSignupOpen) return false;
  if (
    filters.languages.length > 0 &&
    !filters.languages.some((language) => language === larp.language)
  ) {
    return false;
  }
  return true;
}

export function isFiltered(filters: CalendarFilters): boolean {
  return (
    filters.type !== null || filters.signupOpen || filters.languages.length > 0
  );
}

/** `/calendar` with the given month and filters; parameters at their defaults are left out. */
export function calendarHref(
  month: string | null,
  filters: CalendarFilters,
  extra: Record<string, string> = {},
  hash?: string,
): string {
  const params = new URLSearchParams();
  if (month) params.set("month", month);
  if (filters.type) params.set("type", filters.type);
  if (filters.signupOpen) params.set("open", "1");
  if (filters.languages.length > 0) {
    params.set("lang", filters.languages.join(","));
  }
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const query = params.toString();
  return `/calendar${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

export function toggleLanguage(
  filters: CalendarFilters,
  language: FilterLanguage,
): CalendarFilters {
  const languages = filters.languages.includes(language)
    ? filters.languages.filter((l) => l !== language)
    : filterLanguages.filter(
        (l) => l === language || filters.languages.includes(l),
      );
  return { ...filters, languages };
}
