"use client";

import { ReactNode, useState } from "react";
import { FormLabel } from "react-bootstrap";
import Select, { SingleValue } from "react-select";

export type SelectableLarpSerialized = {
  id: string;
  name: string;
  type: string;
  startsAt: string | null;
  endsAt: string | null;
};

type Option = {
  value: string;
  label: string;
  larp: SelectableLarpSerialized;
};

function formatDateRange(
  locale: string,
  startsAt: string | null,
  endsAt: string | null,
): string {
  if (!startsAt) return "";
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  if (!endsAt || endsAt === startsAt) return fmt.format(new Date(startsAt));
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (start.getFullYear() === end.getFullYear()) {
    return fmt.formatRange(start, end);
  }
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

function makeLarpLabel(
  larp: SelectableLarpSerialized,
  larpTypeChoices: Record<string, string>,
  locale: string,
): string {
  const typeName = larpTypeChoices[larp.type] ?? larp.type;
  const dateRange = formatDateRange(locale, larp.startsAt, larp.endsAt);
  return dateRange
    ? `${larp.name} (${typeName}, ${dateRange})`
    : `${larp.name} (${typeName})`;
}

export default function SelectLarpCombobox({
  larps,
  name,
  defaultValue,
  title,
  locale,
  larpTypeChoices,
  className = "mb-3",
}: {
  larps: SelectableLarpSerialized[];
  name: string;
  defaultValue?: string;
  title: ReactNode;
  locale: string;
  larpTypeChoices: Record<string, string>;
  className?: string;
}) {
  const id = `SelectLarpCombobox-${name}`;

  const options: Option[] = larps.map((larp) => ({
    value: larp.id,
    label: makeLarpLabel(larp, larpTypeChoices, locale),
    larp,
  }));

  const defaultOption = defaultValue
    ? (options.find((o) => o.value === defaultValue) ?? null)
    : null;

  const [selected, setSelected] = useState<Option | null>(defaultOption);

  return (
    <div className={`form-group ${className}`}>
      <FormLabel htmlFor={id}>{title}*</FormLabel>
      <input type="hidden" name={name} value={selected?.value ?? ""} required />
      <Select
        inputId={id}
        options={options}
        value={selected}
        onChange={(opt: SingleValue<Option>) => setSelected(opt ?? null)}
        isClearable
        isSearchable
        placeholder=""
        noOptionsMessage={() => "—"}
      />
    </div>
  );
}
