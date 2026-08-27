import LarpCard from "@/components/LarpCard";
import RecentChangesCard, {
  getRecentChanges,
} from "@/components/RecentChangesCard";
import { LarpType, Openness } from "@/generated/prisma/client";
import { ensureEndsAt, isSignupOpenOrOpeningSoon } from "@/models/Larp";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import { Markdown } from "@con2/components";
import { InfoCircle } from "@con2/components/icons";
import Link from "next/link";
import { ReactNode } from "react";
import { CardBody, OverlayTrigger, Tooltip } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { partition } from "underscore";

interface Props {
  params: Promise<{ locale: string }>;
}

// We show all upcoming larps and 8 past larps on the front page.
// This is a reasonable guess as there are usually not that many upcoming larps.
const take = 100;

const cancelledLarpVisibleDays = 30;

async function getHomePageLarps() {
  const cancelledCutoff = new Date(
    Date.now() - cancelledLarpVisibleDays * 24 * 60 * 60 * 1000,
  );

  return prisma.larp.findMany({
    where: {
      startsAt: {
        not: null,
      },
      OR: [{ cancelledAt: null }, { cancelledAt: { gte: cancelledCutoff } }],
      // XXX Prisma does not support the SQL IS NOT DISTINCT FROM operator
      // openness: {
      //   isNotDistinctFrom: Openness.INVITE_ONLY,
      // },
    },
    orderBy: [
      {
        startsAt: {
          sort: "desc",
          nulls: "last",
        },
      },
    ],
    include: {
      municipality: {
        select: {
          nameFi: true,
        },
      },
    },
    take,
  });
}

type HomePageLarp = Awaited<ReturnType<typeof getHomePageLarps>>[number];
const signupOpeningSoonDays = 14;

function Section({
  title,
  description,
  larps,
  locale,
  messages,
  children,
  past,
  countWord,
}: {
  title: string;
  description?: ReactNode;
  larps: HomePageLarp[];
  locale: string;
  messages: Translations["Larp"];
  children?: React.ReactNode;
  past?: boolean;
  countWord?: { singular: string; plural: string };
}) {
  const count = larps.length;
  const word = countWord ?? messages.clientAttributes.yearHeaders.larp;
  const countLabel = count === 1 ? word.singular : word.plural;

  return (
    <div className="mb-5">
      <h4 className="h-float mb-4">
        {title}
        {!past && (
          <>
            {" "}
            ({count} {countLabel})
          </>
        )}
        {description && (
          <>
            {" "}
            <OverlayTrigger overlay={<Tooltip>{description}</Tooltip>}>
              <InfoCircle />
            </OverlayTrigger>
          </>
        )}
      </h4>
      <div className="row">
        {larps.map((larp) => (
          <LarpCard
            larp={larp}
            locale={locale}
            key={larp.id}
            messages={messages}
            past={past}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

const limitPastLarps = 8;
const slug = "front-page";

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.HomePage;
  const now = new Date();

  // TODO currently gets all larps, then filters in memory
  // still plenty fast enough, but should be optimized later

  const [larps, page, recentChanges] = await Promise.all([
    getHomePageLarps(),
    prisma.page.findUnique({
      where: { slug_language: { slug, language: locale } },
    }),
    getRecentChanges(),
  ]);

  const candidateLarps = larps.filter(
    (larp) => larp.openness !== Openness.INVITE_ONLY && !!larp.startsAt,
  );

  // For upcoming events, earliest first is more useful
  candidateLarps.reverse();

  const [otherEvents, actualLarps] = partition(
    candidateLarps,
    (larp) => larp.type === LarpType.OTHER_EVENT,
  );
  const upcomingOtherEvents = otherEvents.filter(
    (larp) => ensureEndsAt(larp)! >= now,
  );
  const [pastLarps, upcomingLarps] = partition(
    actualLarps,
    (larp) => ensureEndsAt(larp)! < now,
  );
  const [ongoingSignupLarps, otherUpcomingLarps] = partition(
    upcomingLarps,
    (larp) =>
      !larp.cancelledAt &&
      isSignupOpenOrOpeningSoon(larp, signupOpeningSoonDays),
  );

  // We only show a fixed number of past larps
  // For past larps, most recent first is more useful
  pastLarps.reverse().splice(limitPastLarps);

  return (
    <div className="container">
      <div className="text-center mb-4">
        <h2 className="mt-5">{translations.title}</h2>
        <p className="fs-5 fst-italic h-float">
          {translations.HomePage.tagline}
        </p>
      </div>

      <div className="row">
        {page && (
          <div className="col-lg-8 mb-5">
            <Card className="h-100">
              <CardBody>
                <Markdown input={page.content} />
              </CardBody>
            </Card>
          </div>
        )}
        <div className="col-lg-4 mb-5">
          <RecentChangesCard
            recentChanges={recentChanges}
            locale={locale}
            messages={{
              section: t.sections.recentChanges,
              action: translations.ModerationRequest.attributes.action.choices,
            }}
          />
        </div>
      </div>

      {ongoingSignupLarps.length > 0 && (
        <Section
          title={t.sections.ongoingSignup.title}
          description={t.sections.ongoingSignup.description(
            signupOpeningSoonDays,
          )}
          larps={ongoingSignupLarps}
          locale={locale}
          messages={translations.Larp}
        />
      )}
      {otherUpcomingLarps.length > 0 && (
        <Section
          title={
            // some may call it overkill
            // we call it attention to detail
            ongoingSignupLarps.length > 0
              ? t.sections.upcomingWhenOngoingSignupPresent
              : t.sections.upcomingWhenNoOngoingSignupPresent
          }
          larps={otherUpcomingLarps}
          locale={locale}
          messages={translations.Larp}
        />
      )}
      {upcomingOtherEvents.length > 0 && (
        <Section
          title={t.sections.upcomingOtherEvents}
          larps={upcomingOtherEvents}
          locale={locale}
          messages={translations.Larp}
          countWord={t.otherEvent}
        />
      )}
      {pastLarps.length > 0 && (
        <Section
          title={t.sections.past}
          larps={pastLarps}
          locale={locale}
          messages={translations.Larp}
          past={true}
        >
          <Link href="/larp" className="link-subtle">
            {translations.Larp.listTitle}…
          </Link>
        </Section>
      )}
    </div>
  );
}
