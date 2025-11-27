import { auth } from "@/auth";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import { LarpLink, RelatedUserRole } from "@/generated/prisma/client";
import getLarpHref, { ensureLocation } from "@/models/Larp";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getUserFromSession,
} from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { Translations } from "@/translations/en";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { Card, CardBody, Container, Row } from "react-bootstrap";
import { Column } from "./DataTable";
import OpenInNewTab from "./google-material-symbols/OpenInNewTab";
import Markdown from "./Markdown";
import Paragraphs from "./Paragraphs";

const relatedLarpInclude = {
  select: {
    id: true,
    alias: true,
    name: true,
  },
} as const;

export async function getLarpPageData(
  where: { id: string } | { alias: string }
) {
  return prisma.larp.findUnique({
    where,
    include: {
      links: true,
      relatedLarpsLeft: {
        include: { right: relatedLarpInclude },
        orderBy: { right: { startsAt: "asc" } },
      },
      relatedLarpsRight: {
        include: { left: relatedLarpInclude },
        orderBy: { left: { startsAt: "asc" } },
      },
      relatedUsers: {
        where: { role: "GAME_MASTER" },
        select: { userId: true, role: true },
      },
      municipality: {
        select: { nameFi: true, nameOther: true, nameOtherLanguageCode: true },
      },
    },
  });
}

type LarpPageLarp = NonNullable<Awaited<ReturnType<typeof getLarpPageData>>>;
type RelatedLarpLeft = LarpPageLarp["relatedLarpsLeft"][number];
type RelatedLarpRight = LarpPageLarp["relatedLarpsRight"][number];

