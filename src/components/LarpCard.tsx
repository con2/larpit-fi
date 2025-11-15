import { FormattedDate } from "@/components/FormattedDate";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import { Larp, LarpType, Openness } from "@/generated/prisma";
import getLarpHref, { isSignupOpen, isSignupOpeningSoon } from "@/models/Larp";
import type { Translations } from "@/translations/en";
import Link from "next/link";
import { ReactNode } from "react";
import {
  Badge,
  BadgeProps,
  CardBody,
  CardText,
  CardTitle,
} from "react-bootstrap";
import Card from "react-bootstrap/Card";

type LarpCardLarp = Pick<
  Larp,
  | "id"
  | "name"
  | "startsAt"
  | "endsAt"
  | "tagline"
  | "signupStartsAt"
  | "signupEndsAt"
  | "language"
  | "alias"
  | "openness"
  | "type"
>;

function SignupLabel({
  larp,
  messages,
  locale,
}: {
  larp: LarpCardLarp;
  messages: Translations["Larp"];
  locale: string;
}) {
  const t = messages.attributes.signupOpen;
  let content: ReactNode | null = null;
  let variant: BadgeProps["bg"] = "secondary";
  if (larp.openness === Openness.INVITE_ONLY) {
    variant = "danger";
    content = t.inviteOnly;
  } else if (isSignupOpen(larp)) {
    variant = "success";
    if (larp.signupEndsAt) {
      content = t.openUntil(
        <FormattedDate date={larp.signupEndsAt} locale={locale} />
      );
    } else {
      content = t.openIndefinitely;
    }
  } else if (isSignupOpeningSoon(larp)) {
    variant = "primary";
    content = (
      <>
        {t.opensAt(
          <FormattedDate date={larp.signupStartsAt!} locale={locale} />
        )}
      </>
    );
  }

  if (content) {
    return (
      <Badge bg={variant} className="me-2">
        {content}
      </Badge>
    );
  }

  return null;
}

function TypeLabel({
  larp,
  messages,
}: {
  larp: LarpCardLarp;
  messages: Translations["Larp"];
}) {
  const t = messages.attributes.type.choices;

  switch (larp.type) {
    case LarpType.CAMPAIGN_LARP:
      return (
        <Badge bg="primary" className="me-2">
          {t.CAMPAIGN_LARP.title}
        </Badge>
      );
    case LarpType.OTHER_EVENT:
      return (
        <Badge bg="info" className="me-2">
          {t[larp.type].title}
        </Badge>
      );
    default:
      return null;
  }
}

interface Props {
  larp: LarpCardLarp;
  messages: Translations["Larp"];
  locale: string;
}

export default function LarpCard({ larp, locale, messages: t }: Props) {
  return (
    <div className="col-xl-3 col-lg-4 mb-4">
      <Card
        as={Link}
        className="w-100 h-100 link-xxsubtle"
        href={getLarpHref(larp)}
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
          <TypeLabel larp={larp} messages={t} />
          <SignupLabel larp={larp} messages={t} locale={locale} />
        </CardBody>
      </Card>
    </div>
  );
}
