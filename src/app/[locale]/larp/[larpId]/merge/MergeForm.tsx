"use client";

import { SubmitButton } from "@con2/components";
import { useActionState, useState } from "react";
import { Alert, FormControl } from "react-bootstrap";

import { formatDateRange } from "@/helpers/dates";
import type { MergeLarpsError } from "@/models/LarpMerge";
import {
  customNameMaxLength,
  type MergeableField,
  type MergeFieldStatus,
  type MergeLinkOrigin,
  type MergeSide,
} from "@/models/LarpMerge.client";

import { mergeLarpAction, type MergeLarpState } from "./actions";

export interface MergeFormValue {
  /** As stored, for the result preview. */
  raw: string | number | null;
  /** Formatted for display; null when empty. */
  text: string | null;
  imageSrc?: string | null;
}

export interface MergeFormField {
  field: MergeableField;
  status: MergeFieldStatus;
  defaultSide: MergeSide;
  a: MergeFormValue;
  b: MergeFormValue;
}

export interface MergeFormLink {
  id: string;
  typeLabel: string;
  href: string;
  title: string | null;
  origin: MergeLinkOrigin;
}

export interface MergeFormMessages {
  sideTags: { a: string; b: string };
  /** `{count}` */
  identical: string;
  /** `{count}` */
  differ: string;
  /** `{auto}` and `{needed}` */
  progress: string;
  status: Record<"conflict" | "decided" | "filled" | "keepA", string>;
  writeOwn: string;
  empty: string;
  showMore: string;
  fields: Record<MergeableField, string>;
  fieldNotes: Partial<Record<MergeableField, string>>;
  links: {
    title: string;
    hint: string;
    none: string;
    origin: Record<MergeLinkOrigin, string>;
  };
  result: {
    title: string;
    /** `{count}` */
    linkCount: string;
    redirect: string;
    irreversible: string;
    /** `{count}` */
    pending: string;
    allDecided: string;
    submit: string;
    defaults: { title: string; items: string[] };
  };
  errors: Record<MergeLarpsError, string>;
}

export interface MergeFormProps {
  aId: string;
  bId: string;
  tokens: {
    aUpdateCount: number;
    bUpdateCount: number;
    aUpdatedAt: string;
    bUpdatedAt: string;
  };
  fields: MergeFormField[];
  links: MergeFormLink[];
  locale: string;
  messages: MergeFormMessages;
}

type NameChoice = MergeSide | "own";

const longFields: ReadonlySet<MergeableField> = new Set([
  "description",
  "fluffText",
]);

