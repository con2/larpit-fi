import { Column, DataTable } from "@/components/DataTable";
import FormattedDateTime from "@/components/FormattedDateTime";
import MainHeading from "@/components/MainHeading";
import { EditStatus } from "@/generated/prisma";
import { uuid7ToZonedDateTime } from "@/helpers/temporal";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import { Container } from "react-bootstrap";
import { ModerationRequestContent } from "@/models/ModerationRequest";
import Link from "next/link";
import { auth } from "@/auth";
import LoginRequired from "@/components/LoginRequired";
import { canModerate } from "@/models/User";
import InsufficientPrivileges from "@/components/InsufficientPrivileges";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string[] }>;
}

const defaultStatuses = [EditStatus.VERIFIED, EditStatus.AUTO_APPROVED];

export default async function ModerationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.ModerationRequest;

  const session = await auth();
  if (!session?.user?.email) {
    return <LoginRequired messages={translations.LoginRequired} />;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      role: true,
    },
  });
  if (!canModerate(user)) {
    return <InsufficientPrivileges messages={translations.ModeratorRequired} />;
  }

  let { status: statuses } = await searchParams;
  if (typeof statuses === "string") {
    statuses = [statuses];
  }
  if (!statuses || statuses.length === 0) {
    statuses = defaultStatuses;
  }
  if (statuses.includes("ALL")) {
    statuses = Object.values(EditStatus);
  }
  statuses = statuses.filter(
    (status) => EditStatus[status as keyof typeof EditStatus]
  );

  const isShowingAll = Object.values(EditStatus).every((status) =>
    statuses.includes(status)
  );

  const requests = await prisma.moderationRequest.findMany({
    orderBy: { id: "desc" },
    where: {
      status: {
        in: statuses as EditStatus[],
      },
    },
    include: {
      resolvedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const columns: Column<(typeof requests)[number]>[] = [
    {
      slug: "createdAt",
      title: t.attributes.createdAt.title,
      getCellContents: (row) => (
        <FormattedDateTime
          value={uuid7ToZonedDateTime(row.id)}
          locale={locale}
        />
      ),
    },
    {
      slug: "action",
      title: t.attributes.action.title,
      getCellContents: (row) => t.attributes.action.choices[row.action].title,
    },
    {
      slug: "name",
      title: t.attributes.name.title,
      getCellContents: (row) =>
        (row.newContent as ModerationRequestContent).name,
    },
    {
      slug: "submitterName",
      title: t.attributes.submitterName.title,
    },
    {
      slug: "status",
      title: t.attributes.status.title,
      getCellContents: (row) => (
        <>
          {t.attributes.status.choices[row.status].title}{" "}
          {<FormattedDateTime value={row.resolvedAt} locale={locale} />}
          {row.resolvedBy?.name && <> ({row.resolvedBy.name})</>}
        </>
      ),
    },
  ];

  return (
    <Container>
      <MainHeading>{t.listTitle}</MainHeading>
      {isShowingAll ? (
        <p className="text-muted text-center">{t.actions.showAll.active}</p>
      ) : (
        <p className="text-center">
          <Link className="link-subtle" href="/moderate?status=ALL">
            {t.actions.showAll.title}
          </Link>
        </p>
      )}
      <DataTable
        // TODO rounded doesn't work on bootstrap .table?
        className="table table-striped table-hover border rounded"
        columns={columns}
        rows={requests}
        getRowHref={(row) => `/moderate/${row.id}`}
      />
    </Container>
  );
}
