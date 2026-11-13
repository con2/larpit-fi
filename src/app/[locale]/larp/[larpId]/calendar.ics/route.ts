import { publicUrl } from "@/config";
import { findLarpRedirect } from "@/models/Larp";
import { renderLarpCalendar } from "@/models/LarpCalendar";
import { parseDates } from "@/prisma/dates";
import { dbRead } from "@/prisma/db";
import { toSupportedLanguage } from "@/translations";
import { validate as validateUuid } from "uuid";

interface Context {
  params: Promise<{ locale: string; larpId: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { locale, larpId } = await params;
  if (!validateUuid(larpId)) {
    return new Response("Not found", { status: 404 });
  }

  const row = await dbRead.orm.public.Larp.select(
    "id",
    "alias",
    "name",
    "tagline",
    "startsAt",
    "endsAt",
    "locationText",
    "updatedAt",
    "cancelledAt",
    "updateCount",
  )
    .include("municipality", (m) => m.select("nameFi"))
    .first({ id: larpId });
  if (!row) {
    const redirectTarget = await findLarpRedirect(larpId, dbRead);
    if (redirectTarget) {
      return Response.redirect(
        `${publicUrl}/larp/${redirectTarget.id}/calendar.ics`,
        308,
      );
    }
  }
  const larp = row && parseDates(row);
  if (!larp?.startsAt) {
    return new Response("Not found", { status: 404 });
  }

  const filename = `${larp.alias ?? larp.id}.ics`;

  return new Response(
    renderLarpCalendar([larp], {
      locale: toSupportedLanguage(locale),
      calendarName: larp.name,
    }),
    {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
