import type { ReactNode } from "react";
import styles from "./LarpForm.module.scss";

interface FormSectionProps {
  id: string;
  title?: ReactNode;
  intro?: ReactNode;
  /** Compact sections drop the number and the intro, for the compact edit form. */
  compact?: boolean;
  children: ReactNode;
}

/**
 * A numbered form section. The number comes from a CSS counter, so sections number themselves
 * in document order; LarpFormSectionIndex numbers its links the same way.
 */
export function FormSection({
  id,
  title,
  intro,
  compact,
  children,
}: FormSectionProps) {
  return (
    <section
      id={id}
      className={styles.section}
      aria-labelledby={title ? `${id}-heading` : undefined}
    >
      {title && (
        <div className={styles.sectionHeading}>
          {!compact && (
            <span className={styles.sectionNumber} aria-hidden="true" />
          )}
          <h2 className="lf-heading" id={`${id}-heading`}>
            {title}
          </h2>
        </div>
      )}
      {!compact && intro && <div className={styles.intro}>{intro}</div>}
      {children}
    </section>
  );
}

/** RequiredFieldsSummary strips this mark when it reads a field's label. */
export function RequiredMark() {
  return (
    <span className="lf-accent" data-required-mark="" aria-hidden="true">
      {" *"}
    </span>
  );
}

interface RadioChoice {
  value: string;
  title: ReactNode;
  description?: ReactNode;
}

interface RadioGroupProps {
  idPrefix: string;
  name: string;
  legend: ReactNode;
  choices: RadioChoice[];
  defaultValue?: string | null;
  required?: boolean;
  disabled?: boolean;
  variant?: "card" | "pill";
  columns?: 1 | 2;
  helpText?: ReactNode;
}

export function RadioGroup({
  idPrefix,
  name,
  legend,
  choices,
  defaultValue,
  required,
  disabled,
  variant = "card",
  columns = 1,
  helpText,
}: RadioGroupProps) {
  const listClassName =
    variant === "pill"
      ? styles.pillRadios
      : columns === 2
        ? styles.radioCards2
        : styles.radioCards;

  return (
    <fieldset className={styles.fieldset} id={`${idPrefix}-fieldset`}>
      <legend>
        {legend}
        {required && <RequiredMark />}
      </legend>
      <div className={listClassName}>
        {choices.map(({ value, title, description }) => (
          <label
            key={value}
            className={variant === "pill" ? "lf-pill-radio" : "lf-radio-card"}
          >
            <input
              type="radio"
              id={`${idPrefix}-${value || "unset"}`}
              name={name}
              value={value}
              defaultChecked={(defaultValue ?? "") === value}
              required={required}
              disabled={disabled}
            />
            {variant === "pill" ? (
              title
            ) : (
              <span className={styles.radioText}>
                <span className={styles.radioTitle}>{title}</span>
                {description && (
                  <span className={styles.radioDescription}>{description}</span>
                )}
              </span>
            )}
          </label>
        ))}
      </div>
      {helpText && <div className="form-text">{helpText}</div>}
    </fieldset>
  );
}
