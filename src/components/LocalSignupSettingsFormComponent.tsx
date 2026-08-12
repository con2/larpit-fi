"use client";

import type { Translations } from "@/translations/en";
import { useState } from "react";
import { FormControl, FormLabel, FormSelect, FormText } from "react-bootstrap";

interface Props {
  attributes: Translations["LocalSignupSettings"]["attributes"];
  defaultStatus: string;
  defaultCode: string;
}

export default function LocalSignupSettingsFormComponent({
  attributes,
  defaultStatus,
  defaultCode,
}: Props) {
  const [status, setStatus] = useState(defaultStatus);
  const codeRequired = status === "CODE_REQUIRED";

  return (
    <>
      <div className="form-group mb-3">
        <FormLabel htmlFor="LocalSignupSettingsFormComponent-localSignupStatus">
          {attributes.localSignupStatus.label}
        </FormLabel>
        <FormSelect
          id="LocalSignupSettingsFormComponent-localSignupStatus"
          name="localSignupStatus"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {Object.entries(attributes.localSignupStatus.choices).map(
            ([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ),
          )}
        </FormSelect>
      </div>

      <div className="form-group mb-3">
        <FormLabel htmlFor="LocalSignupSettingsFormComponent-localSignupCode">
          {attributes.localSignupCode.label}
        </FormLabel>
        <FormControl
          id="LocalSignupSettingsFormComponent-localSignupCode"
          name="localSignupCode"
          defaultValue={defaultCode}
          maxLength={100}
          disabled={!codeRequired}
        />
        <FormText>{attributes.localSignupCode.helpText}</FormText>
      </div>
    </>
  );
}
