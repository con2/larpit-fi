import { Markdown } from "@con2/components";
import { and, or } from "@prisma/orm-postgres/orm-client";
import Link from "next/link";
import { partition } from "underscore";

import HeaderImageBackdrop, {
  heroTextClassName,
  heroWithImageClassName,
} from "@/components/header-image/HeaderImageBackdrop";
import Aurora, { nightSkyProps } from "@/components/ui/Aurora";
import CompactRow from "@/components/ui/CompactRow";
import LarpRow from "@/components/ui/LarpRow";
import { splitRunSuffix, typesetDashes } from "@/helpers/larpName";
import SectionHeading from "@/components/ui/SectionHeading";
import { formatShortDateRange, isoWeekOf } from "@/helpers/dates";
import {
  ensureEndsAt,
  getLarpHref,
  isSignupOpenOrOpeningSoon,
} from "@/models/Larp";
import { headerImageViewOrNull } from "@/models/HeaderImage";
import { frontPageSlug, seeAlsoSlug } from "@/models/Page";
import { iso, parseDates } from "@/prisma/dates";
import { Language, LarpType, Openness } from "@/prisma/enums";
import { getTranslations } from "@/translations";
import { getRecentChanges } from "./_home/recentChanges";
import SearchLarpsButton from "./_home/SearchLarpsButton";
import styles from "./page.module.scss";
import { getReader } from "@/prisma/reader";

interface Props {
  params: Promise<{ locale: string }>;
}

const cancelledLarpVisibleDays = 30;
const signupOpeningSoonDays = 14;
const thisWeekLimit = 5;
const otherEventsLimit = 4;
const otherEventTypes: LarpType[] = [
  LarpType.OTHER_EVENT,
  LarpType.OTHER_EVENT_SERIES,
];

/** Larps that have not ended before the given day, earliest first. */
async function getHomePageLarps(since: string) {
  const cancelledCutoff = new Date(
    Date.now() - cancelledLarpVisibleDays * 24 * 60 * 60 * 1000,
  );

  const { db: reader } = await getReader();
  return parseDates(
    await reader.orm.public.Larp.where((l) =>
      or(l.endsAt.gte(since), and(l.endsAt.isNull(), l.startsAt.gte(since))),
    )
      .where((l) =>
        or(l.cancelledAt.isNull(), l.cancelledAt.gte(iso(cancelledCutoff))),
      )
      .orderBy((l) => l.startsAt.asc())
      .include("municipality", (m) => m.select("nameFi"))
      .all(),
  );
}

