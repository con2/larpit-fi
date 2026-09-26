import { NextResponse } from "next/server";
import { validate as uuidValidate } from "uuid";

import { iso, parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { pool } from "@/prisma/pool";
import { larpToApi } from "./helpers";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Cursor is base64url-encoded JSON: { s: string | null, i: string }
 * s = startsAt as an ISO date (null if unset)
 * i = larp id (UUID)
 *
 * The sort order is startsAt DESC NULLS LAST, id ASC, so the cursor
 * encodes the position of the last returned item in that order.
 */
function encodeCursor(startsAt: string | null, id: string): string {
  return Buffer.from(JSON.stringify({ s: startsAt, i: id })).toString(
    "base64url",
  );
}

function decodeCursor(
  cursor: string,
): { startsAt: string | null; id: string } | null {
  try {
    const { s, i } = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (typeof i !== "string" || !uuidValidate(i)) return null;
    if (s !== null && !(typeof s === "string" && isoDate.test(s))) return null;
    return { startsAt: s, id: i };
  } catch {
    return null;
  }
}

/**
 * The page is keyed by (startsAt desc nulls last, id asc). NULLS LAST is not expressible in the
 * ORM's `orderBy`, so the ids are paged in SQL and the rows loaded afterwards in that order. Fold
 * this back into one ORM query once the ORM grows a nulls option (see `helpers/sort.ts`).
 */
async function pageOfLarpIds(
  updatedAfter: Date | undefined,
  cursor: { startsAt: string | null; id: string } | undefined,
  limit: number | undefined,
): Promise<string[]> {
  const params: unknown[] = [];
  const param = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };
  const conditions: string[] = [];

  if (updatedAfter) {
    conditions.push(`updated_at > ${param(iso(updatedAfter))}`);
  }

  if (cursor) {
    if (cursor.startsAt !== null) {
      const startsAt = param(cursor.startsAt);
      conditions.push(
        `(starts_at < ${startsAt} or (starts_at = ${startsAt} and id > ${param(cursor.id)}) or starts_at is null)`,
      );
    } else {
      conditions.push(`(starts_at is null and id > ${param(cursor.id)})`);
    }
  }

  const text = [
    "select id from larp",
    conditions.length > 0 ? `where ${conditions.join(" and ")}` : "",
    "order by starts_at desc nulls last, id asc",
    limit !== undefined ? `limit ${param(limit + 1)}` : "",
  ].join(" ");
  const result = await pool.query<{ id: string }>(text, params);
  return result.rows.map((row) => row.id);
}

async function loadLarps(ids: string[], includeLinks: boolean) {
  const larps = db.orm.public.Larp.where((l) => l.id.in(ids))
    .select(
      "id",
      "alias",
      "name",
      "type",
      "language",
      "tagline",
      "openness",
      "startsAt",
      "endsAt",
      "signupStartsAt",
      "signupEndsAt",
      "locationText",
      "numPlayerCharacters",
      "numTotalParticipants",
      "updatedAt",
    )
    .include("municipality", (m) => m.select("nameFi"));
  const rows = parseDates(
    includeLinks
      ? await larps
          .include("links", (l) => l.select("href", "type", "title"))
          .all()
      : await larps.all(),
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)!);
}

// NOTE: Keep in sync with src/app/api/openapi.json/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const updatedAfterParam = searchParams.get("updatedAfter");
  const limitParam = searchParams.get("limit");
  const afterParam = searchParams.get("after");
  const includeParam = searchParams.get("include");

  let updatedAfter: Date | undefined;
  if (updatedAfterParam) {
    const parsed = new Date(updatedAfterParam);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "Invalid updatedAfter value" },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    updatedAfter = parsed;
  }

  let includeLinks = false;
  if (includeParam) {
    for (const include of includeParam.split(",")) {
      if (include === "links") {
        includeLinks = true;
      } else {
        return NextResponse.json(
          { error: "Invalid include value" },
          { status: 400, headers: CORS_HEADERS },
        );
      }
    }
  }

  let limit: number | undefined;
  if (limitParam !== null) {
    const parsed = parseInt(limitParam, 10);
    if (isNaN(parsed) || parsed < 1) {
      return NextResponse.json(
        { error: "Invalid limit value" },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    limit = parsed;
  }

  let cursor: { startsAt: string | null; id: string } | undefined;
  if (afterParam !== null) {
    const decoded = decodeCursor(afterParam);
    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid after value" },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    cursor = decoded;
  }

  const ids = await pageOfLarpIds(updatedAfter, cursor, limit);
  const larps = ids.length > 0 ? await loadLarps(ids, includeLinks) : [];

  const hasMore = limit !== undefined && larps.length > limit;
  const items = hasMore ? larps.slice(0, limit) : larps;

  let nextCursor: string | null = null;
  if (hasMore) {
    const last = items[items.length - 1];
    nextCursor = encodeCursor(last.startsAt, last.id);
  }

  return NextResponse.json(
    { items: items.map(larpToApi), nextCursor },
    { headers: CORS_HEADERS },
  );
}
