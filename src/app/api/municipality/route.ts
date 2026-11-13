import { NextResponse } from "next/server";

import { dbRead } from "@/prisma/db";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

// NOTE: Keep in sync with src/app/api/openapi.json/route.ts
export async function GET() {
  const items = await dbRead.orm.public.Municipality.select(
    "id",
    "nameFi",
    "nameSv",
    "nameOther",
    "nameOtherLanguageCode",
    "countryId",
    "lat",
    "long",
  )
    .orderBy((m) => m.id.asc())
    .all();
  return NextResponse.json({ items }, { headers: CORS_HEADERS });
}
