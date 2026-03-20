import prisma from "@/prisma";
import { NextResponse } from "next/server";
import { larpToApi } from "./helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const updatedAfterParam = searchParams.get("updatedAfter");

  let updatedAfter: Date | undefined;
  if (updatedAfterParam) {
    const parsed = new Date(updatedAfterParam);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid updatedAfter value" }, { status: 400 });
    }
    updatedAfter = parsed;
  }

  const larps = await prisma.larp.findMany({
    where: updatedAfter ? { updatedAt: { gt: updatedAfter } } : undefined,
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
    orderBy: [{ startsAt: { sort: "desc", nulls: "last" } }],
  });

  const response = larps.map(larpToApi);

  return NextResponse.json(response);
}
