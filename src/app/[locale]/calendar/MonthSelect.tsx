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
  const nativeRef = useRef<HTMLSelectElement>(null);
  const defaultOption = options.find((o) => o.value === defaultValue) ?? null;

  useEffect(() => {
    setJsEnabled(true);
  }, []);

  function handleChange(opt: SingleValue<Option>) {
    if (!opt || !nativeRef.current) return;
    nativeRef.current.value = opt.value;
    nativeRef.current.form?.requestSubmit();
  }

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
          defaultValue={defaultOption}
          onChange={handleChange}
          isSearchable
          noOptionsMessage={() => "—"}
        />
      )}
    </>
  );
}
