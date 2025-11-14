import { auth } from "@/auth";
import { LarpBasicInfoFormComponent } from "@/components/LarpBasicInfoFormComponent";
import LarpLinksFormComponent from "@/components/LarpLinksFormComponent";
import LarpLocationFormComponent from "@/components/LarpLocationFormComponent";
import MainHeading from "@/components/MainHeading";
import SubmitterFormComponent from "@/components/SubmitterFormComponent";
import YoureAlmostReadyFormComponent from "@/components/YoureAlmostReadyFormComponent";
import {
  getEditLarpInitialStatusForUserAndLarp,
  getHighestUserRoleForLarp,
} from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { notFound } from "next/navigation";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";
import { editLarp } from "./actions";
import LoginRequired from "@/components/LoginRequired";
import { LarpPageContentFormComponent } from "@/components/LarpPageContentFormComponent";
import { LarpSignupInfoFormComponent } from "@/components/LarpSignupInfoFormComponent";
import { LarpTimeFormComponent } from "@/components/LarpTimeFormComponent";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
  searchParams: Promise<{
    role?: string;
  }>;
}

export default async function EditLarpPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = toSupportedLanguage(resolvedParams.locale);

  const translations = getTranslations(locale);
  const t = translations.EditLarpPage;

  if (!validateUuid(resolvedParams.larpId)) {
    notFound();
  }

  const session = await auth();
  const [user, larp] = await Promise.all([
    session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, name: true, role: true, email: true },
        })
      : null,
    await prisma.larp.findUnique({
      where: { id: resolvedParams.larpId },
      include: {
        links: true,
        relatedUsers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    }),
  ]);
  if (!larp) {
    notFound();
  }

  const role =
    resolvedSearchParams.role === "GAME_MASTER"
      ? "GAME_MASTER"
      : getHighestUserRoleForLarp(user, larp);
  const initialStatus = getEditLarpInitialStatusForUserAndLarp(user, larp);
  if (!initialStatus) {
    return <LoginRequired messages={translations.LoginRequired} />;
  }

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <div className="text-center mb-5">{t.editPolicy[initialStatus]}</div>

      <Form action={editLarp.bind(null, locale, larp!.id)}>
        <SubmitterFormComponent
          user={user}
          role={role}
          translations={translations}
        />
        <LarpBasicInfoFormComponent
          translations={translations}
          locale={locale}
          larp={larp}
        />
        <LarpTimeFormComponent
          translations={translations}
          locale={locale}
          larp={larp}
        />
        <LarpLocationFormComponent
          translations={translations}
          locale={locale}
          larp={larp}
        />
        <LarpSignupInfoFormComponent
          translations={translations}
          locale={locale}
          larp={larp}
        />
        <LarpPageContentFormComponent
          translations={translations}
          locale={locale}
          larp={larp}
        />
        <LarpLinksFormComponent
          translations={translations}
          links={larp!.links}
        />
        <YoureAlmostReadyFormComponent
          translations={translations}
          user={user}
        />
      </Form>
    </Container>
  );
}
