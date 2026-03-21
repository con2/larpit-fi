import prisma from "@/prisma";
import { NextResponse } from "next/server";
import { validate as uuidValidate } from "uuid";
import { larpToApi } from "./helpers";
import { LarpWhereInput } from "@/generated/prisma/models";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

/**
 * Cursor is base64url-encoded JSON: { s: number | null, i: string }
 * s = startsAt as unix timestamp in seconds (null if unset)
 * i = larp id (UUID)
 *
 * The sort order is startsAt DESC NULLS LAST, id ASC, so the cursor
 * encodes the position of the last returned item in that order.
 */
function encodeCursor(startsAt: Date | null, id: string): string {
  const s = startsAt !== null ? Math.floor(startsAt.getTime() / 1000) : null;
  return Buffer.from(JSON.stringify({ s, i: id })).toString("base64url");
}

function decodeCursor(
  cursor: string,
): { startsAt: Date | null; id: string } | null {
  try {
    const { s, i } = JSON.parse(Buffer.from(cursor, "base64url").toString());
    if (typeof i !== "string" || !uuidValidate(i)) return null;
    if (s !== null && !Number.isInteger(s)) return null;
    return { startsAt: s !== null ? new Date(s * 1000) : null, id: i };
  } catch {
    return null;
  }
}

// NOTE: Keep in sync with src/app/api-docs/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const updatedAfterParam = searchParams.get("updatedAfter");
  const limitParam = searchParams.get("limit");
  const afterParam = searchParams.get("after");

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

  let cursor: { startsAt: Date | null; id: string } | undefined;
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

  const conditions: LarpWhereInput[] = [];

  if (updatedAfter) {
    conditions.push({ updatedAt: { gt: updatedAfter } });
  }

  if (cursor) {
    if (cursor.startsAt !== null) {
      conditions.push({
        OR: [
          { startsAt: { lt: cursor.startsAt } },
          { AND: [{ startsAt: cursor.startsAt }, { id: { gt: cursor.id } }] },
          { startsAt: null },
        ],
      });
    } else {
      conditions.push({ AND: [{ startsAt: null }, { id: { gt: cursor.id } }] });
    }
  }

  const where: LarpWhereInput | undefined =
    conditions.length > 0 ? { AND: conditions } : undefined;

  const larps = await prisma.larp.findMany({
    where,
    select: {
      id: true,
      alias: true,
      name: true,
      type: true,
      language: true,
      tagline: true,
      openness: true,
      startsAt: true,
      endsAt: true,
      signupStartsAt: true,
      signupEndsAt: true,
      locationText: true,
      municipality: { select: { nameFi: true } },
      numPlayerCharacters: true,
      numTotalParticipants: true,
      updatedAt: true,
    },
    orderBy: [{ startsAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    take: limit !== undefined ? limit + 1 : undefined,
  });

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
