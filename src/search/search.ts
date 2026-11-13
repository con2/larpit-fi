import type { QueryResultRow } from "pg";

import type { LarpRowLarp } from "@/components/ui/LarpRow";
import {
  getSignupPillState,
  type SignupPillState,
} from "@/components/ui/signupPillState";
import { formatDateRange, formatShortDateRange } from "@/helpers/dates";
import { typesetDashes } from "@/helpers/larpName";
import type { SupportedLanguage } from "@/i18n/locales";
import { ensureEndsAt, getLarpHref } from "@/models/Larp.client";
import { frontPageSlug, seeAlsoSlug } from "@/models/Page.client";
import { parseDates } from "@/prisma/dates";
import type { db } from "@/prisma/db";
import type { LarpType } from "@/prisma/enums";
import type { SqlQuery } from "@/prisma/sql";
import type { SearchQuery } from "./searchQuery";

export interface SearchReader {
  db: typeof db;
  query: <Row extends QueryResultRow>(q: SqlQuery) => Promise<Row[]>;
}

export interface Paging {
  limit: number;
  offset?: number;
}

export interface SearchResults<T> {
  total: number;
  results: T[];
}

const weights = ["A", "B", "C", "D"];

/**
 * The search document of a `@@fullTextIndex` in `contract.prisma`. It must render the same
 * expression as the index declared over these columns with this configuration, or Postgres
 * silently stops using the index; `search.integration.test.ts` checks that it does.
 */
function searchDocument(config: string, columns: readonly string[]): string {
  return columns
    .map(
      (column, index) =>
        `setweight(to_tsvector('${config}', coalesce("${column}", '')), '${weights[index]}')`,
    )
    .join(" || ");
}

/** The `@@fullTextIndex` declarations of `Larp`, one partial index per larp language. */
const larpColumns = ["name", "tagline", "description", "fluff_text"];
const larpConfigs = [
  { language: "fi", config: "finnish" },
  { language: "en", config: "english" },
  { language: "sv", config: "swedish" },
  { language: "OTHER", config: "simple" },
] as const;

/** The `@@fullTextIndex` declarations of `Page` and `Command`, one per UI language. */
const uiLanguageConfigs: Record<SupportedLanguage, string> = {
  fi: "finnish",
  en: "english",
};
const pageColumns = ["title", "ingress", "content"];
const commandColumns = ["label", "synonyms"];

const excludedPageSlugs = [frontPageSlug, seeAlsoSlug];

/** Ids of the matching larps, best first; upcoming larps lead among equally ranked ones. */
export async function searchLarpIds(
  reader: SearchReader,
  query: SearchQuery,
  { limit, offset = 0 }: Paging,
): Promise<SearchResults<string>> {
  if (!query.tsquery) return { total: 0, results: [] };

  const branches = larpConfigs.map(({ language, config }) => {
    const document = searchDocument(config, larpColumns);
    const tsquery = `to_tsquery('${config}', $1)`;
    return `
      select
        id,
        ts_rank(${document}, ${tsquery}) as rank,
        coalesce(coalesce(ends_at, starts_at) >= current_date, false) as upcoming,
        starts_at
      from larp
      where language = '${language}' and ${document} @@ ${tsquery}
    `;
  });
  const [row] = await reader.query<{ total: string; ids: string[] }>({
    text: `
      with matches as (${branches.join(" union all ")})
      select
        (select count(*) from matches) as total,
        array(
          select id
          from matches
          order by rank desc, upcoming desc, starts_at desc nulls last, id
          limit $2 offset $3
        )::text[] as ids
    `,
    values: [query.tsquery, limit, offset],
  });
  return { total: parseInt(row.total, 10), results: row.ids };
}

