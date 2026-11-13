import { required } from "@/prisma/include";
import { auth } from "@/auth";
import { setOwnLarpRole } from "@/app/[locale]/larp/[larpId]/ownRoleActions";
import { featureFlags, headerImagesEnabled } from "@/config";
import { formatShortDateRange } from "@/helpers/dates";
import {
  type HeaderImageView,
  headerImageViewOrNull,
} from "@/models/HeaderImage";
import { ensureLocation } from "@/models/Larp";
import {
  ensureEndsAt,
  getLarpHref,
  signupEndsAt,
  signupStartsAt,
} from "@/models/Larp.client";
import {
  canModerate,
  getDeleteLarpInitialStatusForUser,
  getEditLarpInitialStatusForUserAndLarp,
  getLocalSignupStatusForUser,
  getUserFromSession,
  isGmOrModerator,
} from "@/models/User";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import {
  EditStatus,
  LarpLinkType,
  LarpType,
  LocalSignupStatus,
  RelatedUserRole,
} from "@/prisma/enums";
import type { LarpLink } from "@/prisma/models";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { Translations } from "@/translations/en";
import { AlertNavigateOnClose, Markdown, Paragraphs } from "@con2/components";
import { FormattedDate, FormattedDateRange } from "@/components/FormattedDates";
import { toPlainDate } from "@con2/components/helpers";
import { formatDateRange } from "@/helpers/dates";
import { Temporal } from "@js-temporal/polyfill";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Alert } from "react-bootstrap";
import {
  splitRunSuffix,
  typesetDashes,
  typesetMarkdownDashes,
} from "@/helpers/larpName";
import HeaderImageBackdrop, {
  heroTextClassName,
  heroWithImageClassName,
} from "./header-image/HeaderImageBackdrop";
import LarpJsonLd from "./LarpJsonLd";
import styles from "./LarpPage.module.scss";
import TooltipTrigger from "./TooltipTrigger";
import SignInButton from "./larp-page/SignInButton";
import Aurora, { nightSkyProps } from "./ui/Aurora";
import { PaletteContext, type PaletteCommand } from "./ui/CommandPalette";
import StatusPill from "./ui/StatusPill";
import TypeTag from "./ui/TypeTag";
import {
  CalendarIcon,
  CheckIcon,
  EditIcon,
  ExternalIcon,
  HeartIcon,
  ImageIcon,
  LinkIcon,
  ListIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
} from "./ui/icons";
import {
  getSignupPillState,
  type SignupPillReason,
} from "./ui/signupPillState";
import { getReader } from "@/prisma/reader";

export const relatedLarpFields = ["id", "alias", "name", "startsAt"] as const;

/** Ordering by a field of the included larp is not expressible in the query, so sort here. */
export function byStartsAt(
  a: { startsAt: string | null },
  b: { startsAt: string | null },
) {
  return (a.startsAt ?? "").localeCompare(b.startsAt ?? "");
}

export async function getLarpPageData(
  where: { id: string } | { alias: string },
) {
  const { db: reader } = await getReader();
  const larp = await reader.orm.public.Larp.include("links")
    .include("relatedLarpsLeft", (r) =>
      r.include("right", (l) => l.select(...relatedLarpFields)),
    )
    .include("relatedLarpsRight", (r) =>
      r.include("left", (l) => l.select(...relatedLarpFields)),
    )
    .include("relatedUsers", (r) =>
      r.where({ role: "GAME_MASTER" }).select("userId", "role"),
    )
    .include("municipality", (m) =>
      m
        .select("nameFi", "nameOther", "nameOtherLanguageCode")
        .include("country", (c) => c.select("code")),
    )
    .include("headerImage")
    .first(where);
  if (!larp) return null;
  const relatedLarpsLeft = larp.relatedLarpsLeft
    .map((related) => ({ ...related, right: required(related.right) }))
    .sort((a, b) => byStartsAt(a.right, b.right));
  const relatedLarpsRight = larp.relatedLarpsRight
    .map((related) => ({ ...related, left: required(related.left) }))
    .sort((a, b) => byStartsAt(a.left, b.left));
  const municipality = larp.municipality && {
    ...larp.municipality,
    country: required(larp.municipality.country),
  };
  return parseDates({
    ...larp,
    municipality,
    relatedLarpsLeft,
    relatedLarpsRight,
  });
}

