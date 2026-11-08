import { SubmitButton } from "@con2/components";
import { notFound } from "next/navigation";
import { Alert, Form, FormControl, FormLabel, FormText } from "react-bootstrap";
import { validate as validateUuid } from "uuid";

import { auth } from "@/auth";
import LarpSubpage from "@/components/larp-page/LarpSubpage";
import { publicUrl } from "@/config";
import { suggestLarpAlias } from "@/helpers/larpAlias";
import {
  type LarpAliasError,
  larpAliasMaxLength,
  normalizeLarpAlias,
} from "@/models/Larp";
import { canModerate, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";

import { saveLarpAlias } from "./actions";

interface Props {
  params: Promise<{ locale: string; larpId: string }>;
  searchParams: Promise<{ error?: string; alias?: string }>;
}

export default async function LarpAliasPage({ params, searchParams }: Props) {
  const { locale, larpId } = await params;
  const { error, alias: submittedAlias } = await searchParams;
  if (!validateUuid(larpId)) notFound();

  const user = await getUserFromSession(await auth());
  if (!canModerate(user)) notFound();

  const larp = await db.orm.public.Larp.select(
    "id",
    "name",
    "language",
    "alias",
  ).first({
    id: larpId,
  });
  if (!larp) notFound();

  const t = getTranslations(locale).LarpAliasPage;
  const errorMessages: Record<LarpAliasError, string> = {
    ...t.errors,
    tooLong: t.errors.tooLong(larpAliasMaxLength),
  };
  const errorMessage =
    error && Object.hasOwn(errorMessages, error)
      ? errorMessages[error as LarpAliasError]
      : null;
  const alias =
    submittedAlias ??
    larp.alias ??
    suggestLarpAlias(larp.name, larp.language, larpAliasMaxLength) ??
    "";
  const exampleAlias = normalizeLarpAlias(alias) ?? larp.id;

  return (
    <LarpSubpage title={t.title} larp={larp} lede={t.lede}>
      <Form
        action={saveLarpAlias.bind(null, larp.id)}
        style={{ maxWidth: "36rem" }}
      >
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpAlias-currentAlias">
            {t.currentAliasLabel}
          </FormLabel>
          <FormControl
            type="text"
            id="LarpAlias-currentAlias"
            value={larp.alias ?? ""}
            placeholder={t.noAlias}
            readOnly
            disabled
          />
        </div>
        <div className="form-group mb-3">
          <FormLabel htmlFor="LarpAlias-alias">{t.label}</FormLabel>
          <FormControl
            type="text"
            id="LarpAlias-alias"
            name="alias"
            defaultValue={alias}
            maxLength={larpAliasMaxLength}
            isInvalid={!!errorMessage}
            autoCapitalize="none"
            spellCheck={false}
          />
          <FormText>{t.helpText(`${publicUrl}/${exampleAlias}`)}</FormText>
        </div>
        <SubmitButton className="btn btn-primary">{t.save}</SubmitButton>
      </Form>
    </LarpSubpage>
  );
}
