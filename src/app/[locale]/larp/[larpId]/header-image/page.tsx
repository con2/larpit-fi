import { notFound } from "next/navigation";
import { validate as validateUuid } from "uuid";

import { auth } from "@/auth";
import HeaderImageEditor from "@/components/header-image/HeaderImageEditor";
import LarpSubpage from "@/components/larp-page/LarpSubpage";
import {
  AccessDeniedPage,
  gateActions,
  LoginRequiredPage,
} from "@/components/GatePage";
import { headerImagesEnabled } from "@/config";
import { headerImageViewOrNull } from "@/models/HeaderImage";
import { getUserFromSession, isGmOrModerator } from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations, toSupportedLanguage } from "@/translations";

import { removeHeaderImage, saveHeaderImageSettings } from "./actions";
import { typesetDashes } from "@/helpers/larpName";

interface Props {
  params: Promise<{ locale: string; larpId: string }>;
}

export default async function LarpHeaderImagePage({ params }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);
  const { larpId } = resolvedParams;
  if (!headerImagesEnabled || !validateUuid(larpId)) notFound();

  const translations = getTranslations(locale);
  const t = translations.HeaderImage;
  const user = await getUserFromSession(await auth());

  const larp = await db.orm.public.Larp.select("id", "name")
    .include("relatedUsers", (r) => r.select("userId", "role"))
    .include("headerImage")
    .first({ id: larpId });
  if (!larp) notFound();

  const gate = gateActions(translations);
  if (!user) {
    return (
      <LoginRequiredPage
        messages={translations.LoginRequired}
        actions={[gate.larp(larp.id)]}
      />
    );
  }
  if (!isGmOrModerator(user, larp)) {
    return (
      <AccessDeniedPage
        messages={translations.GmRequired}
        actions={[gate.larp(larp.id), gate.claimLarp(larp.id)]}
      />
    );
  }

  const view = headerImageViewOrNull(larp.headerImage);

  return (
    <LarpSubpage title={t.title} larp={larp} lede={t.ledeLarp}>
      <HeaderImageEditor
        target={{ kind: "larp", id: larp.id }}
        existing={view}
        returnHref={`/larp/${larp.id}`}
        saveAction={saveHeaderImageSettings.bind(null, larp.id)}
        removeAction={removeHeaderImage.bind(null, larp.id)}
        previewTitle={typesetDashes(larp.name)}
        messages={t}
      />
    </LarpSubpage>
  );
}
