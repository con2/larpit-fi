import { parseDates } from "@/prisma/dates";
import { dbRead } from "@/prisma/db";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import { larpIdOrAliasFilter } from "@/models/Larp";

import { larpToApi } from "../helpers";

interface Params {
  larpId: string;
}

// NOTE: Keep in sync with src/app/api/openapi.json/route.ts
export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> },
) {
  const { larpId } = await params;

  const filter = larpIdOrAliasFilter(larpId);
  if (!filter) {
    notFound();
  }

  const larpRow = await dbRead.orm.public.Larp.select(
    "id",
    "alias",
    "name",
    "tagline",
    "type",
    "openness",
    "startsAt",
    "endsAt",
    "signupStartsAt",
    "signupEndsAt",
    "locationText",
    "language",
    "numPlayerCharacters",
    "numTotalParticipants",
    "cancelledAt",
    "updatedAt",
    "fluffText",
    "description",
  )
    .include("municipality", (m) => m.select("nameFi"))
    .include("links", (l) => l.select("href", "type", "title"))
    .first(filter);

  if (!larpRow) {
    notFound();
  }

  const { cancelledAt, ...rest } = parseDates(larpRow);

  return NextResponse.json(
    larpToApi({ ...rest, isCancelled: cancelledAt !== null }),
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
