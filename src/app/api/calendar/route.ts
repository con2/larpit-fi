import { renderLarpCalendar } from "@/models/LarpCalendar";
import { parseDates } from "@/prisma/dates";
import { dbRead } from "@/prisma/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") === "fi" ? "fi" : "en";

  const larps = parseDates(
    await dbRead.orm.public.Larp.where((l) => l.startsAt.isNotNull())
      .select(
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
      .orderBy((l) => l.startsAt.desc())
      .all(),
  );

  return new Response(
    renderLarpCalendar(larps, { locale, calendarName: "Larp.fi" }),
    {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="larpit.ics"',
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
