import { auth } from "@/auth";
import { byStartsAt, relatedLarpFields } from "@/components/LarpPage";
import { LoginRequiredCard } from "@/components/LoginRequiredCard";
import MainHeading from "@/components/MainHeading";
import { addRelatedLarp } from "@/components/related/actions";
import {
  LeftRelatedLarpComponent,
  RightRelatedLarpComponent,
} from "@/components/related/RelatedLarpComponent";
import RemoveRelatedLarpButton from "@/components/related/RemoveRelatedLarpButton";
import SelectLarpCombobox from "@/components/related/SelectLarpCombobox";
import { RelatedLarpType } from "@/prisma/enums";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getUserFromSession,
} from "@/models/User";
import { compareNullsLast } from "@/helpers/sort";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { SubmitButton } from "@con2/components";
import { SwapVert } from "@con2/components/icons";
import Link from "next/link";
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
  const ediT = translations.EditLarpPage;

  if (!validateUuid(resolvedParams.larpId)) {
    notFound();
  }

  const session = await auth();
  const user = await getUserFromSession(session);

  const larpTypeChoices = Object.fromEntries(
    Object.entries(translations.Larp.attributes.type.choices).map(([k, v]) => [
      k,
      v.title,
    ]),
  );

  const [larpRow, larpRows] = await Promise.all([
    db.orm.public.Larp.select("id", "name", "type", "startsAt", "endsAt")
      .include("relatedLarpsLeft", (r) =>
        r.include("right", (l) => l.select(...relatedLarpFields)),
      )
      .include("relatedLarpsRight", (r) =>
        r.include("left", (l) => l.select(...relatedLarpFields)),
      )
      .include("relatedUsers", (r) =>
        r.where({ role: "GAME_MASTER" }).select("userId", "role"),
      )
      .first({ id: resolvedParams.larpId }),
    db.orm.public.Larp.select("id", "name", "type", "startsAt", "endsAt")
      .where((l) => l.id.neq(resolvedParams.larpId))
      .orderBy((l) => l.name.asc())
      .all(),
  ]);

  if (!larpRow) {
    notFound();
  }
  larpRow.relatedLarpsLeft.sort((a, b) => byStartsAt(a.right, b.right));
  larpRow.relatedLarpsRight.sort((a, b) => byStartsAt(a.left, b.left));
  const larp = parseDates(larpRow);
  const larps = parseDates(larpRows).sort(
    (a, b) =>
      a.name.localeCompare(b.name, "fi") ||
      compareNullsLast(b.startsAt, a.startsAt),
  );

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
                larps={larps}
                locale={locale}
                larpTypeChoices={larpTypeChoices}
                defaultValue={resolvedSearchParams.rightId}
              />

              <SubmitButton name="action" value="create" className="me-2">
                {t.actions.add.actions.submit}
              </SubmitButton>
              <SubmitButton
                variant="secondary"
                name="action"
                value="swap"
                className="me-2"
              >
                <SwapVert /> {t.actions.add.actions.swap}
              </SubmitButton>
              <Link
                href={`/larp/${larp.id}`}
                className="btn btn-outline-secondary"
              >
                {translations.Common.actions.returnToLarpPage.title}
              </Link>
            </Form>
          </CardBody>
        </Card>
      ) : (
        <LoginRequiredCard messages={t.actions.add.loginRequired} />
      )}
      {editPolicy && (
        <div className="text-center text-muted mb-4">
          {ediT.policy[editPolicy]}
        </div>
      )}
    </Container>
  );
}
