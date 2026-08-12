"use client";

import {
  LarpTable,
  LarpTableMessages,
  larpCellElement,
  getDefaultColumns,
  Column,
} from "@/components/LarpTable";
import Link from "next/link";
import type { OwnLarpRow } from "./page";

interface OwnLarpsTableClientProps {
  larps: OwnLarpRow[];
  messages: LarpTableMessages;
  locale: string;
  totalCount: number;
  manageLabel: string;
}

function getOwnLarpColumns(
  messages: LarpTableMessages,
  locale: string,
  manageLabel: string,
): Column<OwnLarpRow>[] {
  const defaultColumns = getDefaultColumns<OwnLarpRow>(messages, locale);

  // Remove columns not relevant on profile page to make room for role
  const filteredColumns = defaultColumns.filter(
    (col) =>
      col.slug !== "locationText" &&
      col.slug !== "municipalityName" &&
      col.slug !== "language",
  );

  // Insert role column before dateRange (last column)
  const roleColumn: Column<OwnLarpRow> = {
    slug: "role",
    title: messages.role.title,
    getCellElement: larpCellElement<OwnLarpRow>,
    getCellContents: (row) => (
      <>
        {row.roleTitles.map((roleTitle, i) => (
          <div key={i}>{roleTitle}</div>
        ))}
      </>
    ),
  };

  const actionsColumn: Column<OwnLarpRow> = {
    slug: "actions",
    title: "",
    getCellContents: (row) =>
      row.hasLocalSignup ? (
        <Link
          href={`/larp/${row.id}/signup`}
          className="btn btn-sm btn-outline-secondary"
        >
          {manageLabel}
        </Link>
      ) : null,
  };

  // Insert before the last column (dateRange)
  return [
    ...filteredColumns.slice(0, -1),
    roleColumn,
    actionsColumn,
    ...filteredColumns.slice(-1),
  ];
}

export default function OwnLarpsTableClient({
  larps,
  messages,
  locale,
  totalCount,
  manageLabel,
}: OwnLarpsTableClientProps) {
  const columns = getOwnLarpColumns(messages, locale, manageLabel);

  return (
    <LarpTable<OwnLarpRow>
      larps={larps}
      columns={columns}
      messages={messages}
      locale={locale}
      totalCount={totalCount}
    />
  );
}
