import DataTable, { Column } from "@/components/DataTable";
import MainHeading from "@/components/MainHeading";
import { LarpType } from "@/generated/prisma";
import prisma from "@/prisma";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import Link from "next/link";
import { ReactNode } from "react";
import {
  Card,
  CardBody,
  CardTitle,
  Container,
  ProgressBar,
} from "react-bootstrap";

interface Props {
  params: Promise<{ locale: string }>;
}

interface MuniRow {
  municipalityId: string;
  municipalityName: string;
  count: bigint;
}

interface YearRow {
  year: bigint;
  count: bigint;
}

interface TypeRow {
  type: string;
  count: bigint;
}

interface PlayersRow {
  year: string;
  numPlayerCharacters: bigint;
  numTotalParticipants: bigint;
}

function Report<T>({
  title,
  rows,
  columns,
  description,
  total,
  messages: t,
}: {
  title: string;
  rows: T[];
  columns: Column<T>[];
  description?: ReactNode;
  total?: ReactNode;
  messages: Translations["StatsPage"];
}) {
  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>{title}</CardTitle>
        <DataTable rows={rows} columns={columns}>
          {total && (
            <tfoot>
              <tr>
                <th>{t.attributes.total.title}</th>
                <td colSpan={columns.length - 1}>{total}</td>
              </tr>
            </tfoot>
          )}
        </DataTable>
        {description && <div className="mt-3 form-text">{description}</div>}
      </CardBody>
    </Card>
  );
}

