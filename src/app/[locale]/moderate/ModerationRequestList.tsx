import Link from "next/link";

import FilterBar, {
  FilterGroup,
  type FilterOption,
} from "@/components/ui/FilterBar";
import { FormattedDate } from "@/components/FormattedDates";
import {
  DotSeparated,
  requestCreatedAt,
  StatusPill,
} from "@/components/moderation/requestDisplay";
import { typesetDashes } from "@/helpers/larpName";
import {
  canSeeDeleteRequests,
  countOpenRequests,
  getResolvedRequests,
} from "@/models/ModerationQueue";
import { EditAction, type EditStatus } from "@/prisma/enums";
import type { User } from "@/prisma/models";
import type { Translations } from "@/translations/en";

import ModerationTabs, { type ModerationTab } from "./ModerationTabs";

const pageSize = 50;
const reasonPreviewLength = 140;

interface Filters {
  status: EditStatus | null;
  action: EditAction | null;
  offset: number;
}

interface Props {
  tab: Exclude<ModerationTab, "open">;
  title: string;
  /** The statuses this list shows, which are also the options of its status filter. */
  statuses: EditStatus[];
  searchParams: { status?: string; action?: string; offset?: string };
  viewer: Pick<User, "role">;
  locale: string;
  messages: Translations["ModerationRequest"];
}

function parseFilters(
  searchParams: Props["searchParams"],
  statuses: EditStatus[],
  actions: EditAction[],
): Filters {
  const status =
    statuses.find((status) => status === searchParams.status) ?? null;
  const action =
    actions.find((action) => action === searchParams.action) ?? null;
  const offset = Number.parseInt(searchParams.offset ?? "");
  return { status, action, offset: offset > 0 ? offset : 0 };
}

function truncate(text: string, length: number) {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

/** Moderation requests of the given statuses, most recently resolved first, with filters. */
export default async function ModerationRequestList({
  tab,
  title,
  statuses,
  searchParams,
  viewer,
  locale,
  messages: t,
}: Props) {
  const actions: EditAction[] = [
    EditAction.CREATE,
    EditAction.UPDATE,
    ...(canSeeDeleteRequests(viewer) ? [EditAction.DELETE] : []),
    EditAction.MERGE,
  ];
  const filters = parseFilters(searchParams, statuses, actions);
  const basePath = `/moderate/${tab}`;

  function pageHref(changes: Partial<Filters>) {
    const { status, action, offset } = { ...filters, offset: 0, ...changes };
    const search = new URLSearchParams();
    if (status) search.set("status", status);
    if (action) search.set("action", action);
    if (offset) search.set("offset", String(offset));
    const queryString = search.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }

  const [{ requests, count }, openCounts] = await Promise.all([
    getResolvedRequests(
      viewer,
      {
        statuses: filters.status ? [filters.status] : statuses,
        action: filters.action,
      },
      filters.offset,
      pageSize,
    ),
    countOpenRequests(viewer),
  ]);

  const statusOptions: FilterOption[] = [
    {
      title: t.list.any,
      href: pageHref({ status: null }),
      current: filters.status === null,
    },
    ...statuses.map((status) => ({
      title: t.attributes.status.choices[status].title,
      href: pageHref({ status }),
      current: filters.status === status,
    })),
  ];
  const actionOptions: FilterOption[] = [
    {
      title: t.list.any,
      href: pageHref({ action: null }),
      current: filters.action === null,
    },
    ...actions.map((action) => ({
      title: t.actionLabels[action],
      href: pageHref({ action }),
      current: filters.action === action,
    })),
  ];

  return (
    <div className="lf-container">
      <ModerationTabs
        current={tab}
        title={title}
        openCount={openCounts.VERIFIED + openCounts.AUTO_APPROVED}
        messages={t}
      />
      <div className="py-4 d-flex flex-wrap gap-3 align-items-center justify-content-between">
        <FilterBar>
          <FilterGroup
            label={tab === "resolved" ? t.list.outcome : t.list.status}
            options={statusOptions}
            scroll={false}
          />
          <FilterGroup
            label={t.list.action}
            options={actionOptions}
            scroll={false}
          />
        </FilterBar>
        <span className="lf-data lf-dim">{t.list.count(count)}</span>
      </div>

      {requests.length === 0 ? (
        <p className="lf-empty">{t.list.empty}</p>
      ) : (
        <div>
          {requests.map((request) => (
            <div
              key={request.id}
              className="lf-row lf-row--compact-padding lf-mod-row"
            >
              <div className="lf-mod-row__age">
                <StatusPill status={request.status} messages={t} />
              </div>
              <div className="lf-row__main">
                <Link
                  href={`/moderate/${request.id}`}
                  className="lf-row__title lf-link-quiet"
                >
                  {request.name ? (
                    typesetDashes(request.name)
                  ) : (
                    <em>{t.attributes.name.unknown}</em>
                  )}
                </Link>
                <p className="lf-row__sub mb-0">
                  <DotSeparated>
                    {[
                      t.actionLabels[request.action],
                      request.submitterName,
                      request.resolvedByName &&
                        t.list.by(request.resolvedByName),
                      <FormattedDate
                        key="date"
                        locale={locale}
                        date={
                          request.resolvedAt ?? requestCreatedAt(request.id)
                        }
                      />,
                    ]}
                  </DotSeparated>
                </p>
                {request.resolvedMessage && (
                  <p className="lf-row__tagline mb-0">
                    {truncate(request.resolvedMessage, reasonPreviewLength)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <nav className="d-flex gap-3 py-4" aria-label={t.list.pagination.title}>
        {filters.offset > 0 && (
          <Link
            href={pageHref({ offset: Math.max(0, filters.offset - pageSize) })}
          >
            ← {t.list.pagination.previous}
          </Link>
        )}
        {filters.offset + pageSize < count && (
          <Link href={pageHref({ offset: filters.offset + pageSize })}>
            {t.list.pagination.next} →
          </Link>
        )}
      </nav>
    </div>
  );
}
