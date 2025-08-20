import { auth } from "@/auth";
import MainHeading from "@/components/MainHeading";
import { RelatedUserRole, SubmitterRole } from "@/generated/prisma";
import { canModerate } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { notFound } from "next/navigation";
import { Card, CardBody, CardText, CardTitle } from "react-bootstrap";
import Container from "react-bootstrap/Container";
import { validate as validateUuid } from "uuid";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
}

export default async function ClaimLarpPage({ params }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);

  const translations = getTranslations(locale);
  const t = translations.ClaimLarpPage;

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

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <Card className="mb-5">
        <CardBody>
          <CardTitle>{t.underConstruction.title}</CardTitle>
          <CardText>{t.underConstruction.message}</CardText>
        </CardBody>
      </Card>
    </Container>
  );
}
