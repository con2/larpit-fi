import prisma from "@/prisma";
import { NextResponse } from "next/server";
import { larpToApi } from "./helpers";

export async function GET(_request: Request) {
  const larps = await prisma.larp.findMany({
    select: {
      id: true,
      alias: true,
      name: true,
      tagline: true,
      type: true,
      openness: true,
      startsAt: true,
      endsAt: true,
      signupStartsAt: true,
      signupEndsAt: true,
      locationText: true,
      municipality: { select: { nameFi: true } },
    },
    orderBy: [{ startsAt: { sort: "desc", nulls: "last" } }],
  });

  const response = larps.map(larpToApi);

  return NextResponse.json(response);
}
