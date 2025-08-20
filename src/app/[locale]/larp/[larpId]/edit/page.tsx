import { auth } from "@/auth";
import { LarpDetailsFormComponent } from "@/components/LarpDetailsFormComponent";
import LarpLinksFormComponent from "@/components/LarpLinksFormComponent";
import MainHeading from "@/components/MainHeading";
import PrivacyFormComponent from "@/components/PrivacyFormComponent";
import SubmitterFormComponent from "@/components/SubmitterFormComponent";
import YoureAlmostReadyFormComponent from "@/components/YoureAlmostReadyFormComponent";
import { RelatedUserRole, SubmitterRole } from "@/generated/prisma";
import { canModerate } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { notFound } from "next/navigation";
import { Card, CardBody, CardText, CardTitle } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";
import { editLarp } from "./actions";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
}

export default async function EditLarpPage({ params }: Props) {
  const resolvedParams = await params;
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
          select: { name: true, role: true, email: true },
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

  const haveGameMaster = larp.relatedUsers.some(
    (relatedUser) => relatedUser.role === RelatedUserRole.GAME_MASTER
  );

  const existingRoles = larp.relatedUsers
    .filter(
      (relatedUser) => user?.email && relatedUser.user.email === user.email
    )
    .map((relatedUser) => relatedUser.role);
  let highestExistingRole: SubmitterRole = SubmitterRole.NONE;
  for (const role of [
    RelatedUserRole.GAME_MASTER,
    RelatedUserRole.VOLUNTEER,
    RelatedUserRole.PLAYER,
  ]) {
    if (existingRoles.includes(role)) {
      highestExistingRole = role;
      break;
    }
  }

  let message = t.message.noRole;
  if (highestExistingRole === RelatedUserRole.GAME_MASTER) {
    message = t.message.gameMaster;
  } else if (existingRoles.some((role) => role === RelatedUserRole.EDITOR)) {
    message = t.message.editor;
  } else if (canModerate(user)) {
    if (haveGameMaster) {
      message = t.message.moderatorWhenGameMasterListed;
    } else {
      message = t.message.moderatorWhenNoGameMasterListed;
    }
  }

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <div className="text-center mb-5">{message}</div>

      <Card className="mb-5">
        <CardBody>
          <CardTitle>{t.underConstruction.title}</CardTitle>
          <CardText>{t.underConstruction.message}</CardText>
        </CardBody>
      </Card>

      {false && (
        <Form action={editLarp.bind(null, locale, larp!.id)}>
          <SubmitterFormComponent
            user={user}
            role={highestExistingRole}
            translations={translations}
          />
          <PrivacyFormComponent translations={translations} />
          <LarpDetailsFormComponent
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
      )}
    </Container>
  );
}
