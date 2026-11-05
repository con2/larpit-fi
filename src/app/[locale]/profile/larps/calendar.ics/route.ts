import { auth } from "@/auth";
import { renderLarpCalendar } from "@/models/LarpCalendar";
import { getUserFromSession } from "@/models/User";
import { getTranslations } from "@/translations";
import { filterOwnLarps, loadOwnLarps, parseOwnLarpsFilter } from "../ownLarps";

/**
 * A one-off download for the signed-in user. Calendar apps subscribing to a feed send no session
 * cookie, so a subscribable per-user feed would need a token of its own.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const user = await getUserFromSession(await auth());
  if (!user) return new Response("Unauthorized", { status: 401 });

  const filter = parseOwnLarpsFilter(
    new URL(request.url).searchParams.get("show"),
  );
  const larps = filterOwnLarps(await loadOwnLarps(user.id), filter);
  const t = getTranslations(locale).OwnLarpsPage;

  return new Response(
    renderLarpCalendar(larps, { locale, calendarName: t.calendarName }),
    {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="my-larps.ics"',
        "Cache-Control": "private, no-store",
      },
    },
  );
}
