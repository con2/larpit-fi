import { auth } from "@/auth";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import { Column, DataTable } from "@/components/DataTable";
import InsufficientPrivileges from "@/components/InsufficientPrivileges";
import { SubtlePrivacyPolicyLink } from "@/components/LoginLink";
import LoginRequired from "@/components/LoginRequired";
import MainHeading from "@/components/MainHeading";
import { canModerate } from "@/models/User";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { Translations } from "@/translations/en";
import { Container, FormLabel, FormSelect } from "react-bootstrap";
import { setUserRole } from "./actions";

interface Props {
  params: Promise<{ locale: string }>;
}

async function getData() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      name: true,
      role: true,
    },
  });
}

type UsersPageUser = Awaited<ReturnType<typeof getData>>[number];

function UserRoleForm({
  user,
  messages: t,
  locale,
  disabled,
}: {
  user: UsersPageUser;
  messages: Translations["User"];
  locale: string;
  disabled: boolean;
}) {
  return (
    <AutoSubmitForm action={setUserRole.bind(null, locale, user.id)}>
      <FormLabel
        className="visually-hidden"
        htmlFor={`UserRoleForm-role-${user.id}`}
      >
        {t.attributes.role.title}
      </FormLabel>
      <FormSelect
        id={`UserRoleForm-role-${user.id}`}
        defaultValue={user.role}
        key={user.role} // XXX workaround for… well, remove it, find out
        name="role"
        disabled={disabled}
      >
        {Object.entries(t.attributes.role.choices).map(([value, { title }]) => (
          <option key={value} value={value}>
            {title}
          </option>
        ))}
      </FormSelect>
    </AutoSubmitForm>
  );
}

export default async function UsersPage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.User;

  const session = await auth();

  const user = session?.user?.email
    ? await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        select: {
          id: true,
          role: true,
        },
      })
    : null;
  if (!user) {
    return <LoginRequired messages={translations.LoginRequired} />;
  }
  if (!canModerate(user)) {
    return <InsufficientPrivileges messages={translations.AdminRequired} />;
  }

  const users = await getData();

  const columns: Column<(typeof users)[number]>[] = [
    {
      slug: "name",
      title: t.attributes.name.title,
    },
    {
      slug: "email",
      title: t.attributes.email.title,
      getCellContents: (row) => (
        <>
          {row.email}
          {row.emailVerified ? <> ✅</> : <></>}
        </>
      ),
    },
    {
      slug: "role",
      title: t.attributes.role.title,
      getCellContents: (row) => (
        <UserRoleForm
          user={row}
          messages={t}
          locale={locale}
          disabled={row.id === user.id} // Prevent un-admining oneself
        />
      ),
    },
  ];

  return (
    <Container>
      <MainHeading>{t.listTitle}</MainHeading>
      <p className="text-muted text-center">
        {t.privacyWarning(SubtlePrivacyPolicyLink)}
      </p>
      <DataTable
        // TODO rounded doesn't work on bootstrap .table?
        className="table table-striped border rounded"
        columns={columns}
        rows={users}
      />
    </Container>
  );
}
