import Link from "next/link";
import { ReactNode } from "react";

import { auth } from "@/auth";
import { LoginRequiredCard } from "@/components/LoginRequiredCard";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import LarpRow from "@/components/ui/LarpRow";
import { YearHeading } from "@/components/ui/SectionHeading";
import { LarpStatusPill } from "@/components/ui/StatusPill";
import { getUserFromSession } from "@/models/User";
import { EditStatus, RelatedUserRole } from "@/prisma/enums";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import {
  countOwnLarps,
  filterOwnLarps,
  getRoleTags,
  groupOwnLarps,
  isUpcomingLarp,
  loadOwnLarps,
  ownLarpsFilters,
  parseOwnLarpsFilter,
  type OwnLarp,
  type OwnLarpsFilter,
  type YearGroup,
} from "./ownLarps";
import styles from "./page.module.scss";
import YearExpander from "./YearExpander";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ show?: string; year?: string }>;
}

const rowsShownPerYear = 10;

const filterIcons: Record<OwnLarpsFilter, ReactNode> = {
  all: null,
  organizing: <ShieldIcon size={12} />,
  played: <CheckIcon size={12} />,
  favourites: <HeartIcon size={12} />,
};

function roleIcon(role: RelatedUserRole): ReactNode {
  switch (role) {
    case RelatedUserRole.GAME_MASTER:
    case RelatedUserRole.TEAM_MEMBER:
    case RelatedUserRole.VOLUNTEER:
    case RelatedUserRole.EDITOR:
      return <ShieldIcon size={10} />;
    case RelatedUserRole.PLAYER:
      return <CheckIcon size={10} />;
    case RelatedUserRole.FAVORITE:
      return <HeartIcon size={10} />;
    default:
      return null;
  }
}

function filterHref(filter: OwnLarpsFilter, year?: number): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("show", filter);
  if (year !== undefined) params.set("year", String(year));
  const search = params.toString();
  const hash = year !== undefined ? `#year-${year}` : "";
  return `/profile/larps${search ? `?${search}` : ""}${hash}`;
}

/** Newest first. */
async function getPendingEditIds(userId: string) {
  const requests = await db.orm.public.ModerationRequest.where({
    submitterId: userId,
  })
    .where((r) =>
      r.status.in([EditStatus.PENDING_VERIFICATION, EditStatus.VERIFIED]),
    )
    .select("id")
    .orderBy((r) => r.id.desc())
    .all();
  return requests.map((request) => request.id);
}

export default async function OwnLarpsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.OwnLarpsPage;

  const session = await auth();
  const user = await getUserFromSession(session);
  if (!user) {
    return (
      <LoginRequiredCard messages={translations.LoginRequired} container />
    );
  }

  const { show, year: yearParam } = await searchParams;
  const filter = parseOwnLarpsFilter(show);
  const expandedYear = Number(yearParam) || null;

  const [allLarps, pendingEditIds] = await Promise.all([
    loadOwnLarps(user.id),
    getPendingEditIds(user.id),
  ]);
  const counts = countOwnLarps(allLarps);
  const larps = filterOwnLarps(allLarps, filter);
  const groups = groupOwnLarps(larps);
  const listT = translations.LarpListPage;

  const calendarHref =
    filter === "all"
      ? "/profile/larps/calendar.ics"
      : `/profile/larps/calendar.ics?show=${filter}`;

  const renderRow = (larp: OwnLarp) => (
    <LarpRow
      key={larp.id}
      larp={larp}
      locale={locale}
      messages={translations.Larp}
      dateFormat="short"
      past={!isUpcomingLarp(larp)}
      aside={
        <>
          <RoleTags roles={larp.roles} messages={t} />
          {isUpcomingLarp(larp) && (
            <LarpStatusPill
              larp={larp}
              messages={translations.Larp}
              locale={locale}
            />
          )}
        </>
      }
    />
  );

  const renderYear = ({ year, part, anchor, larps: yearLarps }: YearGroup) => {
    const headingId = `year-${anchor}`;
    const collapsed =
      year !== null &&
      year !== expandedYear &&
      yearLarps.length > rowsShownPerYear + 1;
    const shown = collapsed ? yearLarps.slice(0, rowsShownPerYear) : yearLarps;
    const hidden = collapsed ? yearLarps.slice(rowsShownPerYear) : [];

    return (
      <section
        key={headingId}
        className="lf-section"
        aria-labelledby={headingId}
      >
        <YearHeading
          year={
            part ? (
              <>
                {year} <span className="lf-count">{listT[part]}</span>
              </>
            ) : (
              (year ?? t.noDate)
            )
          }
          count={t.larpCount(yearLarps.length)}
          id={headingId}
        />
        {shown.map(renderRow)}
        {year !== null && hidden.length > 0 && (
          <YearExpander
            href={filterHref(filter, year)}
            label={t.showMore(hidden.length, year)}
          >
            {hidden.map(renderRow)}
          </YearExpander>
        )}
      </section>
    );
  };

  return (
    <div className="lf-container">
      <header className="lf-page-header">
        <div className={styles.header}>
          <div className={styles.titles}>
            {user.name && <p className="lf-eyebrow">{user.name}</p>}
            <h1 className="lf-display-l">{t.title}</h1>
            <p className={styles.intro}>{t.lede}</p>
          </div>
          <div className={styles.actions}>
            {pendingEditIds.length > 0 && (
              <Link
                href={`/moderate/${pendingEditIds[0]}`}
                className="btn btn-outline-secondary"
              >
                <ClockIcon size={14} />
                {t.pendingEdits}
                <span className={styles.pendingCount}>
                  {pendingEditIds.length}
                </span>
              </Link>
            )}
            {larps.some((larp) => larp.startsAt) && (
              <a
                href={calendarHref}
                className="btn btn-outline-primary"
                download
              >
                <CalendarIcon size={14} />
                {t.downloadCalendar}
              </a>
            )}
          </div>
        </div>

        <nav aria-label={t.filters.label} className={styles.filters}>
          {ownLarpsFilters.map((option) => (
            <Link
              key={option}
              href={filterHref(option)}
              className="lf-chip"
              aria-current={option === filter ? "true" : undefined}
            >
              {filterIcons[option]}
              {t.filters[option]}
              <span className={styles.chipCount}>{counts[option]}</span>
            </Link>
          ))}
        </nav>
      </header>

      <div className={styles.body}>
        {larps.length === 0 && <p className="lf-empty">{t.empty[filter]}</p>}

        {groups.map(renderYear)}

        <div className={`lf-surface lf-surface--compact ${styles.missing}`}>
          <span className={styles.missingTitle}>{t.missing.title}</span>
          <span className={styles.missingText}>{t.missing.message}</span>
          <Link href="/larp" className="btn btn-outline-secondary">
            {t.missing.browse}
          </Link>
        </div>
      </div>
    </div>
  );
}

function RoleTags({
  roles,
  messages: t,
}: {
  roles: RelatedUserRole[];
  messages: Translations["OwnLarpsPage"];
}) {
  return getRoleTags(roles).map((role) => (
    <span
      key={role}
      className={`lf-tag lf-tag--role lf-tag--small ${styles.roleTag}`}
    >
      {roleIcon(role)}
      {t.roleTags[role]}
    </span>
  ));
}
