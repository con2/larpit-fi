"use client";

import { useCallback, useState } from "react";
import { FormControl } from "react-bootstrap";

interface Props {
  id?: string;
  name: string;
  rows?: number;
  defaultValue?: string;
  readOnly?: boolean;
  maxLength: number;
}

export default function TextArea({
  id,
  name,
  rows,
  defaultValue,
  readOnly,
  maxLength,
}: Props) {
  const [length, setLength] = useState(defaultValue?.length ?? 0);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.target;
      setLength(el.value.length);
      if (el.value.length > maxLength) {
        el.setCustomValidity(
          `Maximum length is ${maxLength} characters (current: ${el.value.length}).`
        );
      } else {
        el.setCustomValidity("");
      }
    },
    [maxLength]
  );

  const atLimit = length >= maxLength;

  return (
    <div>
      <FormControl
        as="textarea"
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        readOnly={readOnly}
        maxLength={maxLength}
        onChange={handleChange}
      />
      <small className={atLimit ? "text-danger" : "text-muted"}>
        {length}/{maxLength}
      </small>
    </div>
  );
}
