import { auth } from "@/auth";
import CompactLarpFormComponent from "@/components/CompactLarpFormComponent";
import { LarpBasicInfoFormComponent } from "@/components/LarpBasicInfoFormComponent";
import LarpCancelledFormComponent from "@/components/LarpCancelledFormComponent";
import LarpLinksManager from "@/components/LarpLinksManager";
import LarpLocationFormComponent from "@/components/LarpLocationFormComponent";
import { LarpPageContentFormComponent } from "@/components/LarpPageContentFormComponent";
import { LarpSignupInfoFormComponent } from "@/components/LarpSignupInfoFormComponent";
import { LarpTimeFormComponent } from "@/components/LarpTimeFormComponent";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import SubmitterFormComponent from "@/components/SubmitterFormComponent";
import YoureAlmostReadyFormComponent from "@/components/YoureAlmostReadyFormComponent";
import { EditFormPreference } from "@/generated/prisma/client";
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
import { editLarp, setEditFormPreference } from "./actions";

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
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
            editFormPreference: true,
          },
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
    return (
      <Container>
        <LoginRequired messages={translations.LoginRequired} />
      </Container>
    );
  }

  const isCompact = user?.editFormPreference === EditFormPreference.COMPACT;

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <div className="text-center mb-5">{t.policy[initialStatus]}</div>

      <Form action={editLarp.bind(null, locale, larp!.id)}>
        {isCompact ? (
          <>
            <SubmitterFormComponent
              user={user}
              role={role}
              translations={translations}
              compact
            />
            <CompactLarpFormComponent
              translations={translations}
              locale={locale}
              larp={larp}
            />
            <LarpLinksManager
              translations={translations}
              initialLinks={larp!.links}
              compact
            />
            <YoureAlmostReadyFormComponent
              translations={translations}
              user={user}
              compact
            />
          </>
        ) : (
          <>
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
            <LarpLinksManager
              translations={translations}
              initialLinks={larp!.links}
            />
            <LarpCancelledFormComponent
              translations={translations}
              larp={larp}
            />
            <YoureAlmostReadyFormComponent
              translations={translations}
              user={user}
            />
          </>
        )}
      </Form>

      {user && (
        <div className="text-center mb-4">
          <Form
            className="d-inline"
            action={setEditFormPreference.bind(
              null,
              locale,
              larp!.id,
              isCompact ? EditFormPreference.FULL : EditFormPreference.COMPACT,
            )}
          >
            <button className="btn btn-link link-xxsubtle">
              {isCompact ? t.switchToFullForm : t.switchToCompactForm}
            </button>
          </Form>
        </div>
      )}
    </Container>
  );
}
