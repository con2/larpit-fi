"use client";

import { splitRunSuffix } from "@/helpers/larpName";
import { formatShortDateRange } from "@/helpers/dates";
import { Language, LarpType, Openness } from "@/prisma/enums";
import { formatDateRange } from "@/helpers/dates";
import { useCallback } from "react";
import { getSignupPillState } from "./ui/signupPillState";
import styles from "./LarpForm.module.scss";
import { useFormSnapshot } from "./useFormSnapshot";

export interface LarpFormPreviewMessages {
  title: string;
  note: string;
  signupNote: string;
  namePlaceholder: string;
  noDate: string;
  pill: {
    /** Contains "{date}". */
    openUntil: string;
    /** Contains "{date}". */
    opens: string;
    openIndefinitely: string;
    over: string;
    inviteOnly: string;
    cancelled: string;
  };
  languages: Record<string, string>;
  types: Record<string, string>;
}

interface Props {
  formId: string;
  locale: string;
  messages: LarpFormPreviewMessages;
}

function isPlainDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function dateOrNull(value: string | undefined) {
  return isPlainDate(value) ? value : null;
}

function isOneOf<T extends string>(
  values: Record<string, T>,
  value: string | undefined,
): value is T {
  return (Object.values(values) as string[]).includes(value ?? "");
}

/** The list row of ui/LarpRow, drawn from the form's current values. */
export default function LarpFormPreview({
  formId,
  locale,
  messages: t,
}: Props) {
  const findForm = useCallback(
    () => document.getElementById(formId) as HTMLFormElement | null,
    [formId],
  );
  const snapshot = useFormSnapshot(findForm);
  const values = snapshot?.values ?? {};

  const name = (values.name ?? "").trim();
  const split = splitRunSuffix(name);
  const tagline = (values.tagline ?? "").trim();
  const type = isOneOf(LarpType, values.type) ? values.type : null;
  const language = isOneOf(Language, values.language) ? values.language : null;
  const openness = isOneOf(Openness, values.openness) ? values.openness : null;
  const startsAt = dateOrNull(values.startsAt);
  const endsAt = dateOrNull(values.endsAt);
  const municipality = values.municipality
    ? snapshot?.selectedText.municipality
    : null;
  const cancelled = values.isCancelled != null;

  const pillState = getSignupPillState({
    openness,
    startsAt,
    endsAt,
    signupStartsAt: dateOrNull(values.signupStartsAt),
    signupEndsAt: dateOrNull(values.signupEndsAt),
    cancelledAt: cancelled ? new Date() : null,
  });
  const pillDate = pillState?.date
    ? formatShortDateRange(pillState.date, null, locale)
    : "";
  const pillText = pillState
    ? {
        cancelled: t.pill.cancelled,
        inviteOnly: t.pill.inviteOnly,
        openUntil: t.pill.openUntil.replace("{date}", pillDate),
        openIndefinitely: t.pill.openIndefinitely,
        opens: t.pill.opens.replace("{date}", pillDate),
        over: t.pill.over,
      }[pillState.reason]
    : null;

  const subParts: { text: string; campaign?: boolean }[] = [];
  if (municipality) subParts.push({ text: municipality });
  if (language && language !== Language.fi) {
    subParts.push({ text: t.languages[language] });
  }
  if (type === LarpType.CAMPAIGN_LARP || type === LarpType.CAMPAIGN) {
    subParts.push({ text: t.types[type], campaign: true });
  }

  const rowClassName = cancelled ? "lf-row lf-row--cancelled" : "lf-row";
  const showSignupNote =
    openness === Openness.OPEN &&
    (pillState?.kind === "open" || pillState?.kind === "soon");

  return (
    <section className={styles.asideBlock}>
      <h2 className="lf-label">{t.title}</h2>
      <div className={styles.preview}>
        <div
          className={rowClassName}
          lang={language && language !== Language.OTHER ? language : undefined}
        >
          <div className="lf-row__date">
            {startsAt || endsAt ? (
              formatDateRange(startsAt, endsAt, locale)
            ) : (
              <span className={styles.placeholder}>{t.noDate}</span>
            )}
          </div>
          <div className="lf-row__main">
            <div className="lf-row__title">
              {name ? (
                split.suffix ? (
                  <>
                    {split.name}{" "}
                    <span className="lf-row__suffix">{split.suffix}</span>
                  </>
                ) : (
                  name
                )
              ) : (
                <span className={styles.placeholder}>{t.namePlaceholder}</span>
              )}
            </div>
            {subParts.length > 0 && (
              <div className="lf-row__sub">
                {subParts.map((part, index) => (
                  <span key={index}>
                    {index > 0 && " · "}
                    {part.campaign ? (
                      <span className="lf-campaign">{part.text}</span>
                    ) : (
                      part.text
                    )}
                  </span>
                ))}
              </div>
            )}
            {tagline && <div className="lf-row__tagline">{tagline}</div>}
          </div>
          {pillState && (
            <div className="lf-row__aside">
              <span className={`lf-pill lf-pill--${pillState.kind}`}>
                {pillText}
              </span>
            </div>
          )}
        </div>
      </div>
      <p className={styles.previewNote}>
        {t.note}
        {showSignupNote && <> {t.signupNote}</>}
      </p>
    </section>
  );
}
