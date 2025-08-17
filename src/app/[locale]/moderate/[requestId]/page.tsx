import { auth } from "@/auth";
import { FormattedDate } from "@/components/FormattedDate";
import FormattedDateTime from "@/components/FormattedDateTime";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import SubmitButton from "@/components/SubmitButton";
import UnrenderedMarkdown from "@/components/UnrenderedMarkdown";
import { canModerate } from "@/models/User";
import { uuid7ToZonedDateTime } from "@/helpers/temporal";
import { ModerationRequestContent } from "@/models/ModerationRequest";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import {
  Card,
  CardBody,
  CardText,
  CardTitle,
  Container,
  Form,
  FormCheck,
  FormControl,
  FormLabel,
  FormText,
  Row,
} from "react-bootstrap";
import { resolveRequest } from "./actions";
import { EditStatus } from "@/generated/prisma";
import Link from "next/link";
import getLarpHref from "@/models/Larp";

interface Props {
  params: Promise<{ locale: string; requestId: string }>;
}

export default async function ModerationRequestPage({ params }: Props) {
  const { locale, requestId } = await params;

  const translations = getTranslations(locale);
  const t = translations.ModerationRequest;
  const newLarpT = translations.NewLarpPage;
  const larpT = translations.Larp;

  const session = await auth();
  if (!session?.user) {
    return (
      <Container>
        <MainHeading>{t.listTitle}</MainHeading>
        <LoginRequired messages={translations.LoginRequired} />
      </Container>
    );
  }

  const [request, user] = await Promise.all([
    prisma.moderationRequest.findUnique({
      where: {
        id: requestId,
      },
      include: {
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        larp: {
          select: {
            id: true,
            name: true,
            alias: true,
          },
        },
      },
    }),
    session?.user?.email
      ? prisma.user.findUnique({
          where: {
            email: session.user.email,
          },
        })
      : null,
  ]);
  if (!canModerate(user)) {
    return (
      <Container>
        <MainHeading>{t.listTitle}</MainHeading>
        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.errors.insufficientPrivileges.title}</CardTitle>
            <CardText>{t.errors.insufficientPrivileges.message}</CardText>
          </CardBody>
        </Card>
      </Container>
    );
  }
  if (!request) {
    return notFound();
  }

  const newContent = ModerationRequestContent.parse(request.newContent);

  function Empty() {
    return <em className="text-muted">{larpT.attributes.emptyAttribute}</em>;
  }

  function Field({
    title,
    value,
    className = "",
    children,
  }: {
    className?: string;
    title: string;
    value?: ReactNode;
    children?: ReactNode;
  }) {
    return (
      <dl className={className}>
        <dt>{title}</dt>
        <dd>{children || value || <Empty />}</dd>
      </dl>
    );
  }

  return (
    <Container>
      <MainHeading>{t.listTitle}</MainHeading>
      <Card className="mb-4">
        <CardBody>
          <CardTitle>
            {request.resolvedAt
              ? t.attributes.isResolved.choices.true.label
              : t.attributes.isResolved.choices.false.label}
            : {t.attributes.action.choices[request.action].title}
          </CardTitle>

          <div className="row mt-3">
            <Field
              className="col-md-6"
              title={t.attributes.submitterName.title}
              value={request.submitterName}
            />
            <Field
              className="col-md-6"
              title={t.attributes.submitterEmail.title}
              value={request.submitterEmail}
            />
          </div>
          <div className="row">
            <Field
              className="col-md-6"
              title={t.attributes.submitterRole.title}
              value={
                t.attributes.submitterRole.choices[request.submitterRole].title
              }
            />
            <Field
              className="col-md-6"
              title={t.attributes.createdAt.title}
              value={
                <FormattedDateTime
                  value={uuid7ToZonedDateTime(request.id)}
                  locale={locale}
                />
              }
            />
          </div>
          <Row>
            <Field
              className="col-md-6"
              title={t.attributes.status.title}
              value={
                <>
                  {t.attributes.status.choices[request.status].title}{" "}
                  <FormattedDateTime
                    value={request.resolvedAt}
                    locale={locale}
                  />
                </>
              }
            />
            <Field
              className="col-md-6"
              title={t.attributes.resolvedBy.title}
              value={
                request.resolvedBy ? (
                  request.resolvedBy.name
                ) : (
                  <em>{t.attributes.resolvedBy.notResolved}</em>
                )
              }
            />
          </Row>
          {request.message ? (
            <Field
              title={t.attributes.message.title}
              value={<UnrenderedMarkdown>{request.message}</UnrenderedMarkdown>}
            />
          ) : null}
          {request.resolvedMessage ? (
            <Field
              title={t.attributes.resolvedMessage.title}
              value={
                <UnrenderedMarkdown>
                  {request.resolvedMessage}
                </UnrenderedMarkdown>
              }
            />
          ) : null}
          {request.larp ? (
            <Field
              title={t.attributes.larp.title}
              value={
                <Link href={getLarpHref(request.larp)} className="link-subtle">
                  {request.larp.name}
                </Link>
              }
            />
          ) : null}
        </CardBody>
      </Card>

      <Card className="mb-4">
        <CardBody>
          <CardTitle>{newLarpT.sections.larp.title}</CardTitle>
          <Field title={larpT.attributes.name.title} value={newContent.name} />
          <Field
            title={larpT.attributes.tagline.title}
            value={newContent.tagline}
          />
          <Row>
            <Field
              className="col-md-6"
              title={larpT.attributes.locationText.title}
              value={newContent.locationText}
            />
            <Field
              className="col-md-6"
              title={larpT.attributes.language.title}
              value={larpT.attributes.language.choices[newContent.language]}
            />
          </Row>
          <Row>
            <Field
              className="col-md-6"
              title={larpT.attributes.startsAt.title}
              value={
                newContent.startsAt ? (
                  <FormattedDate date={newContent.startsAt} locale={locale} />
                ) : (
                  <Empty />
                )
              }
            />
            <Field
              className="col-md-6"
              title={larpT.attributes.endsAt.title}
              value={
                newContent.endsAt ? (
                  <FormattedDate date={newContent.endsAt} locale={locale} />
                ) : (
                  <Empty />
                )
              }
            />
          </Row>
          <Row>
            <Field
              className="col-md-6"
              title={larpT.attributes.signupStartsAt.title}
              value={
                newContent.signupStartsAt ? (
                  <FormattedDate
                    date={newContent.signupStartsAt}
                    locale={locale}
                  />
                ) : (
                  <Empty />
                )
              }
            />
            <Field
              className="col-md-6"
              title={larpT.attributes.signupEndsAt.title}
              value={
                newContent.signupEndsAt ? (
                  <FormattedDate
                    date={newContent.signupEndsAt}
                    locale={locale}
                  />
                ) : (
                  <Empty />
                )
              }
            />
          </Row>
          <Field
            title={larpT.attributes.fluffText.title}
            value={
              newContent.fluffText ? (
                <UnrenderedMarkdown>{newContent.fluffText}</UnrenderedMarkdown>
              ) : (
                <Empty />
              )
            }
          />
          <Field
            title={larpT.attributes.description.title}
            value={
              newContent.description ? (
                <UnrenderedMarkdown>
                  {newContent.description}
                </UnrenderedMarkdown>
              ) : (
                <Empty />
              )
            }
          />
        </CardBody>
      </Card>

      {request.status === EditStatus.APPROVED ? null : (
        <Card className="mb-5">
          <CardBody>
            <CardTitle>{t.actions.resolve.title}</CardTitle>
            <Form action={resolveRequest.bind(null, locale, requestId)}>
              <FormLabel>
                {t.actions.resolve.attributes.resolution.title}*
              </FormLabel>
              <Row>
                {Object.entries(
                  t.actions.resolve.attributes.resolution.choices
                ).map(([resolution, { title, description, already }]) => (
                  <div className="col-md-6" key={resolution}>
                    <Card className="mb-3">
                      <CardBody>
                        <FormCheck
                          type="radio"
                          name="resolution"
                          id={`ModerationRequestPage-resolution-${resolution}`}
                          value={resolution}
                          label={title}
                          className="fw-bold"
                          disabled={request.status === resolution}
                          required
                        />
                        <CardText className="mt-2">
                          {request.status === resolution ? (
                            <span className="text-muted">{already}</span>
                          ) : (
                            description
                          )}
                        </CardText>
                      </CardBody>
                    </Card>
                  </div>
                ))}
              </Row>
              <FormLabel htmlFor="ModerationRequestPage-reason">
                {t.attributes.resolvedMessage.label}
              </FormLabel>
              <FormControl
                as={"textarea"}
                rows={5}
                id="ModerationRequestPage-reason"
                name="reason"
              />
              <FormText>{t.attributes.resolvedMessage.helpText}</FormText>
              <SubmitButton className="d-block w-100 mt-4 btn btn-primary btn-lg">
                {t.actions.resolve.submit}
              </SubmitButton>
            </Form>
          </CardBody>
        </Card>
      )}
    </Container>
  );
}