export type LarpPageLarp = NonNullable<
  Awaited<ReturnType<typeof getLarpPageData>>
>;

const ownRoles = [
  RelatedUserRole.PLAYER,
  RelatedUserRole.FAVORITE,
  RelatedUserRole.LOCAL_SIGNUP_YES,
  RelatedUserRole.LOCAL_SIGNUP_MAYBE,
  RelatedUserRole.LOCAL_SIGNUP_NO,
];

const localSignupRoles: readonly RelatedUserRole[] = [
  RelatedUserRole.LOCAL_SIGNUP_YES,
  RelatedUserRole.LOCAL_SIGNUP_MAYBE,
  RelatedUserRole.LOCAL_SIGNUP_NO,
];

function weekday(date: string, locale: string) {
  return Temporal.PlainDate.from(date).toLocaleString(
    toSupportedLanguage(locale),
    { weekday: "short" },
  );
}

function WeekdayDate({ date, locale }: { date: string; locale: string }) {
  return (
    <>
      {weekday(date, locale)}
      {"\u00a0"}
      <FormattedDate date={date} locale={locale} />
    </>
  );
}

function WeekdayDateRange({
  start,
  end,
  locale,
}: {
  start: string;
  end: string | null;
  locale: string;
}) {
  if (!end || end === start)
    return <WeekdayDate date={start} locale={locale} />;
  const days = Temporal.PlainDate.from(end).since(start).days;
  return (
    <>
      {days < 7 && `${weekday(start, locale)}–${weekday(end, locale)}\u00a0`}
      <FormattedDateRange locale={locale} start={start} end={end} />
    </>
  );
}

function daysFromToday(date: string) {
  return Temporal.PlainDate.from(date).since(toPlainDate(new Date())).days;
}

