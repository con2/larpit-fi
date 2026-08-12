import { auth } from "@/auth";
import MainHeading from "@/components/MainHeading";
import {
  Column,
  DataTable,
  DimensionFilters,
  FormattedDate,
  SubmitButton,
} from "@con2/components";
import {
  RelatedUserRole,
  RelatedUserVisibility,
} from "@/generated/prisma/client";
import {
  canViewParticipantList,
  canViewRelatedUserEntry,
  getUserFromSession,
  isGmOrModerator,
  localSignupRoles,
} from "@/models/User";
import prisma from "@/prisma";
import { getTranslations, toSupportedLanguage } from "@/translations";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import Alert from "react-bootstrap/Alert";
import Badge from "react-bootstrap/Badge";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import { validate as validateUuid } from "uuid";
import { removeRole, removeUnauthenticatedSignup } from "./actions";

interface Props {
  params: Promise<{ locale: string; larpId: string }>;
  searchParams: Promise<{ force?: string; role?: string }>;
}

interface RoleRow {
  key: string;
  muted: boolean;
  name: ReactNode;
  roleLabel: string;
  visibilityLabel: string;
  signedUpAt: Date;
  email: string | null;
  actions: ReactNode;
}

function roleCellElement(row: RoleRow, children?: ReactNode) {
  return <td className={row.muted ? "text-muted" : undefined}>{children}</td>;
}

