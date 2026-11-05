import { FormattedDateRange } from "@/components/FormattedDates";
import { ReactNode } from "react";

import { formatShortDateRange } from "@/helpers/dates";
import { splitRunSuffix } from "@/helpers/larpName";
import { getLarpHref } from "@/models/Larp.client";
import { Language, LarpType } from "@/prisma/enums";
import type { Larp, Municipality } from "@/prisma/models";
import type { Translations } from "@/translations/en";
import { LarpStatusPill } from "./StatusPill";
import Link from "next/link";

export type LarpRowLarp = Pick<
  Larp,
  | "id"
  | "alias"
  | "name"
  | "type"
  | "language"
  | "tagline"
  | "startsAt"
  | "endsAt"
  | "openness"
  | "signupStartsAt"
  | "signupEndsAt"
  | "cancelledAt"
> & {
  municipality: Pick<Municipality, "nameFi"> | null;
};

export function LarpName({ name }: { name: string }) {
  const split = splitRunSuffix(name);
  return (
    <>
      {split.name}
      {split.suffix && (
        <>
          {" "}
          <span className="lf-row__suffix">{split.suffix}</span>
        </>
      )}
    </>
  );
}

function isCampaign(type: LarpType) {
  return type === LarpType.CAMPAIGN_LARP || type === LarpType.CAMPAIGN;
}

interface Props {
  larp: LarpRowLarp;
  locale: string;
  messages: Translations["Larp"];
  /** "short" drops the year, for rows under a year heading. */
  dateFormat?: "full" | "short";
  /** Puts the tagline on its own line instead of after the municipality. */
  prominentTagline?: boolean;
  past?: boolean;
  /** Replaces the status pill on the right. */
  aside?: ReactNode;
}

export default function LarpRow({
  larp,
  locale,
  messages: t,
  dateFormat = "full",
  prominentTagline = false,
  past = false,
  aside,
}: Props) {
  const subParts: ReactNode[] = [];
  if (larp.municipality?.nameFi) subParts.push(larp.municipality.nameFi);
  if (larp.language !== Language.fi) {
    subParts.push(t.attributes.language.choices[larp.language]);
  }
  if (isCampaign(larp.type)) {
    subParts.push(
      <span className="lf-campaign">
        {t.attributes.type.choices[larp.type].title}
      </span>,
    );
  }
  if (larp.tagline && !prominentTagline) subParts.push(larp.tagline);

  const classNames = ["lf-row"];
  if (larp.cancelledAt) classNames.push("lf-row--cancelled");
  else if (past) classNames.push("lf-row--past");
  if (!prominentTagline) classNames.push("lf-row--compact-padding");

  return (
    <Link
      href={getLarpHref(larp)}
      className={classNames.join(" ")}
      lang={larp.language === Language.OTHER ? undefined : larp.language}
    >
      <div className="lf-row__date">
        {dateFormat === "short" ? (
          <time dateTime={larp.startsAt ?? undefined}>
            {formatShortDateRange(larp.startsAt, larp.endsAt, locale)}
          </time>
        ) : (
          <FormattedDateRange
            locale={locale}
            start={larp.startsAt}
            end={larp.endsAt}
          />
        )}
      </div>
      <div className="lf-row__main">
        <div className="lf-row__title">
          <LarpName name={larp.name} />
        </div>
        {subParts.length > 0 && (
          <div className="lf-row__sub">
            {subParts.map((part, index) => (
              <span key={index}>
                {index > 0 && " · "}
                {part}
              </span>
            ))}
          </div>
        )}
        {prominentTagline && larp.tagline && (
          <div className="lf-row__tagline">{larp.tagline}</div>
        )}
      </div>
      <div className="lf-row__aside">
        {aside ??
          (!past && (
            <LarpStatusPill larp={larp} messages={t} locale={locale} />
          ))}
      </div>
    </Link>
  );
}
