import prisma from "@/prisma";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { validate as uuidValidate } from "uuid";
import { larpToApi } from "../helpers";

interface Params {
  larpId: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> }
) {
  const { larpId } = await params;

  // avoid 500 on invalid UUID
  if (!uuidValidate(larpId)) {
    notFound();
  }

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
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
      fluffText: true,
      description: true,
      links: { select: { href: true, type: true, title: true } },
    },
  });

  if (!larp) {
    notFound();
  }

  return NextResponse.json(larpToApi(larp));
}
