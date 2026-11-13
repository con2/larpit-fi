import { NextResponse } from "next/server";

import { dbRead } from "@/prisma/db";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

// NOTE: Keep in sync with src/app/api/openapi.json/route.ts
export async function GET() {
  const items = await dbRead.orm.public.Country.select(
    "id",
    "code",
    "nameFi",
    "nameSv",
    "nameEn",
  )
    .orderBy((c) => c.id.asc())
    .all();
  return NextResponse.json({ items }, { headers: CORS_HEADERS });
}
