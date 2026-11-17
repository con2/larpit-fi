import Link from "next/link";

import { FormattedDate } from "@/components/FormattedDates";
import { typesetDashes } from "@/helpers/larpName";
import {
  type OpenRequest,
  type OpenStatus,
  summarizeRequest,
} from "@/models/ModerationQueue";
import { RelatedUserRole } from "@/prisma/enums";
import type { Translations } from "@/translations/en";

import {
  DotSeparated,
  requestAgeDays,
  requestCreatedAt,
  requestLarpName,
  Separated,
  SummaryChips,
} from "./requestDisplay";

/** Roles that say something about how well a submitter knows the larp, strongest first. */
const standingRoles: RelatedUserRole[] = [
  RelatedUserRole.GAME_MASTER,
  RelatedUserRole.TEAM_MEMBER,
  RelatedUserRole.CREATED_BY,
  RelatedUserRole.VOLUNTEER,
  RelatedUserRole.PLAYER,
];

/** The strongest role the submitter already holds in the larp, if any. */
export function submitterStanding(
  request: Pick<OpenRequest, "submitterId"> & {
    larp: { relatedUsers: { userId: string; role: RelatedUserRole }[] } | null;
  },
): RelatedUserRole | null {
  if (!request.submitterId || !request.larp) return null;
  const held = new Set(
    request.larp.relatedUsers
      .filter((related) => related.userId === request.submitterId)
      .map((related) => related.role),
  );
  return standingRoles.find((role) => held.has(role)) ?? null;
}

interface Props {
  request: OpenRequest & { status: OpenStatus };
  hasOlderOpen: boolean;
  now: Date;
  locale: string;
  messages: Translations["ModerationRequest"];
  larpMessages: Translations["Larp"];
}

export default function ModerationQueueRow({
  request,
  hasOlderOpen,
  now,
  locale,
  messages: t,
  larpMessages: larpT,
}: Props) {
  const summary = summarizeRequest(request);
  const name = requestLarpName(request);
  const standing = submitterStanding(request);
  const href = `/moderate/${request.id}`;

  return (
    <div className="lf-row lf-mod-row">
      <div className="lf-mod-row__age">
        <span className="lf-data">
          {t.queue.age(requestAgeDays(request.id, now))}
        </span>
        <span className="lf-dim small">
          <FormattedDate locale={locale} date={requestCreatedAt(request.id)} />
        </span>
      </div>
      <div className="lf-row__main">
        <p className="lf-label">{t.actionLabels[request.action]}</p>
        <Link href={href} className="lf-row__title lf-link-quiet">
          {name ? typesetDashes(name) : <em>{t.attributes.name.unknown}</em>}
        </Link>
        <SummaryChips summary={summary} messages={t.chips} />
        <p className="lf-row__sub mb-0">
          <DotSeparated>
            {[
              request.submitterName,
              request.submitterId ? t.queue.signedIn : t.queue.notSignedIn,
              standing && larpT.clientAttributes.role.choices[standing],
              summary.fieldKeys.length > 0 && (
                <Separated key="fields" separator=", ">
                  {summary.fieldKeys.map((key) => larpT.attributes[key].title)}
                </Separated>
              ),
            ]}
          </DotSeparated>
        </p>
        {hasOlderOpen && (
          <p className="lf-mod-warning mb-0">{t.queue.olderOpen}</p>
        )}
      </div>
      <div className="lf-row__aside">
        <Link href={href} className="btn btn-sm btn-outline-primary">
          {t.queue.sections[request.status].button}
        </Link>
      </div>
    </div>
  );
}
