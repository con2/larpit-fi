import LarpCard from "@/components/LarpCard";
import Markdown from "@/components/Markdown";
import { LarpType } from "@/generated/prisma";
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

async function getHomePageData() {
  return prisma.larp.findMany({
    where: {
      startsAt: {
        not: null,
      },
      type: {
        not: {
          in: [LarpType.OTHER_EVENT, LarpType.OTHER_EVENT_SERIES],
        },
      },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
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

  const [larps, page] = await Promise.all([
    getHomePageData(),
    prisma.page.findUnique({
      where: { slug_language: { slug, language: locale } },
    }),
  ]);

  const larpsWithStartDates = larps.filter((larp) => larp.startsAt);
  const [pastLarps, futureLarps] = partition(
    larpsWithStartDates,
    (larp) => ensureEndsAt(larp)! < now
  );
  const [ongoingSignupLarps, otherFutureLarps] = partition(
    futureLarps,
    (larp) => isSignupOpenOrOpeningSoon(larp) // avoid index at 2nd arg
  );
  pastLarps.reverse().splice(limitPastLarps, pastLarps.length - limitPastLarps);

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
      {otherFutureLarps.length > 0 && (
        <Section
          title={
            // some may call it overkill
            // we call it attention to detail
            ongoingSignupLarps.length > 0
              ? t.sections.upcomingWhenOngoingSignupPresent
              : t.sections.upcomingWhenNoOngoingSignupPresent
          }
          larps={otherFutureLarps}
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