function LarpLinkComponent({
  link,
  messages: t,
}: {
  link: LarpLink;
  messages: Translations["Larp"];
}) {
  return (
    <div className="mb-1">
      <a
        className="link-subtle"
        href={link.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {link.title || t.attributes.links.types[link.type]?.title || link.type}{" "}
        <OpenInNewTab />
      </a>
    </div>
  );
}

function LeftRelatedLarpComponent({
  relatedLarp,
  messages: t,
}: {
  relatedLarp: RelatedLarpLeft;
  messages: Translations["Larp"];
}) {
  return (
    <div className="mb-1">
      {t.attributes.leftRelatedLarps.types[relatedLarp.type] ||
        relatedLarp.type}{" "}
      <Link href={getLarpHref(relatedLarp.right)} className="link-subtle">
        {relatedLarp.right?.name}
      </Link>
    </div>
  );
}

function RightRelatedLarpComponent({
  relatedLarp,
  messages: t,
}: {
  relatedLarp: RelatedLarpRight;
  messages: Translations["Larp"];
}) {
  return (
    <div className="mb-1">
      <Link href={getLarpHref(relatedLarp.left)} className="link-subtle">
        {relatedLarp.left?.name}
      </Link>{" "}
      {t.attributes.rightRelatedLarps.types[relatedLarp.type] ||
        relatedLarp.type}
    </div>
  );
}

function LarpInfoCard({
  larp,
  className = "",
  messages: t,
  locale,
}: {
  larp: LarpPageLarp;
  className: string;
  messages: Translations["Larp"];
  locale: string;
}) {
  const fields: Column<LarpPageLarp>[] = [];

  const location = ensureLocation(larp);
  if (location) {
    fields.push({
      slug: "location",
      title: t.attributes.locationText.title,
      getCellContents: () => (
        <span lang={location.language}>{location.location}</span>
      ),
    });
  }

  if (larp.startsAt || larp.endsAt) {
    fields.push({
      slug: "dates",
      title: t.attributes.dateRange.title,
      getCellContents: (larp) => (
        <FormattedDateRange
          locale={locale}
          start={larp.startsAt}
          end={larp.endsAt}
        />
      ),
    });
  }

  fields.push(
    {
      slug: "type",
      title: t.attributes.type.title,
      getCellContents: (larp) =>
        t.attributes.type.choices[larp.type]?.title || larp.type,
    },
    {
      slug: "language",
      title: t.attributes.language.title,
      getCellContents: (larp) =>
        t.attributes.language.choices[larp.language] || larp.language,
    }
  );

  if (larp.openness) {
    fields.push({
      slug: "openness",
      title: t.attributes.openness.title,
      getCellContents: (larp) =>
        t.attributes.openness.choices[larp.openness!] || larp.openness,
    });
  }

  const numParticipants = t.attributes.numParticipants.format(
    larp.numPlayerCharacters,
    larp.numTotalParticipants
  );
  if (numParticipants) {
    fields.push({
      slug: "numParticipants",
      title: t.attributes.numParticipants.title,
      getCellContents: () => numParticipants,
    });
  }

  if (larp.links.length > 0) {
    fields.push({
      slug: "links",
      title: t.attributes.links.title,
      getCellContents: (larp) => (
        <div>
          {larp.links.map((link) => (
            <LarpLinkComponent key={link.id} link={link} messages={t} />
          ))}
        </div>
      ),
    });
  }

  if (larp.relatedLarpsLeft.length + larp.relatedLarpsRight.length > 0) {
    fields.push({
      slug: "relatedLarps",
      title: t.attributes.relatedLarps.title,
      getCellContents: (larp) => (
        <div>
          {larp.relatedLarpsLeft.map((relatedLarp) => (
            <LeftRelatedLarpComponent
              key={relatedLarp.rightId}
              relatedLarp={relatedLarp}
              messages={t}
            />
          ))}
          {larp.relatedLarpsRight.map((relatedLarp) => (
            <RightRelatedLarpComponent
              key={relatedLarp.leftId}
              relatedLarp={relatedLarp}
              messages={t}
            />
          ))}
        </div>
      ),
    });
  }

  return (
    <Container className={className} style={{ maxWidth: "800px" }}>
      <Card>
        <CardBody className="pb-2 small">
          {fields.map(({ slug, title, getCellContents }) => (
            <Row key={slug} className="mb-1">
              <div className="col-sm-3 fw-bold">{title}</div>
              <div className="col-sm-9">
                {getCellContents ? getCellContents(larp) : (larp as any)[slug]}
              </div>
            </Row>
          ))}
        </CardBody>
      </Card>
    </Container>
  );
}

interface Props {
  locale: string;
  larpPromise: ReturnType<typeof getLarpPageData>;
}

export default async function LarpPage({ larpPromise, locale }: Props) {
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

  function ClaimLink({ children }: { children: ReactNode }) {
    return (
      <Link
        href={`/larp/${larp!.id}/edit?role=GAME_MASTER`}
        className="link-subtle"
      >
        {children}
      </Link>
    );
  }

  function EditLink({ children }: { children: ReactNode }) {
    return (
      <Link href={`/larp/${larp!.id}/edit`} className="link-subtle">
        {children}
      </Link>
    );
  }

  let gmity: ReactNode;
  if (
    larp.relatedUsers.some(
      (related) =>
        related.userId === user?.id &&
        related.role === RelatedUserRole.GAME_MASTER
    )
  ) {
    gmity = <>✅ {larpT.attributes.isClaimedByGm.youAreTheGm}</>;
  } else if (
    larp.relatedUsers.some(
      (related) => related.role === RelatedUserRole.GAME_MASTER
    )
  ) {
    gmity = <>✅ {larpT.attributes.isClaimedByGm.message}</>;
  } else {
    gmity = <>⚠️ {t.actions.claim(ClaimLink)}</>;
  }

  const policy = getEditLarpInitialStatusForUserAndLarp(user, larp);

  return (
    <>
      <Container className="mb-5">
        <div className="text-center" lang={larp.language}>
          <h2 className="mt-5 mb-3">{larp.name}</h2>
          <p className="fs-5 fst-italic h-float">{larp.tagline}</p>
        </div>
      </Container>
      <LarpInfoCard
        larp={larp}
        className="mb-5"
        messages={translations.Larp}
        locale={locale}
      />
      <Container className="mb-5" style={{ maxWidth: "800px" }}>
        {larp.fluffText && (
          <div className="mb-5 fst-italic">
            <Paragraphs text={larp.fluffText} />
          </div>
        )}
        {larp.description && (
          <div className="mb-5">
            <Markdown input={larp.description} />
          </div>
        )}
        <div className="mb-2 form-text">{gmity}</div>
        <div className="mb-2 form-text">
          ✏️ {policy && <EditLink>{t.actions.edit}</EditLink>}:{" "}
          {ediT.editPolicy[policy ?? "LOG_IN_TO_EDIT"]}
        </div>
      </Container>
    </>
  );
}
