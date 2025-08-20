import { FormattedDateRange } from "@/components/FormattedDateRange";
import { LarpLink, LarpType, PrismaClient } from "@/generated/prisma";
import getLarpHref from "@/models/Larp";
import { getTranslations } from "@/translations";
import { Translations } from "@/translations/en";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import Markdown from "./Markdown";
import Paragraphs from "./Paragraphs";

const prisma = new PrismaClient();

const relatedLarpInclude = {
  select: {
    id: true,
    alias: true,
    name: true,
  },
} as const;

const include = {
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
    select: { id: true },
  },
} as const;

export async function getLarpPageData(
  where: { id: string } | { alias: string }
) {
  return prisma.larp.findUnique({ where, include });
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
  const larp = await larpPromise;
  if (!larp) {
    notFound();
  }

  const translations = getTranslations(locale);
  const t = translations.LarpPage;
  const larpT = translations.Larp;

  function ClaimLink({ children }: { children: ReactNode }) {
    return (
      <Link href={`/larp/${larp!.id}/claim`} className="link-subtle">
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

  const isClaimedByGm = larp.relatedUsers.length > 0;

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
          {larp.type !== LarpType.ONE_SHOT ? (
            <p className="text-muted">
              {larpT.attributes.type.choices[larp.type].label}
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
        <div className="mb-2 form-text">
          {isClaimedByGm ? (
            <>✅ {larpT.attributes.isClaimedByGm.message}</>
          ) : (
            <>⚠️ {t.actions.claim(ClaimLink)}</>
          )}
        </div>
        <div className="mb-2 form-text">
          ⚠️ {t.actions.suggestEdit(EditLink)}
        </div>
      </div>
    </>
  );
}