export default async function RolesPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const locale = toSupportedLanguage(resolvedParams.locale);
  const { larpId } = resolvedParams;

  if (!validateUuid(larpId)) {
    notFound();
  }

  const forceStrong = resolvedSearchParams.force === "strong";

  const translations = getTranslations(locale);
  const t = translations.RolesPage;

  const session = await auth();
  const user = await getUserFromSession(session);

  const larp = await prisma.larp.findUnique({
    where: { id: larpId },
    select: {
      id: true,
      name: true,
      relatedUserVisibility: true,
      relatedUsers: {
        select: {
          userId: true,
          role: true,
          visibility: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!larp) {
    notFound();
  }

  const isGm = isGmOrModerator(user, larp);

  if (!canViewParticipantList(user, larp, forceStrong)) {
    return (
      <Container>
        <MainHeading>{t.title}</MainHeading>
        <Alert variant="warning">{t.insufficientPrivileges}</Alert>
      </Container>
    );
  }

  const unauthSignups = isGm
    ? await prisma.unauthenticatedSignup.findMany({
        where: { larpId },
        orderBy: [{ verifiedAt: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          displayName: true,
          email: true,
          signupStatus: true,
          visibility: true,
          verifiedAt: true,
          createdAt: true,
        },
      })
    : [];

  const roleFilter = resolvedSearchParams.role === "signups" ? "signups" : "";

  const visibleRelatedUsers = larp.relatedUsers
    .filter((entry) => canViewRelatedUserEntry(user, entry, larp))
    .filter(
      (entry) =>
        roleFilter === "" ||
        (localSignupRoles as readonly string[]).includes(entry.role),
    );

  const signupStatusChoices =
    translations.LocalSignupPage.attributes.signupStatus.choices;
  const visibilityLabels = t.visibility;

  function getRoleLabel(role: RelatedUserRole): string {
    if ((localSignupRoles as readonly string[]).includes(role)) {
      const key = role as
        "LOCAL_SIGNUP_YES" | "LOCAL_SIGNUP_MAYBE" | "LOCAL_SIGNUP_NO";
      return signupStatusChoices[key].title;
    }
    const choicesSource = translations.RelatedUser.attributes.role.choices;
    const choice = (
      choicesSource as Record<string, { title: string } | undefined>
    )[role];
    return choice?.title ?? role;
  }

  const relatedUserRows: RoleRow[] = visibleRelatedUsers.map((entry) => {
    const isOwnRow = user?.id === entry.userId;
    const isLocalSignup = (localSignupRoles as readonly string[]).includes(
      entry.role,
    );
    const canRemove = isOwnRow || isGm;
    const isGmRole = entry.role === RelatedUserRole.GAME_MASTER;

    return {
      key: `${entry.userId}-${entry.role}`,
      muted: false,
      name: entry.user.name ?? "—",
      roleLabel: getRoleLabel(entry.role),
      visibilityLabel:
        visibilityLabels[entry.visibility as RelatedUserVisibility],
      signedUpAt: entry.createdAt,
      email: isLocalSignup ? entry.user.email : "—",
      actions: canRemove ? (
        <Form
          action={removeRole.bind(
            null,
            locale,
            larpId,
            entry.userId,
            entry.role,
          )}
        >
          <SubmitButton
            variant="outline-danger"
            size="sm"
            confirmationMessage={
              isGmRole
                ? t.actions.confirmRemoveGmRole
                : isLocalSignup
                  ? t.actions.confirmRemoveSignup
                  : t.actions.confirmRemoveRole
            }
          >
            {t.actions.remove}
          </SubmitButton>
        </Form>
      ) : null,
    };
  });

  // Unauthenticated sign-ups are always sign-ups, so the role filter never excludes them.
  const unauthSignupRows: RoleRow[] = unauthSignups.map((signup) => {
    const isVerified = signup.verifiedAt !== null;
    const key = signup.signupStatus as
      "LOCAL_SIGNUP_YES" | "LOCAL_SIGNUP_MAYBE" | "LOCAL_SIGNUP_NO";

    return {
      key: signup.id,
      muted: !isVerified,
      name: (
        <>
          {signup.displayName}
          {!isVerified && (
            <>
              {" "}
              <Badge bg="secondary">{t.unauthenticatedSignups.badge}</Badge>
            </>
          )}
        </>
      ),
      roleLabel: signupStatusChoices[key].title,
      visibilityLabel:
        visibilityLabels[signup.visibility as RelatedUserVisibility],
      signedUpAt: isVerified ? signup.verifiedAt! : signup.createdAt,
      email: signup.email,
      actions: (
        <Form
          action={removeUnauthenticatedSignup.bind(
            null,
            locale,
            larpId,
            signup.id,
          )}
        >
          <SubmitButton
            variant="outline-danger"
            size="sm"
            confirmationMessage={t.actions.confirmRemoveRole}
          >
            {t.actions.remove}
          </SubmitButton>
        </Form>
      ),
    };
  });

  const rows: RoleRow[] = [...relatedUserRows, ...unauthSignupRows];

  const columns: Column<RoleRow>[] = [
    {
      slug: "name",
      title: t.columns.name,
      getCellContents: (row) => row.name,
      getCellElement: roleCellElement,
    },
    {
      slug: "role",
      title: t.columns.role,
      getCellContents: (row) => row.roleLabel,
      getCellElement: roleCellElement,
    },
    {
      slug: "visibility",
      title: t.columns.visibility,
      getCellContents: (row) => row.visibilityLabel,
      getCellElement: roleCellElement,
    },
    {
      slug: "signedUpAt",
      title: t.columns.signedUpAt,
      getCellContents: (row) => (
        <FormattedDate locale={locale} date={row.signedUpAt} />
      ),
      getCellElement: roleCellElement,
    },
  ];
  if (isGm) {
    columns.push({
      slug: "email",
      title: t.columns.email,
      getCellContents: (row) => row.email,
      getCellElement: roleCellElement,
    });
  }
  columns.push({
    slug: "actions",
    title: t.columns.actions,
    getCellContents: (row) => row.actions,
    getCellElement: roleCellElement,
  });

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <p>{t.message}</p>

      {isGm && (
        <div className="mb-3">
          <Link
            href={`/api/larp/${larpId}/roles?format=csv`}
            className="btn btn-outline-secondary btn-sm"
          >
            {t.actions.exportCsv}
          </Link>
        </div>
      )}

      <DimensionFilters
        dimensions={[
          {
            slug: "role",
            title: t.filters.role.title,
            values: [
              { slug: "", title: t.filters.role.all },
              { slug: "signups", title: t.filters.role.signups },
            ],
          },
        ]}
        locale={locale}
      />

      <DataTable
        rows={rows}
        columns={columns}
        className="table table-striped mb-4"
        responsive
      />
    </Container>
  );
}