const initialState: MergeLarpState = { error: null };

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export default function MergeForm({
  aId,
  bId,
  tokens,
  fields,
  links,
  locale,
  messages: t,
}: MergeFormProps) {
  const [state, formAction] = useActionState(
    mergeLarpAction.bind(null, aId),
    initialState,
  );

  const differing = fields.filter((f) => f.status !== "identical");
  const identical = fields.filter((f) => f.status === "identical");

  const [sides, setSides] = useState<
    Partial<Record<MergeableField, NameChoice>>
  >(() => Object.fromEntries(differing.map((f) => [f.field, f.defaultSide])));
  // A conflict starts with A preselected, but counts as decided only once the moderator clicks
  // one of its options.
  const [confirmed, setConfirmed] = useState<ReadonlySet<MergeableField>>(
    new Set(),
  );
  const [customName, setCustomName] = useState("");
  const [expanded, setExpanded] = useState<ReadonlySet<MergeableField>>(
    new Set(),
  );
  const [keptLinks, setKeptLinks] = useState<ReadonlySet<string>>(
    () => new Set(links.map((link) => link.id)),
  );

  const isDecided = (f: MergeFormField) =>
    f.status !== "conflict" || confirmed.has(f.field);
  const pendingCount = differing.filter((f) => !isDecided(f)).length;
  const autoCount = differing.filter((f) => f.status !== "conflict").length;
  const ownNameMissing = sides.name === "own" && !customName.trim();

  const choose = (field: MergeableField, choice: NameChoice) => {
    setSides((current) => ({ ...current, [field]: choice }));
    setConfirmed((current) => new Set(current).add(field));
  };

  const chosen = (field: MergeableField): MergeFormValue => {
    const f = fields.find((candidate) => candidate.field === field)!;
    return sides[field] === "b" ? f.b : f.a;
  };
  const resultName =
    sides.name === "own" ? customName.trim() || "…" : chosen("name").text;
  const resultDates = formatDateRange(
    chosen("startsAt").raw as string | null,
    chosen("endsAt").raw as string | null,
    locale,
  );
  const resultPlace = [
    chosen("municipalityId").text,
    chosen("locationText").text,
  ]
    .filter(Boolean)
    .join(" · ");

  function statusPill(f: MergeFormField) {
    if (f.status === "conflict") {
      return confirmed.has(f.field) ? (
        <span className="lf-pill lf-pill--small lf-pill--open">
          {t.status.decided}
        </span>
      ) : (
        <span className="lf-pill lf-pill--small lf-pill--warning">
          {t.status.conflict}
        </span>
      );
    }
    if (f.status === "identical") return null;
    return <span className="lf-pill lf-pill--small">{t.status[f.status]}</span>;
  }

  function renderValue(value: MergeFormValue, clamped: boolean) {
    if (value.imageSrc) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value.imageSrc} alt="" className="lf-merge-option__image" />
      );
    }
    if (value.text === null) {
      return <em className="lf-muted">{t.empty}</em>;
    }
    return (
      <span className={clamped ? "lf-merge-option__clamp" : undefined}>
        {value.text}
      </span>
    );
  }

  function renderField(f: MergeFormField) {
    const isLong = longFields.has(f.field);
    const isExpanded = expanded.has(f.field);
    const radioName = `choice.${f.field}`;
    // A preselected conflict choice looks different until the moderator confirms it.
    const optionClass = `lf-radio-card lf-merge-option${
      isDecided(f) ? "" : " lf-merge-option--unconfirmed"
    }`;
    const option = (side: MergeSide) => (
      <label className={optionClass} key={side}>
        <input
          type="radio"
          name={radioName}
          value={side}
          checked={sides[f.field] === side}
          // Click, not change: picking the preselected option must confirm it too.
          onClick={() => choose(f.field, side)}
          onChange={() => undefined}
        />
        <span className="lf-merge-option__body">
          <span className="lf-tag lf-tag--small">{t.sideTags[side]}</span>
          {renderValue(f[side], isLong && !isExpanded)}
        </span>
      </label>
    );

    return (
      <fieldset className="lf-merge-field" key={f.field}>
        <legend className="lf-merge-field__legend">
          <span className="lf-label">{t.fields[f.field]}</span>
          {statusPill(f)}
        </legend>
        <div className="lf-merge-field__options">
          {option("a")}
          {option("b")}
        </div>
        {f.field === "name" && (
          <label className={optionClass}>
            <input
              type="radio"
              name={radioName}
              value="own"
              checked={sides.name === "own"}
              onClick={() => choose("name", "own")}
              onChange={() => undefined}
            />
            <span className="lf-merge-option__body">
              <span>{t.writeOwn}</span>
              <FormControl
                type="text"
                value={customName}
                maxLength={customNameMaxLength}
                aria-label={t.writeOwn}
                onFocus={() => choose("name", "own")}
                onChange={(event) => setCustomName(event.target.value)}
              />
            </span>
          </label>
        )}
        {isLong && !isExpanded && (
          <button
            type="button"
            className="btn btn-link btn-sm p-0 align-self-start"
            onClick={() =>
              setExpanded((current) => new Set(current).add(f.field))
            }
          >
            {t.showMore}
          </button>
        )}
        {t.fieldNotes[f.field] && (
          <p className="lf-help mb-0">{t.fieldNotes[f.field]}</p>
        )}
        {isDecided(f) && sides[f.field] !== "own" && (
          <input
            type="hidden"
            name={`field.${f.field}`}
            value={sides[f.field]}
          />
        )}
      </fieldset>
    );
  }

  return (
    <form action={formAction} className="lf-merge">
      <input type="hidden" name="bId" value={bId} />
      <input type="hidden" name="aUpdateCount" value={tokens.aUpdateCount} />
      <input type="hidden" name="bUpdateCount" value={tokens.bUpdateCount} />
      <input type="hidden" name="aUpdatedAt" value={tokens.aUpdatedAt} />
      <input type="hidden" name="bUpdatedAt" value={tokens.bUpdatedAt} />
      {sides.name === "own" && (
        <input type="hidden" name="customName" value={customName} />
      )}

      <div className="lf-merge__main">
        {state.error && <Alert variant="danger">{t.errors[state.error]}</Alert>}

        {differing.length > 0 && (
          <section className="lf-merge__section">
            <header className="lf-merge__section-header">
              <h2 className="lf-heading">
                {fill(t.differ, { count: differing.length })}
              </h2>
              <p className="lf-muted mb-0" aria-live="polite">
                {fill(t.progress, { auto: autoCount, needed: pendingCount })}
              </p>
            </header>
            {differing.map(renderField)}
          </section>
        )}

        {identical.length > 0 && (
          <details className="lf-merge__identical">
            <summary>{fill(t.identical, { count: identical.length })}</summary>
            <dl>
              {identical.map((f) => (
                <div key={f.field}>
                  <dt className="lf-label">{t.fields[f.field]}</dt>
                  <dd>{renderValue(f.a, longFields.has(f.field))}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        <section className="lf-merge__section">
          <header className="lf-merge__section-header">
            <h2 className="lf-heading">{t.links.title}</h2>
            {links.length > 0 && (
              <p className="lf-muted mb-0">{t.links.hint}</p>
            )}
          </header>
          {links.length === 0 ? (
            <p className="lf-empty">{t.links.none}</p>
          ) : (
            <ul className="lf-merge__links">
              {links.map((link) => (
                <li key={link.id}>
                  <label className="lf-merge__link">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="keepLinkId"
                      value={link.id}
                      checked={keptLinks.has(link.id)}
                      onChange={(event) =>
                        setKeptLinks((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(link.id);
                          else next.delete(link.id);
                          return next;
                        })
                      }
                    />
                    <span className="lf-merge__link-body">
                      <span className="lf-label">{link.typeLabel}</span>
                      <span className="lf-merge__href">
                        {link.title
                          ? `${link.title} — ${link.href}`
                          : link.href}
                      </span>
                    </span>
                    <span className="lf-tag lf-tag--small">
                      {t.links.origin[link.origin]}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="lf-merge__aside">
        <div className="lf-surface lf-merge__result">
          <h2 className="lf-label mb-0">{t.result.title}</h2>
          <div className="lf-merge__preview">
            <p className="lf-surface__title">{resultName}</p>
            {resultDates && <p className="lf-data mb-0">{resultDates}</p>}
            {resultPlace && <p className="lf-muted mb-0">{resultPlace}</p>}
            <p className="lf-muted mb-0">
              {fill(t.result.linkCount, { count: keptLinks.size })}
            </p>
          </div>
          <ul className="lf-merge__checklist">
            <li>{t.result.redirect}</li>
            <li>{t.result.irreversible}</li>
            <li
              className={
                pendingCount > 0 ? "lf-merge__checklist-pending" : undefined
              }
            >
              {pendingCount > 0
                ? fill(t.result.pending, { count: pendingCount })
                : t.result.allDecided}
            </li>
          </ul>
          <SubmitButton disabled={pendingCount > 0 || ownNameMissing}>
            {t.result.submit}
          </SubmitButton>
        </div>
        <section className="lf-merge__defaults">
          <h2 className="lf-label">{t.result.defaults.title}</h2>
          <ul>
            {t.result.defaults.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </aside>
    </form>
  );
}
