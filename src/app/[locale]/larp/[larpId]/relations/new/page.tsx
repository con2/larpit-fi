import { auth } from "@/auth";
import { FormattedDateRange } from "@/components/FormattedDateRange";
import SwapVert from "@/components/google-material-symbols/SwapVert";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import SubmitButton from "@/components/SubmitButton";
import { Larp } from "@/generated/prisma/client";
import { getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import type { Translations } from "@/translations/en";
import { notFound } from "next/navigation";
import React, { ReactNode } from "react";
import { Card, CardBody, FormLabel, FormSelect } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
}

type SelectableLarp = Pick<
  Larp,
  "id" | "name" | "startsAt" | "endsAt" | "type"
>;

function SelectLarpOption({
  larp,
  locale,
  translations,
}: {
  larp: SelectableLarp;
  locale: string;
  translations: Translations;
}) {
  const { name, type, startsAt, endsAt } = larp;
  return (
    <>
      {name} ({translations.Larp.attributes.type.choices[type].title}
      {startsAt ? (
        <>
          {", "}
          <FormattedDateRange
            locale={locale}
            start={startsAt}
            end={endsAt}
            as={React.Fragment} /* avoid wrapping in <time> element */
          />
        </>
      ) : null}
      )
    </>
  );
}

/// TODO proper autocomplete
function SelectLarpComponent({
  larps,
  name,
  defaultValue,
  title,
  locale,
  translations,
}: {
  larps: Array<SelectableLarp>;
  name: string;
  defaultValue?: string;
  title: ReactNode;
  locale: string;
  translations: Translations;
}) {
  const id = `SelectLarpComponent-${name}`;

  return (
    <div className="form-group mb-3">
      <FormLabel htmlFor={id}>{title}*</FormLabel>
      <FormSelect id={id} name={name} required defaultValue={defaultValue}>
        <option value=""></option>
        {larps.map((larp) => (
          <option key={larp.id} value={larp.id}>
            <SelectLarpOption
              larp={larp}
              locale={locale}
              translations={translations}
            />
          </option>
        ))}
      </FormSelect>
    </div>
  );
}

export default async function AddRelatedLarpPage({ params }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);

  const translations = getTranslations(locale);
  const t = translations.Larp.attributes.relatedLarps;
  const lefT = translations.Larp.attributes.leftRelatedLarps;
  const righT = translations.Larp.attributes.rightRelatedLarps;

  if (!validateUuid(resolvedParams.larpId)) {
    notFound();
  }

  const session = await auth();
  const [user, larp, larps] = await Promise.all([
    getUserFromSession(session),
    await prisma.larp.findUnique({
      where: { id: resolvedParams.larpId },
      select: {
        id: true,
        name: true,
        type: true,
        startsAt: true,
        endsAt: true,
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
  if (!user?.email) {
    return <LoginRequired messages={translations.LoginRequired} />;
  }
  if (!larp) {
    notFound();
  }

  return (
    <Container>
      <MainHeading>{t.actions.add.title}</MainHeading>
      <Card>
        <CardBody>
          <Form>
            <div className="form-group mb-3">
              <FormLabel>{lefT.label}</FormLabel>
              <div>
                <SelectLarpOption
                  larp={larp}
                  locale={locale}
                  translations={translations}
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <FormLabel htmlFor="AddRelatedLarpPage-type">
                {t.attributes.type.title}*
              </FormLabel>
              <FormSelect id="AddRelatedLarpPage-type" name="type" required>
                <option value=""></option>
                {Object.entries(t.attributes.type.choices).map(
                  ([key, title]) => (
                    <option key={key} value={key}>
                      {title}
                    </option>
                  )
                )}
              </FormSelect>
            </div>

            <SelectLarpComponent
              name="rightId"
              title={righT.label}
              larps={larps}
              locale={locale}
              translations={translations}
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
    </Container>
  );
}
