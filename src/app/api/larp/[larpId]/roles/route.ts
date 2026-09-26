import { auth } from "@/auth";
import {
  getUserFromSession,
  isGmOrModerator,
  localSignupRoles,
} from "@/models/User";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
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

  const larp = await db.orm.public.Larp.select("id", "name")
    .include("relatedUsers", (r) => r.select("userId", "role"))
    .first({ id: larpId });

  if (!larp) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isGmOrModerator(user, larp)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const relatedUsers = parseDates(
    await db.orm.public.RelatedUser.where({ larpId })
      .select("role", "visibility", "createdAt")
      .include("user", (u) => u.select("name", "email"))
      .orderBy((r) => r.createdAt.asc())
      .all(),
  );

  const unauthSignups = parseDates(
    await db.orm.public.UnauthenticatedSignup.where({ larpId })
      .where((s) => s.verifiedAt.isNotNull())
      .select(
        "displayName",
        "email",
        "signupStatus",
        "visibility",
        "verifiedAt",
      )
      .orderBy((s) => s.verifiedAt.asc())
      .all(),
  );

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
