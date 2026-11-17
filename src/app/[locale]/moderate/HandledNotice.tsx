import Link from "next/link";

import { requestLarpName } from "@/components/moderation/requestDisplay";
import { typesetDashes } from "@/helpers/larpName";
import { getLarpHref } from "@/models/Larp.client";
import { isOpenStatus } from "@/models/ModerationQueue";
import { db } from "@/prisma/db";
import type { Translations } from "@/translations/en";

interface Props {
  requestId: string | undefined;
  messages: Translations["ModerationRequest"];
}

/** Confirms the request a moderator just handled, after the redirect to the next one. */
export default async function HandledNotice({ requestId, messages: t }: Props) {
  if (!requestId || !/^[0-9a-f-]{36}$/i.test(requestId)) return null;

  const request = await db.orm.public.ModerationRequest.select(
    "status",
    "newContent",
  )
    .include("larp", (larp) => larp.select("id", "name", "alias"))
    .first({ id: requestId });
  if (!request || isOpenStatus(request.status)) return null;

  const name = requestLarpName(request) ?? t.detail.unknownLarp;
  return (
    <p className="lf-notice lf-mod-handled" role="status">
      {t.detail.handled(
        t.attributes.status.choices[request.status].title,
        typesetDashes(name),
      )}
      {request.larp && (
        <>
          {" · "}
          <Link href={getLarpHref(request.larp)}>
            {t.detail.openHandledLarp}
          </Link>
        </>
      )}
    </p>
  );
}
