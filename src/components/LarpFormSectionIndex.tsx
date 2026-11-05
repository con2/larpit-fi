"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./LarpForm.module.scss";
import { useFormSnapshot } from "./useFormSnapshot";

export interface LarpFormSectionLink {
  id: string;
  title: string;
}

interface Props {
  formId: string;
  sections: LarpFormSectionLink[];
  messages: {
    title: string;
    /** Contains "{count}". */
    missing: string;
    done: string;
    optional: string;
  };
}

/**
 * Links to the form sections, in the same order as the sections so the CSS counters agree.
 * Without JavaScript these are plain anchor links.
 */
export default function LarpFormSectionIndex({
  formId,
  sections,
  messages: t,
}: Props) {
  const findForm = useCallback(
    () => document.getElementById(formId) as HTMLFormElement | null,
    [formId],
  );
  const snapshot = useFormSnapshot(findForm);
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    const elements = sections
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);
    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        const first = sections.find(({ id }) => visible.has(id));
        if (first) setCurrentId(first.id);
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label={t.title}>
      <ol className={styles.rail}>
        {sections.map(({ id, title }) => {
          let status: string | null = null;
          let statusClassName: string | undefined;
          if (snapshot) {
            const missingCount = snapshot.missing.filter(
              (field) => field.sectionId === id,
            ).length;
            if (missingCount > 0) {
              status = t.missing.replace("{count}", String(missingCount));
              statusClassName = styles.railMissing;
            } else if (snapshot.sectionsWithRequired.includes(id)) {
              status = t.done;
              statusClassName = styles.railDone;
            } else {
              status = t.optional;
            }
          }

          return (
            <li key={id}>
              <a
                href={`#${id}`}
                className={statusClassName}
                aria-current={currentId === id ? "true" : undefined}
              >
                {title}
                {status && <span className={styles.railStatus}>{status}</span>}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
