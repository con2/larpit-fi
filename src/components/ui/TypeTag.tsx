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
}

export default function TypeTag({ type, messages, small }: Props) {
  return (
    <span
      className={`lf-tag lf-tag--${variantByType[type]}${small ? " lf-tag--small" : ""}`}
    >
      {messages.attributes.type.choices[type].title}
    </span>
  );
}
