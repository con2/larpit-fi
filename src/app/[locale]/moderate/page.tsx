import Link from "next/link";

import CompactRow from "@/components/ui/CompactRow";
import ModerationQueueRow from "@/components/moderation/ModerationQueueRow";
import { requestCreatedAt } from "@/components/moderation/requestDisplay";
import { formatShortDateRange } from "@/helpers/dates";
import { typesetDashes } from "@/helpers/larpName";
import {
  countPendingVerification,
  getOpenRequests,
  getRecentlyResolved,
  isOpenStatus,
  openStatuses,
} from "@/models/ModerationQueue";
import { EditStatus } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import HandledNotice from "./HandledNotice";
import ModerationTabs from "./ModerationTabs";
import { requireModerator } from "./requireModerator";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ handled?: string }>;
}

const recentlyResolvedCount = 5;

export default async function ModerationQueuePage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const { handled } = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.ModerationRequest;

  const moderator = await requireModerator(translations);
  if (!moderator.ok) return moderator.gate;
  const { user } = moderator;

  const [requests, pendingVerification, recentlyResolved] = await Promise.all([
    getOpenRequests(user),
    countPendingVerification(user),
    getRecentlyResolved(user, recentlyResolvedCount),
  ]);
  const now = new Date();

  const oldestOpenByLarp = new Map<string, string>();
  for (const request of requests) {
    if (request.larpId && !oldestOpenByLarp.has(request.larpId)) {
      oldestOpenByLarp.set(request.larpId, request.id);
    }
  }

  const sections = openStatuses.map((status) => ({
    status,
    requests: requests.flatMap((request) =>
      request.status === status && isOpenStatus(request.status)
        ? [{ ...request, status }]
        : [],
    ),
  }));
  const [decisions, checks] = sections.map(
    (section) => section.requests.length,
  );

  return (
    <div className="lf-container">
      <ModerationTabs
        current="open"
        title={t.listTitle}
        openCount={decisions + checks}
        messages={t}
        lede={<p className="lf-lede">{t.queue.lede(decisions, checks)}</p>}
      >
        {pendingVerification > 0 && (
          <p className="lf-muted small mb-0">
            <Link
              href={`/moderate/all?status=${EditStatus.PENDING_VERIFICATION}`}
              className="lf-link-quiet"
            >
              {t.queue.pendingVerification(pendingVerification)}
            </Link>
          </p>
        )}
      </ModerationTabs>

      <div className="lf-main-aside">
        <div>
          <HandledNotice requestId={handled} messages={t} />
          {sections.map(({ status, requests }) => {
            const sectionT = t.queue.sections[status];
            const headingId = `ModerationQueue-${status}`;
            return (
              <section
                key={status}
                className={`lf-section lf-mod-queue lf-mod-queue--${status === EditStatus.VERIFIED ? "decision" : "check"}`}
                aria-labelledby={headingId}
              >
                <div className="lf-section-heading">
                  <h2 className="lf-heading" id={headingId}>
                    {sectionT.title}{" "}
                    <span className="lf-count">{requests.length}</span>
                  </h2>
                </div>
                <p className="lf-help mt-2 mb-0">{sectionT.description}</p>
                {requests.length === 0 ? (
                  <p className="lf-empty mt-3">{sectionT.empty}</p>
                ) : (
                  requests.map((request) => (
                    <ModerationQueueRow
                      key={request.id}
                      request={request}
                      hasOlderOpen={
                        !!request.larpId &&
                        oldestOpenByLarp.get(request.larpId) !== request.id
                      }
                      now={now}
                      locale={locale}
                      messages={t}
                      larpMessages={translations.Larp}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>

        <aside>
          <section aria-labelledby="ModerationQueue-recentlyResolved">
            <h2
              id="ModerationQueue-recentlyResolved"
              className="lf-label lf-sidebar-heading"
            >
              {t.queue.recentlyResolved}
            </h2>
            <div className="lf-compact-list">
              {recentlyResolved.map((request) => (
                <CompactRow
                  key={request.id}
                  href={`/moderate/${request.id}`}
                  date={formatShortDateRange(
                    request.resolvedAt ?? requestCreatedAt(request.id),
                    null,
                    locale,
                  )}
                  name={
                    request.name
                      ? typesetDashes(request.name)
                      : t.attributes.name.unknown
                  }
                  sub={`${t.attributes.status.choices[request.status].title} · ${t.actionLabels[request.action]}`}
                />
              ))}
            </div>
            <Link href="/moderate/resolved" className="lf-more-link d-block">
              {t.queue.allResolved} →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
