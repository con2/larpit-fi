import { FormattedDate } from "@/components/FormattedDate";
import { EditAction } from "@/generated/prisma/client";
import type { ModerationRequestContent } from "@/models/ModerationRequest";
import type { Translations } from "@/translations/en";
import { Temporal } from "@js-temporal/polyfill";
import { diffWords } from "diff";
import { Card, CardBody, CardTitle } from "react-bootstrap";

type FieldKind =
  | "text"
  | "multiline"
  | "enum"
  | "date"
  | "number"
  | "boolean"
  | "municipality";

/// Display order and rendering kind of the larp content fields shown in a diff.
const FIELDS: { key: keyof ModerationRequestContent; kind: FieldKind }[] = [
  { key: "name", kind: "text" },
  { key: "tagline", kind: "text" },
  { key: "type", kind: "enum" },
  { key: "language", kind: "enum" },
  { key: "openness", kind: "enum" },
  { key: "isCancelled", kind: "boolean" },
  { key: "locationText", kind: "text" },
  { key: "municipality", kind: "municipality" },
  { key: "numPlayerCharacters", kind: "number" },
  { key: "numTotalParticipants", kind: "number" },
  { key: "startsAt", kind: "date" },
  { key: "endsAt", kind: "date" },
  { key: "signupStartsAt", kind: "date" },
  { key: "signupEndsAt", kind: "date" },
  { key: "fluffText", kind: "multiline" },
  { key: "description", kind: "multiline" },
];

interface Props {
  action: EditAction;
  /// Current content of the larp, or null for a larp being created.
  oldContent: ModerationRequestContent | null;
  /// The changed (UPDATE) or non-empty (CREATE) fields to display.
  changes: Partial<ModerationRequestContent>;
  larpT: Translations["Larp"];
  changesT: Translations["ModerationRequest"]["changes"];
  locale: string;
  /// Municipality id -> name, for rendering the municipality field.
  municipalityNames: Record<string, string>;
}

function isEmptyValue(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

export default function ModerationRequestChanges({
  action,
  oldContent,
  changes,
  larpT,
  changesT,
  locale,
  municipalityNames,
}: Props) {
  const isCreate = action === EditAction.CREATE || oldContent === null;

  const Empty = () => (
    <em className="text-muted">{larpT.attributes.emptyAttribute}</em>
  );

  function displayValue(
    kind: FieldKind,
    key: keyof ModerationRequestContent,
    value: unknown,
  ) {
    if (kind === "boolean") {
      return value ? changesT.boolean.true : changesT.boolean.false;
    }
    if (isEmptyValue(value)) {
      return <Empty />;
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
          <FormattedDate locale={locale} date={value as Temporal.PlainDate} />
        );
      case "municipality":
        return municipalityNames[value as string] ?? String(value);
      default:
        return String(value);
    }
  }

  const changedFields = FIELDS.filter(({ key, kind }) => {
    if (!(key in changes)) {
      return false;
    }
    // On create, compactObject keeps `false` booleans (it only drops null/"").
    // Skip them so the "new larp" view shows only meaningful fields.
    if (isCreate && kind === "boolean" && changes[key] === false) {
      return false;
    }
    return true;
  });

  return (
    <Card className="mb-4">
      <CardBody>
        <CardTitle>
          {isCreate ? changesT.createTitle : changesT.title}
        </CardTitle>

        {changedFields.length === 0 ? (
          <p className="text-muted mb-0">{changesT.noChanges}</p>
        ) : (
          changedFields.map(({ key, kind }) => {
            const newValue = changes[key];
            const oldValue = oldContent ? oldContent[key] : undefined;
            const title = larpT.attributes[key].title;

            if (kind === "multiline") {
              return (
                <div className="mb-3" key={key}>
                  <div className="fw-bold">{title}</div>
                  <div
                    className="border rounded p-2 font-monospace"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {isCreate ? (
                      String(newValue ?? "")
                    ) : (
                      <TextDiff
                        oldText={String(oldValue ?? "")}
                        newText={String(newValue ?? "")}
                      />
                    )}
                  </div>
                </div>
              );
            }

            // For a new larp every field is new, so a neutral, full-width frame
            // (like a read-only form field) is enough — no need to highlight.
            if (isCreate) {
              return (
                <div className="mb-3" key={key}>
                  <div className="fw-bold">{title}</div>
                  <div className="border rounded px-2 py-1">
                    {displayValue(kind, key, newValue)}
                  </div>
                </div>
              );
            }

            const cleared = kind !== "boolean" && isEmptyValue(newValue);

            // Old and new are equal-width and together fill the container.
            const fillStyle = { flexBasis: 0, minWidth: 0 };
            return (
              <div className="mb-3" key={key}>
                <div className="fw-bold">{title}</div>
                <div className="d-flex align-items-stretch gap-2">
                  <div
                    className="border rounded px-2 py-1 flex-grow-1 text-muted text-decoration-line-through"
                    style={fillStyle}
                  >
                    {displayValue(kind, key, oldValue)}
                  </div>
                  <div className="d-flex align-items-center" aria-hidden>
                    →
                  </div>
                  <div
                    className={`border rounded px-2 py-1 flex-grow-1 ${
                      cleared ? "border-danger" : "border-success"
                    }`}
                    style={fillStyle}
                  >
                    {cleared ? <Empty /> : displayValue(kind, key, newValue)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardBody>
    </Card>
  );
}

function TextDiff({
  oldText,
  newText,
}: {
  oldText: string;
  newText: string;
}) {
  const parts = diffWords(oldText, newText);
  return (
    <>
      {parts.map((part, index) => {
        if (part.added) {
          return (
            <span key={index} className="bg-success-subtle">
              {part.value}
            </span>
          );
        }
        if (part.removed) {
          return (
            <span
              key={index}
              className="bg-danger-subtle text-decoration-line-through"
            >
              {part.value}
            </span>
          );
        }
        return <span key={index}>{part.value}</span>;
      })}
    </>
  );
}
