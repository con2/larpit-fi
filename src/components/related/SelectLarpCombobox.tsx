"use client";

import { formatDateRange } from "@/helpers/dates";
import { ReactNode, useState } from "react";
import { FormLabel } from "react-bootstrap";
import Select, { SingleValue } from "react-select";
import { typesetDashes } from "@/helpers/larpName";

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

function makeLarpLabel(
  larp: SelectableLarpSerialized,
  larpTypeChoices: Record<string, string>,
  locale: string,
): string {
  const typeName = larpTypeChoices[larp.type] ?? larp.type;
  const dateRange = formatDateRange(larp.startsAt, larp.endsAt, locale);
  const name = typesetDashes(larp.name);
  return dateRange
    ? `${name} (${typeName}, ${dateRange})`
    : `${name} (${typeName})`;
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
        className="larpit-select"
        classNamePrefix="larpit-select"
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
