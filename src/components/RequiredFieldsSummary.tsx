"use client";

import { useCallback, useRef } from "react";
import styles from "./LarpForm.module.scss";
import { focusField, useFormSnapshot } from "./useFormSnapshot";

interface Props {
  messages: {
    allFilled: string;
    /** Contains "{count}". */
    stillEmpty: string;
  };
}

/** Lists the empty required fields of the surrounding form, each linking to its field. */
export default function RequiredFieldsSummary({ messages: t }: Props) {
  const ref = useRef<HTMLParagraphElement>(null);
  const findForm = useCallback(() => ref.current?.closest("form") ?? null, []);
  const snapshot = useFormSnapshot(findForm);
  const missing = snapshot?.missing ?? [];

  return (
    <p
      ref={ref}
      className={`${styles.requiredSummary} ${snapshot && missing.length === 0 ? styles.requiredSummaryDone : ""}`}
      aria-live="polite"
    >
      {snapshot &&
        (missing.length === 0 ? (
          t.allFilled
        ) : (
          <>
            {t.stillEmpty.replace("{count}", String(missing.length))}{" "}
            {missing.map((field, index) => (
              <span key={field.id || index}>
                {index > 0 && ", "}
                <a
                  href={`#${field.id}`}
                  onClick={(event) => {
                    if (focusField(field.id)) event.preventDefault();
                  }}
                >
                  {field.label}
                </a>
              </span>
            ))}
          </>
        ))}
    </p>
  );
}
