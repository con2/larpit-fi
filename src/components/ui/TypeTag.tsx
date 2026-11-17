import Link from "next/link";

import { LarpType } from "@/prisma/enums";
import type { Translations } from "@/translations/en";

const variantByType: Record<LarpType, string> = {
  [LarpType.ONE_SHOT]: "one-shot",
  [LarpType.MULTIPLE_RUNS]: "one-shot",
  [LarpType.CAMPAIGN_LARP]: "campaign",
  [LarpType.CAMPAIGN]: "campaign",
  [LarpType.OTHER_EVENT]: "event",
  [LarpType.OTHER_EVENT_SERIES]: "event",
};

interface Props {
  type: LarpType;
  messages: Translations["Larp"];
  small?: boolean;
  /** Makes the tag a link; leave out inside another link. */
  href?: string;
}

export default function TypeTag({ type, messages, small, href }: Props) {
  const className = `lf-tag lf-tag--${variantByType[type]}${small ? " lf-tag--small" : ""}`;
  const title = messages.attributes.type.choices[type].title;
  return href ? (
    <Link href={href} className={`${className} lf-tag--link`}>
      {title}
    </Link>
  ) : (
    <span className={className}>{title}</span>
  );
}
