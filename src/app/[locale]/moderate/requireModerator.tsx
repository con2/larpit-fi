import type { ReactNode } from "react";

import { auth } from "@/auth";
import {
  AccessDeniedPage,
  LoginRequiredPage,
  gateActions,
} from "@/components/GatePage";
import { canModerate, getUserFromSession } from "@/models/User";
import type { Translations } from "@/translations/en";

type Moderator = NonNullable<Awaited<ReturnType<typeof getUserFromSession>>>;

/** The signed-in moderator, or the gate page to show anyone else. */
export async function requireModerator(
  translations: Translations,
): Promise<{ ok: true; user: Moderator } | { ok: false; gate: ReactNode }> {
  const gate = gateActions(translations);
  const user = await getUserFromSession(await auth());
  if (!user) {
    return {
      ok: false,
      gate: (
        <LoginRequiredPage
          messages={translations.LoginRequired}
          actions={[gate.frontPage]}
        />
      ),
    };
  }
  if (!canModerate(user)) {
    return {
      ok: false,
      gate: (
        <AccessDeniedPage
          messages={translations.ModeratorRequired}
          actions={[gate.frontPage, gate.contact]}
        />
      ),
    };
  }
  return { ok: true, user };
}
