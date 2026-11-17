import { Temporal } from "@js-temporal/polyfill";
import { diffWords } from "diff";
import type { ReactNode } from "react";

import { FormattedDate } from "@/components/FormattedDates";
import { Separated } from "@/components/moderation/requestDisplay";
import { selectionInputName } from "@/components/moderation/selection";
import {
  type ContentFieldKind,
  contentFields,
  shownContentFields,
} from "@/models/ModerationQueue";
import type { ModerationRequestContent } from "@/models/ModerationRequest";
import { EditAction } from "@/prisma/enums";
import type { Translations } from "@/translations/en";

interface Props {
  action: EditAction;
  /** The values the request sets: changed fields for an edit, filled-in fields for a new larp. */
  changes: Partial<ModerationRequestContent>;
  /**
   * The values the changed fields had before, or null to show the request's values alone,
   * as for a new larp or an edit applied before pre-edit values were kept.
   */
  before: Partial<ModerationRequestContent> | null;
  columns: { before: string; after: string };
  /** The form whose checkboxes select fields for approval, or null for a read-only view. */
  selectFormId: string | null;
  larpT: Translations["Larp"];
  changesT: Translations["ModerationRequest"]["changes"];
  detailT: Translations["ModerationRequest"]["detail"];
  locale: string;
  municipalityNames: Record<string, string>;
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

export default function ModerationRequestChanges({
  action,
  changes,
  before,
  columns,
  selectFormId,
  larpT,
  changesT,
  detailT,
  locale,
  municipalityNames,
}: Props) {
  const isCreate = action === EditAction.CREATE;
  const fields = shownContentFields(action, changes);

  const empty = <em className="lf-dim">{larpT.attributes.emptyAttribute}</em>;

  function displayValue(
    kind: ContentFieldKind,
    key: keyof ModerationRequestContent,
    value: unknown,
  ): ReactNode {
    if (kind === "boolean") {
      return value ? changesT.boolean.true : changesT.boolean.false;
    }
    if (isEmptyValue(value)) {
      return empty;
    }
    switch (kind) {
      case "enum":
        if (key === "type") {
          return (
            larpT.attributes.type.choices[
              value as keyof typeof larpT.attributes.type.choices
            ]?.title ?? String(value)
          );
        }
        if (key === "language") {
          return (
            larpT.attributes.language.choices[
              value as keyof typeof larpT.attributes.language.choices
            ] ?? String(value)
          );
        }
        if (key === "openness") {
          return (
            larpT.attributes.openness.choices[
              value as keyof typeof larpT.attributes.openness.choices
            ]?.title ?? String(value)
          );
        }
        return String(value);
      case "date":
        return (
          <FormattedDate
            locale={locale}
            date={
              value instanceof Temporal.PlainDate
                ? value
                : Temporal.PlainDate.from(String(value))
            }
          />
        );
      case "municipality":
        return municipalityNames[value as string] ?? String(value);
      default:
        return String(value);
    }
  }

  const leftEmpty = isCreate
    ? contentFields
        .filter(({ key, kind }) => kind !== "boolean" && !(key in changes))
        .map(({ key }) => larpT.attributes[key].title)
    : [];

  if (fields.length === 0) {
    return <p className="lf-empty">{changesT.noChanges}</p>;
  }

  return (
    <div className="lf-mod-changes">
      {fields.map(({ key, kind }) => {
        const title = larpT.attributes[key].title;
        const newValue = changes[key];
        const hasBefore = before !== null && key in before;
        const oldValue = hasBefore ? before[key] : undefined;
        const checkboxId = `ModerationRequestChanges-${key}`;

        const label = selectFormId ? (
          <label className="lf-mod-change__label" htmlFor={checkboxId}>
            <input
              type="checkbox"
              className="form-check-input"
              id={checkboxId}
              form={selectFormId}
              name={selectionInputName}
              value={`fields:${key}`}
              defaultChecked
            />
            {title}
          </label>
        ) : (
          <span className="lf-mod-change__label">{title}</span>
        );

        let values: ReactNode;
        if (!hasBefore) {
          values = (
            <div className="lf-mod-value lf-mod-value--single">
              {kind === "multiline" ? (
                <div className="lf-mod-value__text">
                  {String(newValue ?? "")}
                </div>
              ) : (
                displayValue(kind, key, newValue)
              )}
            </div>
          );
        } else if (kind === "multiline") {
          values = (
            <div className="lf-mod-value lf-mod-value--single">
              <span className="lf-label">
                {columns.before} → {columns.after}
              </span>
              <div className="lf-mod-value__text">
                <TextDiff
                  oldText={String(oldValue ?? "")}
                  newText={String(newValue ?? "")}
                />
              </div>
            </div>
          );
        } else {
          values = (
            <div className="lf-mod-values">
              <div className="lf-mod-value lf-mod-value--before">
                <span className="lf-label">{columns.before}</span>
                <div>{displayValue(kind, key, oldValue)}</div>
              </div>
              <div className="lf-mod-value lf-mod-value--after">
                <span className="lf-label">{columns.after}</span>
                <div>{displayValue(kind, key, newValue)}</div>
              </div>
            </div>
          );
        }

        return (
          <div className="lf-mod-change" key={key}>
            {label}
            {values}
          </div>
        );
      })}
      {leftEmpty.length > 0 && (
        <p className="lf-help mb-0">
          {detailT.leftEmpty} <Separated separator=", ">{leftEmpty}</Separated>
        </p>
      )}
    </div>
  );
}

/**
 * One change from a list (a link, a tag, a related larp, the role), with a checkbox when the
 * change can be selected for approval.
 */
export function ChangeItem({
  selectFormId,
  value,
  verb,
  children,
}: {
  selectFormId: string | null;
  /** The checkbox value, such as `addLinks:0`. */
  value: string;
  verb?: string;
  children: ReactNode;
}) {
  const id = `ModerationRequestChange-${value.replace(":", "-")}`;
  const content = (
    <>
      {verb && <span className="lf-label lf-mod-item__verb">{verb}</span>}
      <span className="lf-mod-item__content">{children}</span>
    </>
  );
  return (
    <li className="lf-mod-item">
      {selectFormId ? (
        <label htmlFor={id}>
          <input
            type="checkbox"
            className="form-check-input"
            id={id}
            form={selectFormId}
            name={selectionInputName}
            value={value}
            defaultChecked
          />
          {content}
        </label>
      ) : (
        content
      )}
    </li>
  );
}

function TextDiff({ oldText, newText }: { oldText: string; newText: string }) {
  const parts = diffWords(oldText, newText);
  return (
    <>
      {parts.map((part, index) => {
        if (part.added) {
          return (
            <ins key={index} className="lf-mod-diff--added">
              {part.value}
            </ins>
          );
        }
        if (part.removed) {
          return (
            <del key={index} className="lf-mod-diff--removed">
              {part.value}
            </del>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </>
  );
}
