"use client";

import { Fragment, ReactNode } from "react";
import { Column, defaultCellElement, defaultCellContents } from "./DataTable";
import { FormattedDateRange } from "./FormattedDateRange";
import getLarpHref, { ensureEndsAt } from "@/models/Larp.client";
import MaybeExternalLink from "./MaybeExternalLink";
import type { Larp, Municipality } from "@/generated/prisma/client";
import type { Translations } from "@/translations/en";

export type { Column };

export type LarpRow = Pick<
  Larp,
  | "id"
  | "name"
  | "alias"
  | "locationText"
  | "startsAt"
  | "endsAt"
  | "language"
  | "type"
> & {
  municipality: Pick<Municipality, "nameFi"> | null;
};

export type LarpTableMessages = Translations["Larp"]["clientAttributes"];

interface LarpGroup<Row extends LarpRow> {
  key: string;
  title: string;
  larps: Row[];
}

// Inlined table footer translations
function getTableFooter(
  locale: string,
  count: number,
  totalCount: number,
): ReactNode {
  if (locale === "fi") {
    return (
      <>
        Näytetään {count} larppi{count === 1 ? "" : "a"} (yhteensä {totalCount}
        ).
      </>
    );
  }
  return (
    <>
      Showing {count} larp{count === 1 ? "" : "s"} (total {totalCount}).
    </>
  );
}

function groupLarpsByYear<Row extends LarpRow>(
  larps: Row[],
  yearHeaders: LarpTableMessages["yearHeaders"],
): LarpGroup<Row>[] {
  const now = new Date();
  const currentYear = now.getFullYear();

  const groups: LarpGroup<Row>[] = [];
  let currentGroup: LarpGroup<Row> | null = null;

  for (const larp of larps) {
    let groupKey: string;
    let groupTitle: string;

    if (!larp.startsAt) {
      groupKey = "no-date";
      groupTitle = yearHeaders.noDate;
    } else {
      const year = larp.startsAt.getFullYear();
      if (year === currentYear) {
        const endDate = ensureEndsAt(larp);
        const isFuture = endDate && endDate >= now;
        if (isFuture) {
          groupKey = `${year}-future`;
          groupTitle = `${year} ${yearHeaders.upcoming}`;
        } else {
          groupKey = `${year}-past`;
          groupTitle = `${year} ${yearHeaders.past}`;
        }
      } else {
        groupKey = `${year}`;
        groupTitle = `${year}`;
      }
    }

    if (!currentGroup || currentGroup.key !== groupKey) {
      currentGroup = { key: groupKey, title: groupTitle, larps: [] };
      groups.push(currentGroup);
    }
    currentGroup.larps.push(larp);
  }

  return groups;
}

export type LarpTableVariant = "default" | "profile";

interface LarpTableProps<Row extends LarpRow> {
  larps: Row[];
  variant?: LarpTableVariant;
  messages: LarpTableMessages;
  locale: string;
  totalCount: number;
}

function larpCellElement<Row extends LarpRow>(
  row: Row,
  children?: ReactNode,
): ReactNode {
  const href = getLarpHref(row);
  return (
    <td className="align-middle" style={{ position: "relative" }}>
      <MaybeExternalLink href={href} className="stretched-link link-xxsubtle">
        {children}
      </MaybeExternalLink>
    </td>
  );
}

function getColumns<Row extends LarpRow>(
  variant: LarpTableVariant,
  messages: LarpTableMessages,
  locale: string,
): Column<Row>[] {
  const t = messages;

  const defaultColumns: Column<Row>[] = [
    {
      slug: "name",
      title: t.name.title,
      getCellElement: larpCellElement,
    },
    {
      slug: "locationText",
      title: t.locationText.title,
      getCellElement: larpCellElement,
    },
    {
      slug: "municipalityName",
      title: t.municipality.title,
      getCellElement: larpCellElement,
      getCellContents: (row) => row.municipality?.nameFi,
    },
    {
      slug: "language",
      title: t.language.title,
      getCellElement: larpCellElement,
      getCellContents: (row) =>
        t.language.choices[row.language as keyof typeof t.language.choices],
    },
    {
      slug: "type",
      title: t.type.title,
      getCellElement: larpCellElement,
      getCellContents: (row) =>
        t.type.choices[row.type as keyof typeof t.type.choices]?.title,
    },
    {
      slug: "dateRange",
      title: <>{t.dateRange.title} 🔼</>,
      getCellElement: larpCellElement,
      getCellContents: (row) => (
        <FormattedDateRange
          start={row.startsAt}
          end={row.endsAt}
          locale={locale}
        />
      ),
    },
  ];

  switch (variant) {
    case "profile":
      // TODO: customize for profile page if needed
      return defaultColumns;
    case "default":
    default:
      return defaultColumns;
  }
}

export function LarpTable<Row extends LarpRow>({
  larps,
  variant = "default",
  messages,
  locale,
  totalCount,
}: LarpTableProps<Row>) {
  const columns = getColumns<Row>(variant, messages, locale);

  // Apply defaults to columns
  const finalColumns = columns.map((column) => ({
    getCellElement: column.getCellElement ?? defaultCellElement,
    getCellContents: column.getCellContents ?? defaultCellContents,
    className: "align-middle",
    ...column,
  }));

  const groups = groupLarpsByYear(larps, messages.yearHeaders);

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover border rounded mb-5">
        <thead>
          <tr>
            {finalColumns.map((column) => (
              <th key={column.slug} scope="col" className={column.className}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.key}>
            <tr className="table-secondary no-hover">
              <th
                colSpan={finalColumns.length}
                scope="colgroup"
                className="fw-semibold no-hover"
              >
                {group.title}
              </th>
            </tr>
            {group.larps.map((row) => (
              <tr key={row.id}>
                {finalColumns.map((column) => (
                  <Fragment key={column.slug}>
                    {column.getCellElement!(row, column.getCellContents!(row))}
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
        <tfoot>
          <tr>
            <td colSpan={finalColumns.length}>
              {getTableFooter(locale, larps.length, totalCount)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default LarpTable;
