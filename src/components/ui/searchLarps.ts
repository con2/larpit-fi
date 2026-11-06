"use server";

import { ensureEndsAt, getLarpHref } from "@/models/Larp.client";
import { parseDates } from "@/prisma/dates";
import { LarpType } from "@/prisma/enums";
import { sql } from "@/prisma/sql";
import { formatShortDateRange } from "@/helpers/dates";
import { formatDateRange } from "@/helpers/dates";
import { getSignupPillState, type SignupPillState } from "./signupPillState";
import { typesetDashes } from "@/helpers/larpName";
import { getReader } from "@/prisma/reader";

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

export interface LarpSearchResults {
  total: number;
  results: LarpSearchResult[];
}

const resultLimit = 8;
const maxQueryLength = 100;

function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Prefix or substring match over name, alias, municipality and year. Upcoming larps come first,
 * soonest first, then past larps most recent first; within each, name prefix matches lead.
 */
export async function searchLarps(
  rawQuery: string,
  locale: string,
): Promise<LarpSearchResults> {
  const term = rawQuery.trim().slice(0, maxQueryLength);
  if (!term) return { total: 0, results: [] };

  const contains = `%${escapeLike(term)}%`;
  const prefix = `${escapeLike(term)}%`;
  const year = /^\d{4}$/.test(term) ? parseInt(term, 10) : null;

  const { db: reader, query: readQuery } = await getReader();
  const rows = await readQuery<{ id: string; total: string }>(sql`
    select
      l.id,
      count(*) over () as total
    from
      larp l
      left join municipality m on m.id = l.municipality_id
    where
      l.name ilike ${contains}
      or l.alias ilike ${contains}
      or m.name_fi ilike ${contains}
      or m.name_sv ilike ${contains}
      or extract(year from l.starts_at) = ${year}::int
    order by
      coalesce(l.ends_at, l.starts_at) >= current_date desc nulls last,
      l.name ilike ${prefix} desc,
      case when coalesce(l.ends_at, l.starts_at) >= current_date then l.starts_at end asc,
      l.starts_at desc nulls last
    limit ${resultLimit}
  `);

  if (rows.length === 0) return { total: 0, results: [] };

  const ids = rows.map((row) => row.id);
  const larps = parseDates(
    await reader.orm.public.Larp.where((l) => l.id.in(ids))
      .include("municipality", (m) => m.select("nameFi"))
      .all(),
  );
  const larpsById = new Map(larps.map((larp) => [larp.id, larp]));
  const now = new Date();
  const currentYear = now.getFullYear();

  const results = ids.flatMap((id) => {
    const larp = larpsById.get(id);
    if (!larp) return [];
    const endsAt = ensureEndsAt(larp);
    const past = !!endsAt && endsAt < now;
    const startYear = larp.startsAt ? parseInt(larp.startsAt.slice(0, 4)) : 0;
    const dateLabel =
      startYear === currentYear
        ? formatShortDateRange(larp.startsAt, larp.endsAt, locale)
        : formatDateRange(larp.startsAt, larp.endsAt, locale);

    return [
      {
        id: larp.id,
        href: getLarpHref(larp),
        name: typesetDashes(larp.name),
        language: larp.language,
        dateLabel,
        municipality: larp.municipality?.nameFi ?? null,
        type: larp.type,
        past,
        pill: past ? null : getSignupPillState(larp),
      },
    ];
  });

  return { total: parseInt(rows[0].total, 10), results };
}
