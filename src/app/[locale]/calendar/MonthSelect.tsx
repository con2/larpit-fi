"use client";

import { useEffect, useRef, useState } from "react";
import Select, { SingleValue } from "react-select";

type Option = { value: string; label: string };

export default function MonthSelect({
  options,
  defaultValue,
}: {
  options: Option[];
  defaultValue: string;
}) {
  const [jsEnabled, setJsEnabled] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const nativeRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setJsEnabled(true);
  }, []);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function handleChange(opt: SingleValue<Option>) {
    if (!opt || !nativeRef.current) return;
    nativeRef.current.value = opt.value;
    nativeRef.current.form?.requestSubmit();
  }

  const selectedOption = options.find((o) => o.value === value) ?? null;

  return (
    <>
      {/* Always rendered: provides form value and noscript fallback */}
      <select
        ref={nativeRef}
        name="month"
        defaultValue={defaultValue}
        className="form-select"
        style={jsEnabled ? { display: "none" } : undefined}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {jsEnabled && (
        <Select
          options={options}
          value={selectedOption}
          onChange={handleChange}
          isSearchable
          noOptionsMessage={() => "—"}
        />
      )}
    </>
  );
}
