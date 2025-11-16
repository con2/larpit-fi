import LarpCard from "@/components/LarpCard";
import Markdown from "@/components/Markdown";
import { LarpType, Openness } from "@/generated/prisma";
import { ensureEndsAt, isSignupOpenOrOpeningSoon } from "@/models/Larp";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import Link from "next/link";
import { CardBody } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { partition } from "underscore";

interface Props {
  params: Promise<{ locale: string }>;
}

// We show all upcoming larps and 8 past larps on the front page.
// This is a reasonable guess as there are usually not that many upcoming larps.
const take = 100;

async function getHomePageData() {
  return prisma.larp.findMany({
    where: {
      startsAt: {
        not: null,
      },
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
    select: {
      id: true,
      type: true,
      startsAt: true,
      endsAt: true,
      name: true,
      tagline: true,
      signupStartsAt: true,
      signupEndsAt: true,
      language: true,
      alias: true,
      openness: true,
    },
    take,
  });
}

type HomePageLarp = Awaited<ReturnType<typeof getHomePageData>>[number];

function Section({
  title,
  larps,
  locale,
  messages,
  children,
}: {
  title: string;
  larps: HomePageLarp[];
  locale: string;
  messages: Translations["Larp"];
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h4 className="h-float mb-4">{title}</h4>
      <div className="row">
        {larps.map((larp) => (
          <LarpCard
            larp={larp}
            locale={locale}
            key={larp.id}
            messages={messages}
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

  const [larps, page] = await Promise.all([
    getHomePageData(),
    prisma.page.findUnique({
      where: { slug_language: { slug, language: locale } },
    }),
  ]);

  const candidateLarps = larps.filter(
    (larp) => larp.openness !== Openness.INVITE_ONLY && !!larp.startsAt
  );
  const [otherEvents, actualLarps] = partition(
    candidateLarps,
    (larp) => larp.type === LarpType.OTHER_EVENT
  );
  const upcomingOtherEvents = otherEvents.filter(
    (larp) => ensureEndsAt(larp)! >= now
  );
  const [pastLarps, upcomingLarps] = partition(
    actualLarps,
    (larp) => ensureEndsAt(larp)! < now
  );
  const [ongoingSignupLarps, otherUpcomingLarps] = partition(
    upcomingLarps,
    (larp) => isSignupOpenOrOpeningSoon(larp) // avoid index at 2nd arg
  );
  pastLarps.splice(limitPastLarps, pastLarps.length - limitPastLarps);

  return (
    <div className="container">
      <div className="text-center mb-4">
        <h2 className="mt-5">{translations.title}</h2>
        <p className="fs-5 fst-italic h-float">
          {translations.HomePage.tagline}
        </p>
      </div>

      {page && (
        <Card className="mb-5">
          <CardBody>
            <Markdown input={page.content} />
          </CardBody>
        </Card>
      )}

      {ongoingSignupLarps.length > 0 && (
        <Section
          title={t.sections.ongoingSignup}
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
        />
      )}
      {pastLarps.length > 0 && (
        <Section
          title={t.sections.past}
          larps={pastLarps}
          locale={locale}
          messages={translations.Larp}
        >
          <Link href="/larp" className="link-subtle">
            {translations.Larp.listTitle}…
          </Link>
        </Section>
      )}
    </div>
  );
}
