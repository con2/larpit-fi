"use client";

type Option = { value: string; label: string };

/** Submits its form on change; the form's own submit button covers browsers without JavaScript. */
export default function MonthSelect({
  id,
  options,
  defaultValue,
  className,
}: {
  id: string;
  options: Option[];
  defaultValue: string;
  className?: string;
}) {
  return (
    <select
      id={id}
      name="month"
      defaultValue={defaultValue}
      className={`form-select ${className ?? ""}`}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
