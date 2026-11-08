import { parseDates } from "@/prisma/dates";
import { dbRead } from "@/prisma/db";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";

import {
  findLarpByAliasRedirect,
  larpIdOrAliasFilter,
  type LarpIdOrAliasFilter,
} from "@/models/Larp";

import { larpToApi } from "../helpers";

interface Params {
  larpId: string;
}

function loadLarp(filter: LarpIdOrAliasFilter) {
  return dbRead.orm.public.Larp.select(
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

  let larpRow = await loadLarp(filter);
  if (!larpRow && "alias" in filter) {
    const target = await findLarpByAliasRedirect(filter.alias, dbRead);
    if (target) larpRow = await loadLarp({ id: target.id });
  }

  if (!larpRow) {
    notFound();
  }

  const { cancelledAt, ...rest } = parseDates(larpRow);

  return NextResponse.json(
    larpToApi({ ...rest, isCancelled: cancelledAt !== null }),
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
