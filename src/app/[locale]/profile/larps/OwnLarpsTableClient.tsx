"use client";

import {
  LarpTable,
  LarpTableMessages,
  larpCellElement,
  getDefaultColumns,
  Column,
} from "@/components/LarpTable";
import type { OwnLarpRow } from "./page";

interface OwnLarpsTableClientProps {
  larps: OwnLarpRow[];
  messages: LarpTableMessages;
  locale: string;
  totalCount: number;
}

function getOwnLarpColumns(
  messages: LarpTableMessages,
  locale: string,
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

  // Insert before the last column (dateRange)
  return [
    ...filteredColumns.slice(0, -1),
    roleColumn,
    ...filteredColumns.slice(-1),
  ];
}

export default function OwnLarpsTableClient({
  larps,
  messages,
  locale,
  totalCount,
}: OwnLarpsTableClientProps) {
  const columns = getOwnLarpColumns(messages, locale);

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
