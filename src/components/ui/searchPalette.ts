"use server";

import { toSupportedLanguage } from "@/i18n/locales";
import { getTagsWithCounts } from "@/models/Tag";
import { otherTagName, tagMatches, tagName } from "@/models/Tag.client";
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
      tags: TagSearchResult[];
    }
  | { rateLimited: true };

export interface TagSearchResult {
  slug: string;
  name: string;
  otherName: string;
  larpCount: number;
}

const larpLimit = 8;
const tagLimit = 5;
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

  const [larps, pages, commands, tags] = await Promise.all([
    commandsOnly ? none : searchLarps(reader, query, { limit: larpLimit }),
    commandsOnly
      ? none
      : searchPages(reader, query, language, { limit: pageLimit }),
    searchCommands(reader, query, language, { limit: commandLimit }),
    commandsOnly ? [] : getTagsWithCounts(reader),
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
    tags: tags
      .filter((tag) => query.text && tagMatches(tag, query.text))
      .sort((a, b) => b.larpCount - a.larpCount)
      .slice(0, tagLimit)
      .map((tag) => ({
        slug: tag.slug,
        name: tagName(tag, language),
        otherName: otherTagName(tag, language),
        larpCount: tag.larpCount,
      })),
  };
}
