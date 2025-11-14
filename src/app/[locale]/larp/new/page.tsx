import { auth } from "@/auth";
import LarpFormComponent from "@/components/LarpFormComponent";
import LarpLinksFormComponent from "@/components/LarpLinksFormComponent";
import MainHeading from "@/components/MainHeading";
import SubmitterFormComponent from "@/components/SubmitterFormComponent";
import YoureAlmostReadyFormComponent from "@/components/YoureAlmostReadyFormComponent";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { createLarp } from "./actions";
import PrivacyFormComponent from "@/components/PrivacyFormComponent";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function NewLarpPage({ params }: Props) {
  const resolvedParams = await params;
  const locale = toSupportedLanguage(resolvedParams.locale);

  const translations = getTranslations(locale);
  const t = translations.NewLarpPage;

  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { name: true, role: true, email: true },
      })
    : null;

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <div className="text-center mb-5">{t.message}</div>
      <Form action={createLarp.bind(null, locale)}>
        <SubmitterFormComponent
          user={user}
          role={null}
          translations={translations}
        />
        <PrivacyFormComponent translations={translations} />

        <LarpFormComponent
          translations={translations}
          locale={locale}
          larp={null}
        />
        <LarpLinksFormComponent translations={translations} />
        <YoureAlmostReadyFormComponent
          translations={translations}
          user={user}
        />
      </Form>
    </Container>
  );
}
