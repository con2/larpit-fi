import { auth } from "@/auth";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import { LarpLink, LarpType, RelatedUserRole } from "@/generated/prisma/client";
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
        {link.title || t.attributes.links.types[link.type]?.title || link.type}
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
      <span className="text-muted">
        {t.attributes.leftRelatedLarps.types[relatedLarp.type] ||
          relatedLarp.type}
      </span>{" "}
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
      <span className="text-muted">
        {t.attributes.rightRelatedLarps.types[relatedLarp.type] ||
          relatedLarp.type}
      </span>
    </div>
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

  const location = ensureLocation(larp);
  const policy = getEditLarpInitialStatusForUserAndLarp(user, larp);

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
            {location && (
              <span lang={location.language}> {location.location}</span>
            )}
          </p>
          {larp.type !== LarpType.ONE_SHOT ? (
            <p className="text-muted">
              {larpT.attributes.type.choices[larp.type].title}
            </p>
          ) : null}
          {larp.numPlayerCharacters || larp.numTotalParticipants ? (
            <p className="text-muted">
              {larpT.attributes.numParticipants(
                larp.numPlayerCharacters,
                larp.numTotalParticipants
              )}
            </p>
          ) : null}
          <div className="mb-3">
            {larp.relatedLarpsLeft.map((relatedLarp) => (
              <LeftRelatedLarpComponent
                key={relatedLarp.rightId}
                relatedLarp={relatedLarp}
                messages={translations.Larp}
              />
            ))}
            {larp.relatedLarpsRight.map((relatedLarp) => (
              <RightRelatedLarpComponent
                key={relatedLarp.leftId}
                relatedLarp={relatedLarp}
                messages={translations.Larp}
              />
            ))}
          </div>
          <div className="mb-5">
            {larp.links.map((link) => (
              <LarpLinkComponent
                key={link.id}
                link={link}
                messages={translations.Larp}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="container mb-5" style={{ maxWidth: "800px" }}>
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
      </div>
    </>
  );
}
