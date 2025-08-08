import { FormattedDateRange } from "@/components/FormattedDateRange";
import { LarpLink, PrismaClient } from "@/generated/prisma";
import { getTranslations } from "@/translations";
import { Translations } from "@/translations/en";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardBody, CardTitle } from "react-bootstrap";

const prisma = new PrismaClient();

interface Props {
  locale: string;
  larpId: string;
}

function LarpLinkComponent({
  link,
  messages,
}: {
  link: LarpLink;
  messages: Translations["LarpPage"];
}) {
  return (
    <div className="mb-1">
      <a
        className="link-subtle"
        href={link.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {link.title || messages.links[link.type] || link.type}
      </a>
    </div>
  );
}

export default async function LarpPage({ larpId, locale }: Props) {
  const translations = getTranslations(locale);
  const t = translations.LarpPage;
  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    include: { links: true },
  });
  if (!larp) {
    notFound();
  }
  return (
    <>
      <div className="container">
        <div className="text-center">
          <div lang={larp.language}>
            <h2 className="mt-5">{larp.name}</h2>
            <p className="fs-5 fst-italic h-float">{larp.tagline}</p>
          </div>
          <p className="fs-5">
            <FormattedDateRange
              locale={locale}
              start={larp.startsAt}
              end={larp.endsAt}
            />{" "}
            {larp.locationText}
          </p>
          {larp.links.map((link) => (
            <LarpLinkComponent key={link.id} link={link} messages={t} />
          ))}
        </div>
      </div>
      <div className="container" style={{ maxWidth: "800px" }}>
        <Card className="mt-5 mb-5">
          <CardBody>
            <CardTitle>{t.actions.claim.title}</CardTitle>
            {t.actions.claim.message}
            <Link href={`/larp/${larp.id}/claim`} className="btn btn-primary">
              {t.actions.claim.label}…
            </Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
