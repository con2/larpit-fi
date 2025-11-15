import { auth } from "@/auth";
import InsufficientPrivileges from "@/components/InsufficientPrivileges";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import { canEditPages, getUserFromSession } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import {
  Card,
  CardBody,
  CardText,
  CardTitle,
  Container,
  Row,
} from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
}

function getUserTitleInLanguage(user: any, locale: string) {
  switch (locale) {
    case "fi":
      return user.titleFi;
    default:
      return user.titleEn;
  }
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.ContactPage;
  const userT = translations.User;

  const session = await auth();

  const user = await getUserFromSession(session);
  if (!user) {
    return <LoginRequired messages={translations.LoginRequired} />;
  }
  if (!canEditPages(user)) {
    return <InsufficientPrivileges messages={translations.AdminRequired} />;
  }

  const roles = await prisma.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "MODERATOR"],
      },
    },
    select: {
      id: true,
      name: true,
      role: true,
      titleFi: true,
      titleEn: true,
    },
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  console.log({ roles });

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <p className="text-center">{t.teamConsistsOf}</p>
      <Row className="mb-5">
        {roles.map((role) => (
          <div key={role.id} className="col-md-4">
            <Card className="mb-4">
              <CardBody>
                <CardTitle>{role.name}</CardTitle>
                <CardText>
                  {getUserTitleInLanguage(user, locale) ||
                    userT.attributes.role.choices[role.role].title}
                </CardText>
              </CardBody>
            </Card>
          </div>
        ))}
      </Row>
      <Card className="mb-4">
        <CardBody>
          <CardTitle>Contact</CardTitle>
        </CardBody>
      </Card>
    </Container>
  );
}