function hostOf(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function TagWithDescription({
  description,
  children,
}: {
  description?: string;
  children: ReactNode;
}) {
  if (!description) return children;
  return <TooltipTrigger tooltip={description}>{children}</TooltipTrigger>;
}

function Hero({
  larp,
  locale,
  translations,
  aside,
  headerImage,
}: {
  larp: LarpPageLarp;
  locale: string;
  translations: Translations;
  aside?: ReactNode;
  headerImage: HeaderImageView | null;
}) {
  const t = translations.LarpPage;
  const larpT = translations.Larp;
  const location = ensureLocation(larp);

  const participants = larpT.attributes.numParticipants.format(
    larp.numPlayerCharacters,
    larp.numTotalParticipants,
  );

  const titleParts = splitRunSuffix(larp.name);
  const typeChoice = larpT.attributes.type.choices[larp.type];
  const opennessChoice =
    larp.openness && larpT.attributes.openness.choices[larp.openness];

  return (
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
        <Aurora variant="larp" />
      )}
      <div className={`lf-container ${styles.heroInner}`}>
        <div className={`${styles.heroText} ${heroTextClassName}`}>
          <div className="lf-tags">
            {larp.cancelledAt && (
              <StatusPill kind="cancelled">
                {larpT.attributes.signupStatus.choices.cancelled}
              </StatusPill>
            )}
            <TagWithDescription description={typeChoice?.description}>
              <TypeTag type={larp.type} messages={larpT} />
            </TagWithDescription>
            <span className="lf-tag">
              {larpT.attributes.language.choices[larp.language] ??
                larp.language}
            </span>
            {opennessChoice && (
              <TagWithDescription description={opennessChoice.description}>
                <span className="lf-tag">{opennessChoice.title}</span>
              </TagWithDescription>
            )}
          </div>
          <h1
            className={`lf-display-l${larp.cancelledAt ? ` ${styles.cancelledTitle}` : ""}`}
            lang={larp.language}
          >
            {titleParts.name}
            {titleParts.suffix && (
              <>
                {" "}
                <span className={styles.runSuffix}>{titleParts.suffix}</span>
              </>
            )}
          </h1>
          {larp.tagline && (
            <p className="lf-lede" lang={larp.language}>
              {larp.tagline}
            </p>
          )}
          {(larp.startsAt || location || participants) && (
            <dl className={styles.details}>
              {larp.startsAt && (
                <div>
                  <dt className="lf-label">{t.details.when}</dt>
                  <dd className={styles.mono}>
                    <WeekdayDateRange
                      start={larp.startsAt}
                      end={larp.endsAt}
                      locale={locale}
                    />
                  </dd>
                </div>
              )}
              {location && (
                <div>
                  <dt className="lf-label">{t.details.where}</dt>
                  <dd lang={location.language}>{location.location}</dd>
                </div>
              )}
              {participants && (
                <div>
                  <dt className="lf-label">{t.details.participants}</dt>
                  <dd className={styles.mono}>{participants}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
        {aside && <div className={styles.heroAside}>{aside}</div>}
      </div>
    </section>
  );
}

function LinkList({
  links,
  messages: t,
}: {
  links: LarpLink[];
  messages: Translations["Larp"];
}) {
  return (
    <ul className={styles.ruledList}>
      {links.map((link) => {
        const host = hostOf(link.href);
        return (
          <li key={link.id}>
            <a
              className={styles.linkRow}
              href={link.href}
              rel="noopener noreferrer"
              target="_blank"
            >
              <span className={styles.linkText}>
                <span className={styles.linkTitle}>
                  {link.title ||
                    t.attributes.links.types[link.type]?.title ||
                    link.type}
                </span>
                {host && <span className={styles.linkHost}>{host}</span>}
              </span>
              <ExternalIcon size={18} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function RelatedLarpList({
  larp,
  messages: t,
}: {
  larp: LarpPageLarp;
  messages: Translations["Larp"];
}) {
  return (
    <ul className={styles.ruledList}>
      {larp.relatedLarpsLeft.map((related) => (
        <li key={`left-${related.rightId}`} className={styles.relatedRow}>
          <span className="lf-dim">
            {t.attributes.leftRelatedLarps.types[related.type] || related.type}
          </span>
          <Link href={getLarpHref(related.right)}>
            {typesetDashes(related.right.name)}
          </Link>
          {related.right.startsAt && (
            <span className="lf-data lf-dim">
              {related.right.startsAt.slice(0, 4)}
            </span>
          )}
        </li>
      ))}
      {larp.relatedLarpsRight.map((related) => (
        <li key={`right-${related.leftId}`} className={styles.relatedRow}>
          <Link href={getLarpHref(related.left)}>
            {typesetDashes(related.left.name)}
          </Link>
          <span className="lf-dim">
            {t.attributes.rightRelatedLarps.types[related.type] || related.type}
          </span>
          {related.left.startsAt && (
            <span className="lf-data lf-dim">
              {related.left.startsAt.slice(0, 4)}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function SignupCard({
  larp,
  locale,
  translations,
}: {
  larp: LarpPageLarp;
  locale: string;
  translations: Translations;
}) {
  const t = translations.LarpPage.signup;
  const larpT = translations.Larp;
  const now = new Date();
  const endsAt = ensureEndsAt(larp);
  if (endsAt && endsAt < now) return null;

  const state = getSignupPillState(larp);
  const choices = larpT.attributes.signupStatus.choices;
  // The heading under the pill gives the date, so the pill only names the status.
  const pillLabels: Record<SignupPillReason, ReactNode> = {
    cancelled: choices.cancelled,
    inviteOnly: choices.inviteOnly,
    openUntil: t.pill.open,
    openIndefinitely: t.pill.open,
    opens: t.pill.opensSoon,
    over: choices.over,
  };
  const opensAt = signupStartsAt(larp);
  const closesAt = signupEndsAt(larp);
  const closingDate = larp.signupEndsAt ?? larp.startsAt;
  const siteLink =
    larp.links.find((link) => link.type === LarpLinkType.SIGNUP) ??
    larp.links.find((link) => link.type === LarpLinkType.HOMEPAGE);

  let bigLine: ReactNode = null;
  let subLine: ReactNode = null;
  let elapsed: number | null = null;
  let buttonLabel: string | null = null;
  let message: ReactNode = null;

  switch (state?.reason) {
    case "cancelled":
      message = t.cancelled;
      break;
    case "inviteOnly":
      message = larpT.attributes.openness.choices.INVITE_ONLY.description;
      break;
    case "openUntil":
    case "openIndefinitely": {
      if (closingDate) {
        bigLine = t.closes(<WeekdayDate date={closingDate} locale={locale} />);
      }
      const parts: ReactNode[] = [];
      if (larp.signupStartsAt) {
        parts.push(
          t.opened(
            <FormattedDate date={larp.signupStartsAt} locale={locale} />,
          ),
        );
      }
      if (closingDate) parts.push(t.daysLeft(daysFromToday(closingDate)));
      subLine = joinWithDots(parts);
      if (opensAt && closesAt && closesAt > opensAt) {
        elapsed =
          (now.getTime() - opensAt.getTime()) /
          (closesAt.getTime() - opensAt.getTime());
      }
      buttonLabel = t.signUpOnSite;
      break;
    }
    case "over":
      if (larp.signupEndsAt) {
        bigLine = t.closed(
          <WeekdayDate date={larp.signupEndsAt} locale={locale} />,
        );
      }
      break;
    case "opens":
    case undefined:
      if (larp.signupStartsAt && opensAt && opensAt > now) {
        bigLine = t.opens(
          <WeekdayDate date={larp.signupStartsAt} locale={locale} />,
        );
        if (larp.signupEndsAt) {
          subLine = t.closes(
            <FormattedDate date={larp.signupEndsAt} locale={locale} />,
          );
        }
      } else if (!larp.signupStartsAt && !larp.signupEndsAt) {
        if (!siteLink || !larp.startsAt) return null;
        message = t.notAnnounced;
      } else {
        return null;
      }
      buttonLabel = t.visitSite;
      break;
  }

  return (
    <section className={`lf-surface ${styles.signupCard}`} aria-label={t.title}>
      <div className={styles.signupHead}>
        {state && (
          <StatusPill kind={state.kind}>{pillLabels[state.reason]}</StatusPill>
        )}
        {bigLine && <p className={styles.bigLine}>{bigLine}</p>}
        {subLine && <p className={styles.subLine}>{subLine}</p>}
        {message && <p className={styles.subLine}>{message}</p>}
      </div>
      {elapsed !== null && (
        <div
          className={styles.countdown}
          role="progressbar"
          aria-label={t.elapsed}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamp01(elapsed) * 100)}
        >
          <div
            className={styles.countdownFill}
            style={{ width: `${clamp01(elapsed) * 100}%` }}
          />
        </div>
      )}
      {buttonLabel && siteLink && (
        <a
          href={siteLink.href}
          className={`btn btn-success ${styles.signupButton}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {buttonLabel} <ExternalIcon size={14} />
        </a>
      )}
    </section>
  );
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function joinWithDots(parts: ReactNode[]) {
  return parts.map((part, index) => (
    <span key={index}>
      {index > 0 && " · "}
      {part}
    </span>
  ));
}

/** Other events, series and campaigns are not played as such; their individual larps are. */
const playableTypes: LarpType[] = [LarpType.ONE_SHOT, LarpType.CAMPAIGN_LARP];

interface PageAction {
  href: string;
  label: string;
  icon: ReactNode;
  destructive?: boolean;
}

function OwnActions({
  larp,
  signedIn,
  played,
  favourite,
  calendarHref,
  pageActions,
  messages: t,
}: {
  larp: LarpPageLarp;
  signedIn: boolean;
  played: boolean;
  favourite: boolean;
  calendarHref: string | null;
  pageActions: PageAction[];
  messages: Translations["LarpPage"]["ownActions"];
}) {
  const endsAt = ensureEndsAt(larp);
  const isUpcoming = !!endsAt && endsAt >= new Date();
  const toggles = [
    ...(playableTypes.includes(larp.type)
      ? [
          {
            role: RelatedUserRole.PLAYER,
            active: played,
            label: isUpcoming ? t.playing : t.played,
            icon: <CheckIcon size={18} />,
          },
        ]
      : []),
    {
      role: RelatedUserRole.FAVORITE,
      active: favourite,
      label: t.favourite,
      icon: <HeartIcon size={18} />,
    },
  ];

  return (
    <ul className={styles.actionList} aria-label={t.title}>
      {calendarHref && (
        <li>
          <a href={calendarHref} className={styles.action}>
            <CalendarIcon size={18} />
            {t.addToCalendar}
          </a>
        </li>
      )}
      {toggles.map(({ role, active, label, icon }) => (
        <li key={role}>
          {signedIn ? (
            <form action={setOwnLarpRole.bind(null, larp.id, role, !active)}>
              <button
                type="submit"
                className={styles.action}
                aria-pressed={active}
              >
                {icon}
                {label}
              </button>
            </form>
          ) : (
            <SignInButton className={styles.action}>
              {icon}
              {label}
              <span className={styles.actionHint}>{t.signInFirst}</span>
            </SignInButton>
          )}
        </li>
      ))}
      {pageActions.map(({ href, label, icon, destructive }) => (
        <li key={href}>
          <Link
            href={href}
            className={`${styles.action}${destructive ? ` ${styles.actionDestructive}` : ""}`}
          >
            {icon}
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface Props {
  locale: string;
  larpPromise: ReturnType<typeof getLarpPageData>;
  code?: string;
  signupVerified?: boolean;
}

export default async function LarpPage({
  larpPromise,
  locale,
  code,
  signupVerified,
}: Props) {
  const session = await auth();
  const [user, larp] = await Promise.all([
    getUserFromSession(session),
    larpPromise,
  ]);
  if (!larp) {
    notFound();
  }

  const translations = getTranslations(locale);
  const t = translations.LarpPage;
  const larpT = translations.Larp;
  const ediT = translations.EditLarpPage;
  const signupT = translations.LocalSignupPage;
  const paletteT = translations.CommandPalette.commands;

  // relatedUsers in getLarpPageData only holds GAME_MASTER rows, so the user's own roles are looked up here.
  const [userRoles, numPendingEdits] = user
    ? await Promise.all([
        db.orm.public.RelatedUser.where({
          larpId: larp.id,
          userId: user.id,
        })
          .where((r) => r.role.in(ownRoles))
          .select("userId", "role")
          .all(),
        db.orm.public.ModerationRequest.where({
          larpId: larp.id,
          submitterId: user.id,
          status: EditStatus.VERIFIED,
        })
          .aggregate((a) => ({ count: a.count() }))
          .then((r) => r.count),
      ])
    : [[], 0];
  const hasRole = (role: RelatedUserRole) =>
    userRoles.some((related) => related.role === role);

  const userSignupRelatedUser = userRoles.find((related) =>
    localSignupRoles.includes(related.role),
  );
  const signupStatus = getLocalSignupStatusForUser(
    user,
    {
      ...larp,
      relatedUsers: [
        ...larp.relatedUsers,
        ...(userSignupRelatedUser ? [userSignupRelatedUser] : []),
      ],
    },
    code ?? null,
  );

  const signupHref = code
    ? `/larp/${larp.id}/signup?code=${encodeURIComponent(code)}`
    : `/larp/${larp.id}/signup`;

  const localSignupCards: Partial<
    Record<typeof signupStatus, { title: string; callToAction: string }>
  > = {
    CAN_SIGN_UP: {
      title: signupT.userSignupStatus.choices.CAN_SIGN_UP,
      callToAction: signupT.userSignupStatus.actions.signUp,
    },
    LOCAL_SIGNUP_YES: {
      title: signupT.userSignupStatus.choices.LOCAL_SIGNUP_YES,
      callToAction: signupT.userSignupStatus.actions.change,
    },
    LOCAL_SIGNUP_MAYBE: {
      title: signupT.userSignupStatus.choices.LOCAL_SIGNUP_MAYBE,
      callToAction: signupT.userSignupStatus.actions.change,
    },
    LOCAL_SIGNUP_NO: {
      title: signupT.userSignupStatus.choices.LOCAL_SIGNUP_NO,
      callToAction: signupT.userSignupStatus.actions.change,
    },
  };
  const localSignupCard = featureFlags.localSignup
    ? localSignupCards[signupStatus]
    : undefined;

  const isGm = larp.relatedUsers.some(
    (related) =>
      related.userId === user?.id &&
      related.role === RelatedUserRole.GAME_MASTER,
  );
  const isClaimed = larp.relatedUsers.some(
    (related) => related.role === RelatedUserRole.GAME_MASTER,
  );

  const editPolicy = getEditLarpInitialStatusForUserAndLarp(user, larp);
  const deletePolicy = getDeleteLarpInitialStatusForUser(user);

  const editHref = `/larp/${larp.id}/edit`;
  const claimHref = `/larp/${larp.id}/edit?role=GAME_MASTER`;
  const relatedHref = `/larp/${larp.id}/related`;
  const calendarHref = larp.startsAt ? `/larp/${larp.id}/calendar.ics` : null;
  const headerImageHref = `/larp/${larp.id}/header-image`;
  const canManageHeaderImage =
    headerImagesEnabled && isGmOrModerator(user, larp);
  const hasRelatedLarps =
    larp.relatedLarpsLeft.length + larp.relatedLarpsRight.length > 0;

  const paletteCommands: PaletteCommand[] = [
    {
      id: "larp:editLarp",
      label: paletteT.editLarp,
      icon: "edit",
      href: editHref,
    },
    {
      id: "larp:addRelated",
      label: paletteT.addRelated,
      icon: "related",
      href: relatedHref,
    },
    ...(isClaimed
      ? []
      : [
          {
            id: "larp:claim",
            label: paletteT.claim,
            icon: "shield" as const,
            href: claimHref,
          },
        ]),
    ...(canManageHeaderImage
      ? [
          {
            id: "larp:headerImage",
            label: paletteT.headerImage,
            icon: "image" as const,
            href: headerImageHref,
          },
        ]
      : []),
    ...(calendarHref
      ? [
          {
            id: "larp:addToCalendar",
            label: paletteT.addToCalendar,
            icon: "calendar" as const,
            href: calendarHref,
          },
        ]
      : []),
    {
      id: "larp:copyLink",
      label: paletteT.copyLink,
      icon: "link",
      action: "copyLink",
    },
    {
      id: "larp:share",
      label: paletteT.share,
      icon: "share",
      action: "share",
    },
  ];

  const currentYear = String(toPlainDate(new Date()).year);
  const dateLabel = !larp.startsAt
    ? ""
    : larp.startsAt.startsWith(currentYear)
      ? formatShortDateRange(larp.startsAt, larp.endsAt, locale)
      : formatDateRange(larp.startsAt, larp.endsAt, locale);

  const showRoles =
    featureFlags.localSignup &&
    larp.localSignupStatus !== LocalSignupStatus.DISABLED;
  const showSignupSettings =
    featureFlags.localSignup && !!editPolicy && isGmOrModerator(user, larp);
  const headerImage = headerImageViewOrNull(larp.headerImage);

  return (
    <>
      <LarpJsonLd larp={larp} />
      <PaletteContext
        title={typesetDashes(larp.name)}
        commands={paletteCommands}
        larpId={larp.id}
        recent={{
          href: getLarpHref(larp),
          name: typesetDashes(larp.name),
          dateLabel,
        }}
      />
      <Hero
        larp={larp}
        locale={locale}
        translations={translations}
        headerImage={headerImage}
        aside={
          <SignupCard larp={larp} locale={locale} translations={translations} />
        }
      />
      <div className="lf-container lf-main-aside">
        <article>
          {(larp.fluffText || larp.description) && (
            <div className={styles.body} lang={larp.language}>
              {larp.fluffText && (
                <div className={`lf-prose ${styles.fluff}`}>
                  <Paragraphs text={typesetDashes(larp.fluffText)} />
                </div>
              )}
              {larp.description && (
                <div className="lf-prose">
                  <Markdown input={typesetMarkdownDashes(larp.description)} />
                </div>
              )}
            </div>
          )}

          {larp.links.length > 0 && (
            <section>
              <h2 className="lf-label">{larpT.attributes.links.title}</h2>
              <LinkList links={larp.links} messages={larpT} />
            </section>
          )}

          <section>
            <h2 className="lf-label">
              {larpT.attributes.relatedLarps.title}
              {editPolicy && (
                <>
                  {" "}
                  <span className={styles.headingAction}>
                    (<Link href={relatedHref}>{t.actions.editShort}</Link>)
                  </span>
                </>
              )}
            </h2>
            {hasRelatedLarps ? (
              <RelatedLarpList larp={larp} messages={larpT} />
            ) : (
              <p className={`lf-empty ${styles.emptyRelated}`}>
                {t.relatedLarps.empty} {t.relatedLarps.emptyHint}
              </p>
            )}
          </section>
        </article>

        <aside>
          {signupVerified && (
            <AlertNavigateOnClose variant="success">
              {signupT.signupVerified}
            </AlertNavigateOnClose>
          )}
          {localSignupCard && (
            <Link
              href={signupHref}
              className={`lf-surface ${styles.localSignup}`}
            >
              <span className="lf-surface__title">{localSignupCard.title}</span>
              <span className="lf-link-quiet">
                {localSignupCard.callToAction} →
              </span>
            </Link>
          )}
          {numPendingEdits > 0 && (
            <Alert variant="info">{t.pendingEdits(numPendingEdits)}</Alert>
          )}
          <OwnActions
            larp={larp}
            signedIn={!!user}
            played={hasRole(RelatedUserRole.PLAYER)}
            favourite={hasRole(RelatedUserRole.FAVORITE)}
            calendarHref={calendarHref}
            pageActions={[
              {
                href: editHref,
                label:
                  editPolicy && editPolicy !== EditStatus.VERIFIED
                    ? t.actions.edit
                    : t.actions.suggestChange,
                icon: <EditIcon size={18} />,
              },
              ...(!isClaimed
                ? [
                    {
                      href: claimHref,
                      label: t.actions.claim,
                      icon: <ShieldIcon size={18} />,
                    },
                  ]
                : []),
              ...(showRoles
                ? [
                    {
                      href: `/larp/${larp.id}/roles`,
                      label: translations.RolesPage.title,
                      icon: <UserIcon size={18} />,
                    },
                  ]
                : []),
              ...(showSignupSettings
                ? [
                    {
                      href: `/larp/${larp.id}/signup/settings`,
                      label: t.actions.manageSignupSettings,
                      icon: <ListIcon size={18} />,
                    },
                  ]
                : []),
              ...(canManageHeaderImage
                ? [
                    {
                      href: headerImageHref,
                      label: t.actions.headerImage,
                      icon: <ImageIcon size={18} />,
                    },
                  ]
                : []),
              ...(canModerate(user)
                ? [
                    {
                      href: `/larp/${larp.id}/alias`,
                      label: t.actions.alias,
                      icon: <LinkIcon size={18} />,
                    },
                  ]
                : []),
              ...(deletePolicy
                ? [
                    {
                      href: `/larp/${larp.id}/delete`,
                      label:
                        deletePolicy === EditStatus.APPROVED
                          ? t.actions.adminDelete
                          : t.actions.delete,
                      icon: <TrashIcon size={18} />,
                      destructive: true,
                    },
                  ]
                : []),
            ]}
            messages={t.ownActions}
          />
          <section className={styles.note}>
            <h2 className="lf-label">{t.onThisPage.title}</h2>
            <p>
              {isClaimed
                ? isGm
                  ? t.gm.claimedByYou
                  : t.gm.claimed
                : t.onThisPage.crowdSourced}
            </p>
            {editPolicy && <p>{ediT.policy[editPolicy]}</p>}
            <p>
              {t.updated(
                <span className="lf-data">
                  <FormattedDate date={larp.updatedAt} locale={locale} />
                </span>,
              )}
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}
