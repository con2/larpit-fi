import { auth } from "@/auth";
import { featureFlags } from "@/config";
import {
  EditStatus,
  LarpLink,
  LocalSignupStatus,
  RelatedUserRole,
} from "@/generated/prisma/client";
import { ensureLocation } from "@/models/Larp";
import {
  getDeleteLarpInitialStatusForUser,
  getEditLarpInitialStatusForUserAndLarp,
  getLocalSignupStatusForUser,
  getUserFromSession,
  isGmOrModerator,
} from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { Translations } from "@/translations/en";
import {
  AlertNavigateOnClose,
  Column,
  FormattedDateRange,
  Markdown,
  Paragraphs,
} from "@con2/components";
import { InfoCircle, OpenInNewTab } from "@con2/components/icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import {
  Card,
  CardBody,
  CardText,
  CardTitle,
  Container,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
import LarpJsonLd from "./LarpJsonLd";
import {
  LeftRelatedLarpComponent,
  RightRelatedLarpComponent,
} from "./related/RelatedLarpComponent";

export const relatedLarpInclude = {
  select: {
    id: true,
    alias: true,
    name: true,
  },
} as const;

export async function getLarpPageData(
  where: { id: string } | { alias: string },
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

export type LarpPageLarp = NonNullable<
  Awaited<ReturnType<typeof getLarpPageData>>
>;

function LarpLinkComponent({
  link,
  messages: t,
}: {
  link: LarpLink;
  messages: Translations["Larp"];
}) {
  return (
    <div>
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

function ChoiceWithDescription({
  choices,
  value,
}: {
  choices: Record<string, { title: string; description: string }>;
  value: string;
}) {
  const title = choices[value]?.title || value;
  const description = choices[value]?.description;
  return (
    <div>
      {title}
      {description && (
        <>
          {" "}
          <OverlayTrigger overlay={<Tooltip>{description}</Tooltip>}>
            <InfoCircle />
          </OverlayTrigger>
        </>
      )}
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

  // Show the full sign-up period and its status whenever either end is set.
  // Unlike the space-optimized front-page badge, this stays visible even when
  // sign-up is not in progress or opening soon. An unbounded end is treated as
  // ending on the larp's start date.
  if (larp.signupStartsAt || larp.signupEndsAt) {
    const now = new Date();
    const signupEffectiveEnd = larp.signupEndsAt ?? larp.startsAt;
    const signupChoices = t.attributes.signupStatus.choices;

    let signupStatusLabel: ReactNode;
    let signupInProgress = false;
    if (larp.signupStartsAt && now < larp.signupStartsAt) {
      signupStatusLabel = signupChoices.upcoming;
    } else if (signupEffectiveEnd && now > signupEffectiveEnd) {
      signupStatusLabel = signupChoices.closed;
    } else {
      signupStatusLabel = signupChoices.inProgress;
      signupInProgress = true;
    }

    fields.push({
      slug: "signupStatus",
      title: t.attributes.signupStatus.title,
      getCellContents: () => (
        <span className={signupInProgress ? "fw-bold text-success" : undefined}>
          {signupStatusLabel} (
          <FormattedDateRange
            locale={locale}
            start={larp.signupStartsAt}
            end={larp.signupEndsAt ?? larp.startsAt}
          />
          )
        </span>
      ),
    });
  }

  fields.push(
    {
      slug: "type",
      title: t.attributes.type.title,
      getCellContents: (larp) => (
        <ChoiceWithDescription
          choices={t.attributes.type.choices}
          value={larp.type}
        />
      ),
    },
    {
      slug: "language",
      title: t.attributes.language.title,
      getCellContents: (larp) =>
        t.attributes.language.choices[larp.language] || larp.language,
    },
  );

  if (larp.openness) {
    fields.push({
      slug: "openness",
      title: t.attributes.openness.title,
      getCellContents: (larp) => (
        <ChoiceWithDescription
          choices={t.attributes.openness.choices}
          value={larp.openness!}
        />
      ),
    });
  }

  const numParticipants = t.attributes.numParticipants.format(
    larp.numPlayerCharacters,
    larp.numTotalParticipants,
  );
  if (numParticipants) {
    fields.push({
      slug: "numParticipants",
      title: t.attributes.numParticipants.title,
      getCellContents: () => numParticipants,
    });
  }

  const hasRelatedLarps =
    larp.relatedLarpsLeft.length + larp.relatedLarpsRight.length > 0;
  if (hasRelatedLarps) {
    fields.push({
      slug: "relatedLarps",
      title: t.attributes.relatedLarps.title,
      getCellContents: (larp) => (
        <>
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
        </>
      ),
    });
  }

  if (larp.links.length > 0) {
    fields.push({
      slug: "links",
      title: t.attributes.links.title,
      getCellContents: (larp) => (
        <>
          {larp.links.map((link) => (
            <LarpLinkComponent key={link.id} link={link} messages={t} />
          ))}
        </>
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
  code?: string;
  signupVerified?: boolean;
}

export default async function LarpPage({
  larpPromise,
  locale,
  code,
  signupVerified,
}: Props) {
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
  const deleTe = translations.DeleteLarpPage;
  const signupT = translations.LocalSignupPage;

  // Fetch the current user's LOCAL_SIGNUP_* role for this larp (not in getLarpPageData since relatedUsers is filtered to GAME_MASTER)
  const userSignupRelatedUser = user
    ? await prisma.relatedUser.findFirst({
        where: {
          larpId: larp.id,
          userId: user.id,
          role: {
            in: [
              RelatedUserRole.LOCAL_SIGNUP_YES,
              RelatedUserRole.LOCAL_SIGNUP_MAYBE,
              RelatedUserRole.LOCAL_SIGNUP_NO,
            ],
          },
        },
        select: { userId: true, role: true },
      })
    : null;

  const signupCheckRelatedUsers = [
    ...larp.relatedUsers,
    ...(userSignupRelatedUser ? [userSignupRelatedUser] : []),
  ];

  const signupStatus = getLocalSignupStatusForUser(
    user,
    { ...larp, relatedUsers: signupCheckRelatedUsers },
    code ?? null,
  );

  const signupHref = code
    ? `/larp/${larp.id}/signup?code=${encodeURIComponent(code)}`
    : `/larp/${larp.id}/signup`;

  const SignupButton = ({
    variant = "secondary",
    title,
    callToAction,
    href,
  }: {
    variant: "primary" | "secondary" | "success" | "danger" | "warning";
    title: string;
    callToAction?: string;
    href?: string;
  }) => {
    if (!href) {
      return (
        <Card>
          <CardBody className={`text-${variant}`}>
            <CardTitle className="mb-0 text-center">{title}</CardTitle>
            {callToAction && (
              <CardText className="mt-3">{callToAction}</CardText>
            )}
          </CardBody>
        </Card>
      );
    }

    return (
      <Link
        href={signupHref}
        className={`btn btn-outline-${variant} p-3 w-100 bg-white`}
      >
        <CardTitle className="mb-0">{title}</CardTitle>
        {callToAction && <CardText className="mt-2">{callToAction}</CardText>}
      </Link>
    );
  };

  let signupCard: ReactNode = null;
  if (signupStatus === "CANCELLED") {
    signupCard = (
      <SignupButton
        variant="danger"
        title={signupT.userSignupStatus.choices.CANCELLED}
      />
    );
  } else if (signupStatus === "CAN_SIGN_UP") {
    signupCard = (
      <SignupButton
        variant="primary"
        title={signupT.userSignupStatus.choices.CAN_SIGN_UP}
        callToAction={signupT.userSignupStatus.actions.signUp}
        href={signupHref}
      />
    );
  } else if (signupStatus === "LOCAL_SIGNUP_YES") {
    signupCard = (
      <SignupButton
        variant="success"
        title={signupT.userSignupStatus.choices.LOCAL_SIGNUP_YES}
        callToAction={signupT.userSignupStatus.actions.change}
        href={signupHref}
      />
    );
  } else if (signupStatus === "LOCAL_SIGNUP_MAYBE") {
    signupCard = (
      <SignupButton
        variant="warning"
        title={signupT.userSignupStatus.choices.LOCAL_SIGNUP_MAYBE}
        callToAction={signupT.userSignupStatus.actions.change}
        href={signupHref}
      />
    );
  } else if (signupStatus === "LOCAL_SIGNUP_NO") {
    signupCard = (
      <SignupButton
        variant="danger"
        title={signupT.userSignupStatus.choices.LOCAL_SIGNUP_NO}
        callToAction={signupT.userSignupStatus.actions.change}
        href={signupHref}
      />
    );
  }

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

  let gmity: ReactNode;
  if (
    larp.relatedUsers.some(
      (related) =>
        related.userId === user?.id &&
        related.role === RelatedUserRole.GAME_MASTER,
    )
  ) {
    gmity = <>✅ {larpT.attributes.isClaimedByGm.youAreTheGm}</>;
  } else if (
    larp.relatedUsers.some(
      (related) => related.role === RelatedUserRole.GAME_MASTER,
    )
  ) {
    gmity = <>✅ {larpT.attributes.isClaimedByGm.message}</>;
  } else {
    gmity = <>⚠️ {t.actions.claim(ClaimLink)}</>;
  }

  const editPolicy = getEditLarpInitialStatusForUserAndLarp(user, larp);
  const deletePolicy = getDeleteLarpInitialStatusForUser(user);

  return (
    <>
      <LarpJsonLd larp={larp} />
      <Container className="mb-5">
        <div className="text-center" lang={larp.language}>
          <h2 className="mt-5 mb-3">{larp.name}</h2>
          <p className="fs-5 fst-italic h-float">{larp.tagline}</p>
        </div>
      </Container>
      {signupCard && (
        <Container className="mb-3" style={{ maxWidth: "800px" }}>
          {signupVerified && (
            <AlertNavigateOnClose variant="success">
              {signupT.signupVerified}
            </AlertNavigateOnClose>
          )}
          {signupCard}
        </Container>
      )}
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
        {featureFlags.localSignup &&
          larp.localSignupStatus !== LocalSignupStatus.DISABLED && (
            <div className="mb-2 form-text">
              👥{" "}
              <Link href={`/larp/${larp.id}/roles`} className="link-subtle">
                {translations.RolesPage.title}
              </Link>
            </div>
          )}
        {editPolicy && (
          <>
            <div className="mb-2 form-text">
              ✏️{" "}
              <Link href={`/larp/${larp!.id}/edit`} className="link-subtle">
                {t.actions.edit}
              </Link>
              : {ediT.policy[editPolicy]}
            </div>
            <div className="mb-2 form-text">
              🔗{" "}
              <Link href={`/larp/${larp!.id}/related`} className="link-subtle">
                {t.actions.manageRelatedLarps}
              </Link>
              : {ediT.policy[editPolicy]}
            </div>
            {featureFlags.localSignup && isGmOrModerator(user, larp) && (
              <div className="mb-2 form-text">
                ⚙️{" "}
                <Link
                  href={`/larp/${larp.id}/signup/settings`}
                  className="link-subtle"
                >
                  {t.actions.manageSignupSettings}
                </Link>
              </div>
            )}
          </>
        )}
        {deletePolicy && (
          <div className="mb-2 form-text">
            🗑️{" "}
            <Link href={`/larp/${larp.id}/delete`} className="link-subtle">
              {deletePolicy === EditStatus.APPROVED
                ? t.actions.adminDelete
                : t.actions.delete}
            </Link>
            : {deleTe.policy[deletePolicy]}
          </div>
        )}
      </Container>
    </>
  );
}
