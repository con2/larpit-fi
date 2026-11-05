import { auth } from "@/auth";
import { SubtlePrivacyPolicyLink } from "@/components/ExternalLinks";
import { LoginRequiredCard } from "@/components/LoginRequiredCard";
import { canModerate, getUserFromSession } from "@/models/User";
import { db } from "@/prisma/db";
import { getTranslations } from "@/translations";
import { Translations } from "@/translations/en";
import {
  AutoSubmitForm,
  Column,
  DataTable,
  MessageCard,
} from "@con2/components";
import { FormLabel, FormSelect } from "react-bootstrap";
import { setUserRole } from "./actions";

interface Props {
  params: Promise<{ locale: string }>;
}

async function getData() {
  return db.orm.public.User.select(
    "id",
    "email",
    "emailVerified",
    "name",
    "role",
  )
    .orderBy((u) => u.name.asc())
    .all();
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

  const user = await getUserFromSession(session);
  if (!user) {
    return (
      <div className="lf-container">
        <LoginRequiredCard messages={translations.LoginRequired} />
      </div>
    );
  }
  if (!canModerate(user)) {
    return (
      <MessageCard
        title={translations.AdminRequired.title}
        message={translations.AdminRequired.message}
        container
      />
    );
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
    <div className="lf-container">
      <header className="lf-page-header">
        <h1 className="lf-display-l">{t.listTitle}</h1>
        <p className="lf-muted mb-0">
          {t.privacyWarning(SubtlePrivacyPolicyLink)}
        </p>
      </header>
      <div className="py-5 table-responsive">
        <DataTable className="table" columns={columns} rows={users} />
      </div>
    </div>
  );
}