function langOf(language: Language) {
  return language === Language.OTHER ? undefined : language;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.HomePage;
  const navT = translations.Navigation.actions;
  const now = new Date();
  const week = isoWeekOf(now);
  const monday = week.monday.toString();
  const sunday = week.sunday.toString();

  const { db: reader } = await getReader();
  const [larps, page, seeAlso, recentChanges] = await Promise.all([
    getHomePageLarps(monday),
    reader.orm.public.Page.include("headerImage").first({
      slug: frontPageSlug,
      language: locale,
    }),
    reader.orm.public.Page.first({ slug: seeAlsoSlug, language: locale }),
    getRecentChanges(),
  ]);

  const visibleLarps = larps.filter(
    (larp) => larp.openness !== Openness.INVITE_ONLY,
  );
  const [otherEvents, actualLarps] = partition(visibleLarps, (larp) =>
    otherEventTypes.includes(larp.type),
  );

  const thisWeek = actualLarps.filter(
    (larp) =>
      larp.startsAt! <= sunday && (larp.endsAt ?? larp.startsAt!) >= monday,
  );
  const upcomingOtherEvents = otherEvents.filter(
    (larp) => ensureEndsAt(larp)! >= now,
  );
  const upcomingLarps = actualLarps.filter(
    (larp) => ensureEndsAt(larp)! >= now,
  );
  const [ongoingSignupLarps, otherUpcomingLarps] = partition(
    upcomingLarps,
    (larp) =>
      !larp.cancelledAt &&
      isSignupOpenOrOpeningSoon(larp, signupOpeningSoonDays),
  );

  const headerImage = headerImageViewOrNull(page?.headerImage);
  const otherEventsHref = `/larp?type=${LarpType.OTHER_EVENT}`;
  const upcomingOtherEventCount = upcomingOtherEvents.filter(
    (larp) => larp.type === LarpType.OTHER_EVENT,
  ).length;

  return (
    <>
      <section
        {...(headerImage
          ? {
              className: `${styles.hero} ${heroWithImageClassName}`,
            }
          : nightSkyProps(styles.hero))}
      >
        {headerImage ? (
          <HeaderImageBackdrop
            view={headerImage}
            messages={translations.HeaderImage}
          />
        ) : (
          <Aurora variant="home" />
        )}
        <div className={`lf-container ${styles.heroInner}`}>
          <div className={`${styles.heroText} ${heroTextClassName}`}>
            <p className="lf-eyebrow">{t.tagline}</p>
            <h1 className="lf-display-xl">{page?.title || t.title}</h1>
            {page?.content.trim() && (
              <div className={styles.intro}>
                <Markdown input={page.content} />
              </div>
            )}
            <div className={styles.actions}>
              <Link href="/larp/new" className="btn btn-primary">
                {navT.addLarp}
              </Link>
              <SearchLarpsButton
                label={navT.search}
                className={`btn btn-outline-secondary ${styles.heroSecondary}`}
              />
              <Link
                href="/calendar#subscribe"
                className={`lf-link-quiet ${styles.quietAction}`}
              >
                {t.actions.subscribeToCalendar} →
              </Link>
            </div>
          </div>

          {thisWeek.length > 0 && (
            <section
              className={`${styles.thisWeek} ${heroTextClassName}`}
              aria-labelledby="HomePage-thisWeek"
            >
              <h2
                id="HomePage-thisWeek"
                className={`lf-label ${styles.thisWeekHeading}`}
              >
                {t.sections.thisWeek.title}{" "}
                <span className="lf-dim">
                  · {t.sections.thisWeek.week(week.week)}
                </span>
              </h2>
              <div className="lf-compact-list">
                {thisWeek.slice(0, thisWeekLimit).map((larp) => {
                  const { name, suffix } = splitRunSuffix(larp.name);
                  const sub = [larp.municipality?.nameFi, suffix]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <CompactRow
                      key={larp.id}
                      href={getLarpHref(larp)}
                      date={formatShortDateRange(
                        larp.startsAt,
                        larp.endsAt,
                        locale,
                      )}
                      name={name}
                      sub={sub || undefined}
                      cancelled={!!larp.cancelledAt}
                      lang={langOf(larp.language)}
                    />
                  );
                })}
              </div>
              <Link href="/calendar" className="lf-more-link">
                {t.sections.thisWeek.fullCalendar} →
              </Link>
            </section>
          )}
        </div>
      </section>

      <div className="lf-container lf-main-aside">
        <div>
          {ongoingSignupLarps.length > 0 && (
            <section className="lf-section">
              <SectionHeading count={ongoingSignupLarps.length}>
                {t.sections.ongoingSignup.title}
              </SectionHeading>
              {ongoingSignupLarps.map((larp) => (
                <LarpRow
                  key={larp.id}
                  larp={larp}
                  locale={locale}
                  messages={translations.Larp}
                  prominentTagline
                />
              ))}
            </section>
          )}

          {otherUpcomingLarps.length > 0 && (
            <section className="lf-section">
              <SectionHeading count={otherUpcomingLarps.length}>
                {
                  // some may call it overkill
                  // we call it attention to detail
                  ongoingSignupLarps.length > 0
                    ? t.sections.upcomingWhenOngoingSignupPresent
                    : t.sections.upcomingWhenNoOngoingSignupPresent
                }
              </SectionHeading>
              {otherUpcomingLarps.map((larp) => (
                <LarpRow
                  key={larp.id}
                  larp={larp}
                  locale={locale}
                  messages={translations.Larp}
                />
              ))}
            </section>
          )}
        </div>

        <aside>
          {recentChanges.length > 0 && (
            <section aria-labelledby="HomePage-recentChanges">
              <h2
                id="HomePage-recentChanges"
                className={`lf-label ${styles.sidebarSectionHeading}`}
              >
                {t.sections.recentChanges.title}
              </h2>
              <div className="lf-compact-list">
                {recentChanges.map((change) => (
                  <CompactRow
                    key={change.id}
                    href={getLarpHref(change)}
                    date={formatShortDateRange(change.resolvedAt, null, locale)}
                    name={typesetDashes(change.name)}
                    cancelled={change.isCancelled}
                    lang={langOf(change.language)}
                  />
                ))}
              </div>
            </section>
          )}

          {upcomingOtherEvents.length > 0 && (
            <section aria-labelledby="HomePage-otherEvents">
              <h2
                id="HomePage-otherEvents"
                className={`lf-label ${styles.sidebarSectionHeading}`}
              >
                {t.sections.otherEvents.title}
              </h2>
              <div className="lf-compact-list">
                {upcomingOtherEvents.slice(0, otherEventsLimit).map((larp) => {
                  const sub = [larp.municipality?.nameFi, larp.tagline]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <CompactRow
                      key={larp.id}
                      href={getLarpHref(larp)}
                      date={formatShortDateRange(
                        larp.startsAt,
                        larp.endsAt,
                        locale,
                      )}
                      name={typesetDashes(larp.name)}
                      sub={sub || undefined}
                      cancelled={!!larp.cancelledAt}
                      lang={langOf(larp.language)}
                    />
                  );
                })}
              </div>
              <Link href={otherEventsHref} className="lf-more-link">
                {t.sections.otherEvents.all(upcomingOtherEventCount)} →
              </Link>
            </section>
          )}

          {seeAlso?.content.trim() && (
            <section className={styles.cmsAside}>
              <h2 className="lf-label">{seeAlso.title}</h2>
              <Markdown input={seeAlso.content} />
            </section>
          )}

          <section className="lf-surface lf-surface--compact">
            <h2 className="lf-surface__title">{t.sections.addLarp.title}</h2>
            <p className="small lf-muted">{t.sections.addLarp.description}</p>
            <div>
              <Link href="/larp/new" className="btn btn-primary">
                {navT.addLarp}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
