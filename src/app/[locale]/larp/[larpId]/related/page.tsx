import { auth } from "@/auth";
import SwapVert from "@/components/google-material-symbols/SwapVert";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import SelectLarpCombobox from "@/components/related/SelectLarpCombobox";
import SubmitButton from "@/components/SubmitButton";
import {
  RelatedLarpType,
  RelatedUserRole,
} from "@/generated/prisma/client";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getUserFromSession,
} from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { notFound } from "next/navigation";
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  FormLabel,
  FormSelect,
} from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";
import { addRelatedLarp } from "@/components/related/actions";
import { relatedLarpInclude } from "@/components/LarpPage";
import {
  LeftRelatedLarpComponent,
  RightRelatedLarpComponent,
} from "@/components/related/RelatedLarpComponent";
import RemoveRelatedLarpButton from "@/components/related/RemoveRelatedLarpButton";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
  searchParams: Promise<{
    rightId?: string;
    type?: string;
    error?: string;
  }>;
}

export default async function RelatedLarpsPage({
  params,
  searchParams,
}: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = toSupportedLanguage(resolvedParams.locale);

  const translations = getTranslations(locale);
  const t = translations.Larp.attributes.relatedLarps;
  const righT = translations.Larp.attributes.rightRelatedLarps;
  const ediT = translations.EditLarpPage;

  if (!validateUuid(resolvedParams.larpId)) {
    notFound();
  }

  const session = await auth();
  const user = await getUserFromSession(session);

  const larpTypeChoices = Object.fromEntries(
    Object.entries(translations.Larp.attributes.type.choices).map(
      ([k, v]) => [k, v.title],
    ),
  );

  const [larp, larps] = await Promise.all([
    await prisma.larp.findUnique({
      where: { id: resolvedParams.larpId },
      select: {
        id: true,
        name: true,
        type: true,
        startsAt: true,
        endsAt: true,
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
      },
    }),
    await prisma.larp.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        startsAt: true,
        endsAt: true,
      },
      where: {
        id: { not: resolvedParams.larpId },
      },
      orderBy: [{ name: "asc" }, { startsAt: { sort: "desc", nulls: "last" } }],
    }),
  ]);

  if (!larp) {
    notFound();
  }

  const preselectedType =
    resolvedSearchParams.type &&
    Object.values(RelatedLarpType).includes(
      resolvedSearchParams.type as RelatedLarpType,
    )
      ? resolvedSearchParams.type
      : undefined;

  const editPolicy = getEditLarpInitialStatusForUserAndLarp(user, larp);

  return (
    <Container>
      <MainHeading>{larp.name}</MainHeading>
      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t.title}</CardTitle>
          {larp.relatedLarpsLeft.map((relatedLarp) => (
            <LeftRelatedLarpComponent
              key={relatedLarp.rightId}
              relatedLarp={relatedLarp}
              messages={translations.Larp}
            >
              {editPolicy && (
                <RemoveRelatedLarpButton
                  larpId={larp.id}
                  leftId={relatedLarp.leftId}
                  rightId={relatedLarp.rightId}
                  type={relatedLarp.type}
                  locale={locale}
                  messages={t.actions.remove}
                  editPolicy={editPolicy}
                />
              )}
            </LeftRelatedLarpComponent>
          ))}
          {larp.relatedLarpsRight.map((relatedLarp) => (
            <RightRelatedLarpComponent
              key={relatedLarp.leftId}
              relatedLarp={relatedLarp}
              messages={translations.Larp}
            >
              {editPolicy && (
                <RemoveRelatedLarpButton
                  larpId={larp.id}
                  leftId={relatedLarp.leftId}
                  rightId={relatedLarp.rightId}
                  type={relatedLarp.type}
                  locale={locale}
                  messages={t.actions.remove}
                  editPolicy={editPolicy}
                />
              )}
            </RightRelatedLarpComponent>
          ))}
          {larp.relatedLarpsLeft.length === 0 &&
            larp.relatedLarpsRight.length === 0 && (
              <div>{t.noRelatedLarps}</div>
            )}
        </CardBody>
      </Card>

      {editPolicy ? (
        <Card className="mb-4">
          <CardBody>
            <CardTitle>{t.actions.add.title}</CardTitle>
            {resolvedSearchParams.error === "already_related" && (
              <Alert variant="danger">{t.errors.alreadyRelated}</Alert>
            )}
            <Form
              action={addRelatedLarp.bind(null, locale, resolvedParams.larpId)}
            >
              <div className="form-group mb-3">
                <FormLabel htmlFor="AddRelatedLarpPage-type">
                  {t.attributes.type.title}*
                </FormLabel>
                <FormSelect
                  id="AddRelatedLarpPage-type"
                  name="type"
                  required
                  defaultValue={preselectedType}
                >
                  <option value=""></option>
                  {Object.entries(t.attributes.type.choices).map(
                    ([key, title]) => (
                      <option key={key} value={key}>
                        {title}
                      </option>
                    ),
                  )}
                </FormSelect>
              </div>

              <SelectLarpCombobox
                name="rightId"
                className="mb-4"
                title={t.actions.add.attributes.relatedLarp}
                larps={larps.map((l) => ({
                  ...l,
                  startsAt: l.startsAt?.toISOString() ?? null,
                  endsAt: l.endsAt?.toISOString() ?? null,
                }))}
                locale={locale}
                larpTypeChoices={larpTypeChoices}
                defaultValue={resolvedSearchParams.rightId}
              />

              <SubmitButton name="action" value="create" className="me-2">
                {t.actions.add.actions.submit}
              </SubmitButton>
              <SubmitButton variant="secondary" name="action" value="swap">
                <SwapVert /> {t.actions.add.actions.swap}
              </SubmitButton>
            </Form>
          </CardBody>
        </Card>
      ) : (
        <LoginRequired messages={t.actions.add.loginRequired} />
      )}
      {editPolicy && (
        <div className="text-center text-muted mb-4">
          {ediT.policy[editPolicy]}
        </div>
      )}
    </Container>
  );
}
