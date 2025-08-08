import { FormattedDateRange } from "@/components/FormattedDateRange";
import { Larp } from "@/generated/prisma";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import Link from "next/link";
import { CardBody, CardText, CardTitle } from "react-bootstrap";
import Card from "react-bootstrap/Card";

interface Props {
  params: Promise<{ locale: string }>;
}

function AddLarpLink({ children }: { children: React.ReactNode }) {
  return <Link href="/larp/new">{children}</Link>;
}

function LarpCard({ larp, locale }: { larp: Larp; locale: string }) {
  const href = larp.alias ? `/${larp.alias}` : `/larp/${larp.id}`;
  return (
    <div className="col-3 mb-4">
      <Card
        as={Link}
        className="w-100 h-100 link-xxsubtle"
        href={href}
        lang={larp.language}
      >
        <CardBody>
          <CardTitle>{larp.name}</CardTitle>
          <CardText>
            <FormattedDateRange
              locale={locale}
              start={larp.startsAt}
              end={larp.endsAt}
            />
          </CardText>
          <CardText className="fst-italic" style={{ fontSize: "0.9rem" }}>
            {larp.tagline}
          </CardText>
        </CardBody>
      </Card>
    </div>
  );
}

function Section({
  title,
  larps,
  locale,
}: {
  title: string;
  larps: Larp[];
  locale: string;
}) {
  return (
    <>
      <h4 className="h-float mt-5">{title}</h4>
      <div className="mt-3 row">
        {larps.map((larp) => (
          <LarpCard larp={larp} locale={locale} key={larp.id} />
        ))}
      </div>
    </>
  );
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.Home;

  const larps = await prisma.larp.findMany({
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="container">
      <Card className="mt-3 mb-5">
        <CardBody>
          <CardTitle as={"h3"}>
            {translations.brand}{" "}
            <span className="fs-5 text-muted">{t.tagline}</span>
          </CardTitle>
          <div className="card-text">{t.introduction(AddLarpLink)}</div>
        </CardBody>
      </Card>

      <Section title={t.sections.ongoingSignup} larps={larps} locale={locale} />
      <Section title={t.sections.upcoming} larps={larps} locale={locale} />
      <Section title={t.sections.past} larps={larps} locale={locale} />
    </div>
  );
}
