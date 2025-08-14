import { FormattedDate } from "@/components/FormattedDate";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import { Larp } from "@/generated/prisma";
import getLarpHref from "@/helpers/getLarpHref";
import { isSignupOpen, isSignupOpeningSoon } from "@/helpers/isSignupOpen";
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
>;

function SignupOpen({
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
  if (isSignupOpen(larp)) {
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
    return <Badge bg={variant}>{content}</Badge>;
  }

  return null;
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
          <SignupOpen larp={larp} messages={t} locale={locale} />
        </CardBody>
      </Card>
    </div>
  );
}
