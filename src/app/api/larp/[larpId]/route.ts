import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { validate as uuidValidate } from "uuid";
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

  // avoid 500 on invalid UUID
  if (!uuidValidate(larpId)) {
    notFound();
  }

  const larpRow = await db.orm.public.Larp.select(
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
    .first({ id: larpId });

  if (!larpRow) {
    notFound();
  }

  const { cancelledAt, ...rest } = parseDates(larpRow);

  return NextResponse.json(
    larpToApi({ ...rest, isCancelled: cancelledAt !== null }),
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