export default async function StatsPage({ params }: Props) {
  const { locale } = await params;
  const translations = getTranslations(locale);
  const t = translations.StatsPage;
  const larpT = translations.Larp;

  const muniRows = await prisma.$queryRaw<MuniRow[]>`
    select
      m.id as "municipalityId",
      m.name_fi as "municipalityName",
      count(l.id) as count
    from
      larpit.municipality m
      join larpit.larp l on l.municipality_id = m.id
    where
      l.starts_at is not null
      and l.type not in ('OTHER_EVENT', 'OTHER_EVENT_SERIES')
    group by m.id, m.name_fi
    having count(l.id) > 0
    order by count desc, m.name_fi asc
  `;
  const muniTotal = muniRows.reduce((sum, row) => sum + row.count, BigInt(0));
  const muniMaxCount = Number(
    muniRows.reduce(
      (max, row) => (row.count > max ? row.count : max),
      BigInt(0)
    )
  );
  const muniColumns: Column<MuniRow>[] = [
    {
      slug: "municipalityName",
      title: t.reports.municipality.attributes.municipalityName.title,
      className: "col-md-2 align-middle",
    },
    {
      slug: "count",
      title: t.attributes.count.title,
      className: "col-md-2 align-middle",
    },
    {
      slug: "graph",
      title: "",
      className: "col-md-8 align-middle",
      getCellContents: (row) => {
        return <ProgressBar now={Number(row.count)} max={muniMaxCount} />;
      },
    },
  ];

  const yearRows = await prisma.$queryRaw<YearRow[]>`
    select
      extract(year from l.starts_at)::text as year,
      count(l.id) as count
    from
      larpit.larp l
    where
      l.starts_at is not null
      and l.type not in ('OTHER_EVENT', 'OTHER_EVENT_SERIES')
    group by year
    having count(l.id) > 0
    order by year asc
  `;
  const yearTotal = yearRows.reduce((sum, row) => sum + row.count, BigInt(0));
  const yearMaxCount = Number(
    yearRows.reduce(
      (max, row) => (row.count > max ? row.count : max),
      BigInt(0)
    )
  );
  const yearColumns: Column<YearRow>[] = [
    {
      slug: "year",
      title: t.attributes.year.title,
      className: "col-md-2 align-middle",
    },
    {
      slug: "count",
      title: t.attributes.count.title,
      className: "col-md-2 align-middle",
    },
    {
      slug: "graph",
      title: "",
      className: "col-md-8 align-middle",
      getCellContents: (row) => {
        return <ProgressBar now={Number(row.count)} max={yearMaxCount} />;
      },
    },
  ];

  const typeRows = await prisma.$queryRaw<TypeRow[]>`
    select
      l.type as type,
      count(l.id) as count
    from
      larpit.larp l
    group by l.type
    having count(l.id) > 0
    order by count desc, l.type asc
  `;
  const typeTotal = await prisma.larp.count();
  const typeColumns: Column<TypeRow>[] = [
    {
      slug: "type",
      title: larpT.attributes.type.title,
      getCellContents: (row) => (
        <Link href={`/larp?type=${row.type}`} className="link-subtle">
          {larpT.attributes.type.choices[row.type as LarpType]?.title ||
            row.type}
        </Link>
      ),
    },
    {
      slug: "count",
      title: t.attributes.count.title,
    },
  ];

  // some larps have 0 for numTotalParticipants denoting unknown total participants
  // some larps have null for numTotalParticipants denoting unknown total participants
  // either way, default them to numPlayerCharacters for normalization
  const playersRows = await prisma.$queryRaw<PlayersRow[]>`
    with normalized_data_points as (
      select
        extract(year from starts_at) as year,
        num_player_characters,
        case
          when num_total_participants = 0 then num_player_characters
          when num_total_participants is null then num_player_characters
          else num_total_participants
        end as num_total_participants
      from larpit.larp
      where
        starts_at is not null
        and type not in ('OTHER_EVENT', 'OTHER_EVENT_SERIES')
    )
    select
      year,
      coalesce(sum(num_player_characters), 0) as "numPlayerCharacters",
      coalesce(sum(num_total_participants), 0) as "numTotalParticipants"
    from
      normalized_data_points
    group by year
    having sum(num_player_characters) > 0 or sum(num_total_participants) > 0
    order by year asc
  `;
  const playerCharactersTotal = playersRows.reduce(
    (sum, row) => sum + row.numPlayerCharacters,
    BigInt(0)
  );
  const totalParticipantsTotal = playersRows.reduce(
    (sum, row) => sum + row.numTotalParticipants,
    BigInt(0)
  );
  const playersColumns: Column<PlayersRow>[] = [
    {
      slug: "year",
      title: t.attributes.year.title,
      className: "col-md-2 align-middle",
    },
    {
      slug: "numPlayerCharacters",
      title: larpT.attributes.numPlayerCharacters.title,
      className: "col-md-2 align-middle",
    },
    {
      slug: "numTotalParticipants",
      title: larpT.attributes.numTotalParticipants.title,
      className: "col-md-2 align-middle",
    },
  ];

  return (
    <Container>
      <MainHeading>{t.title}</MainHeading>
      <div className="text-center mb-5">{t.message}</div>
      <Report
        title={t.reports.type.title}
        rows={typeRows}
        columns={typeColumns}
        messages={t}
        total={typeTotal}
      />
      <Report
        title={t.reports.year.title}
        description={t.reports.year.description}
        rows={yearRows}
        columns={yearColumns}
        messages={t}
        total={yearTotal}
      />
      <Card className="mb-4">
        <CardBody>
          <CardTitle>{t.reports.players.title}</CardTitle>
          <DataTable rows={playersRows} columns={playersColumns}>
            <tfoot>
              <tr>
                <th>{t.attributes.total.title}</th>
                <td>{playerCharactersTotal}</td>
                <td>{totalParticipantsTotal}</td>
              </tr>
            </tfoot>
          </DataTable>
          <div className="mt-3 form-text">{t.reports.players.description}</div>
        </CardBody>
      </Card>
      <Report
        title={t.reports.municipality.title}
        description={t.reports.municipality.description}
        rows={muniRows}
        columns={muniColumns}
        messages={t}
        total={muniTotal}
      />
    </Container>
  );
}
