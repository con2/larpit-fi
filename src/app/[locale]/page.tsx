import LarpCard from "@/components/LarpCard";
import { PrivacyPolicyLink } from "@/components/LoginLink";
import { LarpType } from "@/generated/prisma";
import { isSignupOpenOrOpeningSoon } from "@/helpers/isSignupOpen";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import Link from "next/link";
import { CardBody, CardTitle } from "react-bootstrap";
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
    },
  });
}

type HomePageLarp = Awaited<ReturnType<typeof getHomePageData>>[number];

function AddLarpLink({ children }: { children: React.ReactNode }) {
  return <Link href="/larp/new">{children}</Link>;
}

function Section({
  title,
  larps,
  locale,
  messages,
}: {
  title: string;
  larps: HomePageLarp[];
  locale: string;
  messages: Translations["Larp"];
}) {
  return (
    <>
      <h4 className="h-float mb-4">{title}</h4>
      <div className="mb-5 row">
        {larps.map((larp) => (
          <LarpCard
            larp={larp}
            locale={locale}
            key={larp.id}
            messages={messages}
          />
        ))}
      </div>
    </>
  );
}

function ensureEndsAt(larp: {
  startsAt: Date | null;
  endsAt: Date | null;
}): Date | null {
  if (larp.endsAt) {
    return larp.endsAt;
  }
  if (larp.startsAt) {
    // assume ending at 8PM Europe/Helsinki same day
    const endDate = new Date(larp.startsAt);
    endDate.setHours(20, 0, 0, 0);
    return endDate;
  }
  return null;
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.HomePage;
  const now = new Date();

  const larps = await getHomePageData();

  const larpsWithStartDates = larps.filter((larp) => larp.startsAt);
  const [pastLarps, futureLarps] = partition(
    larpsWithStartDates,
    (larp) => ensureEndsAt(larp)! < now
  );
  const [ongoingSignupLarps, otherFutureLarps] = partition(
    futureLarps,
    (larp) => isSignupOpenOrOpeningSoon(larp) // avoid index at 2nd arg
  );
  pastLarps.reverse();

  return (
    <div className="container">
      <Card className="mt-3 mb-5">
        <CardBody>
          <CardTitle as={"h3"}>
            {translations.brand}{" "}
            <span className="fs-5 text-muted">{t.tagline}</span>
          </CardTitle>
          <div className="card-text">
            {t.introduction(AddLarpLink, PrivacyPolicyLink)}
          </div>
        </CardBody>
      </Card>

      <Section
        title={t.sections.ongoingSignup}
        larps={ongoingSignupLarps}
        locale={locale}
        messages={translations.Larp}
      />
      <Section
        title={t.sections.upcoming}
        larps={otherFutureLarps}
        locale={locale}
        messages={translations.Larp}
      />
      <Section
        title={t.sections.past}
        larps={pastLarps}
        locale={locale}
        messages={translations.Larp}
      />
    </div>
  );
}
