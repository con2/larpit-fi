import { NextResponse } from "next/server";

import { getTagsWithCounts } from "@/models/Tag";
import { queryRead } from "@/prisma/sql";

const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

// NOTE: Keep in sync with src/app/api/openapi.json/route.ts
export async function GET() {
  const tags = await getTagsWithCounts({ query: queryRead });
  const items = tags
    .map(({ id: _id, ...tag }) => tag)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return NextResponse.json({ items }, { headers: CORS_HEADERS });
}
