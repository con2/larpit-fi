import { auth } from "@/auth";
import {
  getUserFromSession,
  isGmOrModerator,
  localSignupRoles,
} from "@/models/User";
import prisma from "@/prisma";
import { NextResponse } from "next/server";
import { validate as validateUuid } from "uuid";

interface Params {
  larpId: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> },
) {
  const { larpId } = await params;

  if (!validateUuid(larpId)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const session = await auth();
  const user = await getUserFromSession(session);

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    select: {
      id: true,
      name: true,
      relatedUsers: { select: { userId: true, role: true } },
    },
  });

  if (!larp) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isGmOrModerator(user, larp)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const relatedUsers = await prisma.relatedUser.findMany({
    where: { larpId },
    select: {
      role: true,
      visibility: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
    orderBy: [{ createdAt: "asc" }],
  });

  const unauthSignups = await prisma.unauthenticatedSignup.findMany({
    where: { larpId, verifiedAt: { not: null } },
    select: {
      displayName: true,
      email: true,
      signupStatus: true,
      visibility: true,
      verifiedAt: true,
    },
    orderBy: [{ verifiedAt: "asc" }],
  });

  const rows: string[][] = [
    ["Name", "Email", "Role", "Visibility", "Signed up at"],
  ];

  for (const entry of relatedUsers) {
    const isLocalSignupRole = (localSignupRoles as readonly string[]).includes(
      entry.role,
    );
    rows.push([
      entry.user.name ?? "",
      isLocalSignupRole ? (entry.user.email ?? "") : "",
      entry.role,
      entry.visibility,
      entry.createdAt.toISOString(),
    ]);
  }

  for (const signup of unauthSignups) {
    rows.push([
      signup.displayName,
      signup.email,
      signup.signupStatus,
      signup.visibility,
      signup.verifiedAt!.toISOString(),
    ]);
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const filename = `${larp.name.replace(/[^a-zA-Z0-9-_]/g, "_")}_participants.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