export async function searchLarps(
  reader: SearchReader,
  query: SearchQuery,
  paging: Paging,
): Promise<SearchResults<LarpRowLarp>> {
  const { total, results: ids } = await searchLarpIds(reader, query, paging);
  if (ids.length === 0) return { total, results: [] };

  const larps = parseDates(
    await reader.db.orm.public.Larp.where((l) => l.id.in(ids))
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
      )
      .include("municipality", (m) => m.select("nameFi"))
      .all(),
  );
  const larpsById = new Map(larps.map((larp) => [larp.id, larp]));
  return {
    total,
    results: ids.flatMap((id) => larpsById.get(id) ?? []),
  };
}

export interface LarpSearchResult {
  id: string;
  href: string;
  name: string;
  language: string;
  dateLabel: string;
  municipality: string | null;
  type: LarpType;
  past: boolean;
  pill: SignupPillState | null;
}

/** A larp as the command palette shows it; all of it is serializable for the client. */
export function toLarpSearchResult(
  larp: LarpRowLarp,
  locale: string,
  now: Date,
): LarpSearchResult {
  const endsAt = ensureEndsAt(larp);
  const past = !!endsAt && endsAt < now;
  const startYear = larp.startsAt ? parseInt(larp.startsAt.slice(0, 4)) : 0;
  const dateLabel =
    startYear === now.getFullYear()
      ? formatShortDateRange(larp.startsAt, larp.endsAt, locale)
      : formatDateRange(larp.startsAt, larp.endsAt, locale);
  return {
    id: larp.id,
    href: getLarpHref(larp),
    name: typesetDashes(larp.name),
    language: larp.language,
    dateLabel,
    municipality: larp.municipality?.nameFi ?? null,
    type: larp.type,
    past,
    pill: past ? null : getSignupPillState(larp),
  };
}

export interface PageSearchResult {
  slug: string;
  language: string;
  title: string;
  ingress: string;
}

/** Content pages in the UI language, except the ones that only make sense where they are shown. */
export async function searchPages(
  reader: SearchReader,
  query: SearchQuery,
  language: SupportedLanguage,
  { limit, offset = 0 }: Paging,
): Promise<SearchResults<PageSearchResult>> {
  if (!query.tsquery) return { total: 0, results: [] };

  const config = uiLanguageConfigs[language];
  const document = searchDocument(config, pageColumns);
  const tsquery = `to_tsquery('${config}', $1)`;
  const [row] = await reader.query<{
    total: string;
    results: PageSearchResult[];
  }>({
    text: `
      with matches as (
        select slug, language, title, ingress, ts_rank(${document}, ${tsquery}) as rank
        from page
        where
          language = '${language}'
          and ${document} @@ ${tsquery}
          and slug <> all($2::text[])
      )
      select
        (select count(*) from matches) as total,
        coalesce(
          (
            select json_agg(
              json_build_object(
                'slug', slug, 'language', language, 'title', title, 'ingress', ingress
              )
              order by rank desc, title, slug
            )
            from (
              select * from matches order by rank desc, title, slug limit $3 offset $4
            ) shown
          ),
          '[]'
        ) as results
    `,
    values: [query.tsquery, excludedPageSlugs, limit, offset],
  });
  return { total: parseInt(row.total, 10), results: row.results };
}

export interface CommandSearchResult {
  action: string;
  label: string;
}

export async function searchCommands(
  reader: SearchReader,
  query: SearchQuery,
  language: SupportedLanguage,
  { limit, offset = 0 }: Paging,
): Promise<SearchResults<CommandSearchResult>> {
  if (!query.tsquery) return { total: 0, results: [] };

  const config = uiLanguageConfigs[language];
  const document = searchDocument(config, commandColumns);
  const tsquery = `to_tsquery('${config}', $1)`;
  const rows = await reader.query<CommandSearchResult & { total: string }>({
    text: `
      select action, label, count(*) over () as total
      from command
      where language = '${language}' and ${document} @@ ${tsquery}
      order by ts_rank(${document}, ${tsquery}) desc, label, action
      limit $2 offset $3
    `,
    values: [query.tsquery, limit, offset],
  });
  return {
    total: rows.length > 0 ? parseInt(rows[0].total, 10) : 0,
    results: rows.map(({ action, label }) => ({ action, label })),
  };
}
