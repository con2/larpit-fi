"use server";

import { toSupportedLanguage } from "@/i18n/locales";
import { getReader } from "@/prisma/reader";
import { allowSearch } from "@/search/rateLimit";
import {
  type CommandSearchResult,
  type LarpSearchResult,
  type PageSearchResult,
  searchCommands,
  searchLarps,
  searchPages,
  type SearchResults,
  toLarpSearchResult,
} from "@/search/search";
import { parseSearchQuery } from "@/search/searchQuery";

export type PaletteSearchResults =
  | {
      rateLimited?: false;
      larps: SearchResults<LarpSearchResult>;
      pages: SearchResults<PageSearchResult>;
      commands: CommandSearchResult[];
    }
  | { rateLimited: true };

const larpLimit = 8;
const pageLimit = 3;
const commandLimit = 20;

/** A query starting with `>` searches commands only. */
export async function searchPalette(
  rawQuery: string,
  locale: string,
): Promise<PaletteSearchResults> {
  if (!(await allowSearch())) return { rateLimited: true };

  const commandsOnly = rawQuery.trimStart().startsWith(">");
  const query = parseSearchQuery(
    commandsOnly ? rawQuery.trimStart().slice(1) : rawQuery,
  );
  const language = toSupportedLanguage(locale);
  const reader = await getReader();
  const none = { total: 0, results: [] };

  const [larps, pages, commands] = await Promise.all([
    commandsOnly ? none : searchLarps(reader, query, { limit: larpLimit }),
    commandsOnly
      ? none
      : searchPages(reader, query, language, { limit: pageLimit }),
    searchCommands(reader, query, language, { limit: commandLimit }),
  ]);
  const now = new Date();
  return {
    larps: {
      total: larps.total,
      results: larps.results.map((larp) =>
        toLarpSearchResult(larp, language, now),
      ),
    },
    pages,
    commands: commands.results,
  };
}
