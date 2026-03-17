import { auth } from "@/auth";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import SubmitButton from "@/components/SubmitButton";
import { getDeleteLarpInitialStatusForUser } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import { notFound } from "next/navigation";
import {
  Card,
  CardBody,
  Container,
  Form,
  FormControl,
  FormLabel,
} from "react-bootstrap";
import { validate as validateUuid } from "uuid";
import { deleteLarp } from "./actions";
import { EditStatus } from "@/generated/prisma/enums";
import Link from "next/link";

interface Props {
  params: Promise<{
    locale: string;
    larpId: string;
  }>;
}

export default async function DeleteLarpPage({ params }: Props) {
  const { locale: rawLocale, larpId } = await params;
  const locale = toSupportedLanguage(rawLocale);

  if (!validateUuid(larpId)) {
    notFound();
  }

  const translations = getTranslations(locale);
  const t = translations.DeleteLarpPage;
  const larpT = translations.Larp;

  const session = await auth();
  const [user, larp] = await Promise.all([
    session?.user?.email
      ? prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, name: true, role: true, email: true },
        })
      : null,
    prisma.larp.findUnique({
      where: { id: larpId },
    }),
  ]);

  if (!larp) {
    notFound();
  }

  if (!session || !user) {
    return <LoginRequired messages={translations.LoginRequired} />;
  }

  const canDeleteWithoutApproval =
    getDeleteLarpInitialStatusForUser(user) === EditStatus.APPROVED;

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <Card className="mb-4">
        <CardBody>
          <p>
            <strong>{larpT.title}</strong>:{" "}
            <Link href={`/larp/${larp.id}`} className="link-subtle">
              {larp.name}
            </Link>
          </p>
          <p>{t.confirmation}</p>
          {canDeleteWithoutApproval && (
            <p className="text-danger fw-bold">{t.adminNote}</p>
          )}
          <Form action={deleteLarp.bind(null, locale, larp.id)}>
            <FormLabel htmlFor="DeleteLarpPage-reason">
              {translations.ModerationRequest.attributes.message.label}
            </FormLabel>
            <FormControl
              as="textarea"
              rows={3}
              id="DeleteLarpPage-reason"
              name="reason"
            />
            <SubmitButton className="d-block w-100 mt-4 btn btn-danger btn-lg">
              {t.submit}
            </SubmitButton>
          </Form>
        </CardBody>
      </Card>
    </Container>
  );
}
