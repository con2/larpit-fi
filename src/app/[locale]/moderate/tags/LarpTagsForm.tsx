"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert, Button } from "react-bootstrap";

import { TagHiddenFields, TagSelect } from "@/components/TagsField";
import type { TagSummary } from "@/models/Tag.client";
import type { Translations } from "@/translations/en";

import { saveLarpTags, type SaveLarpTagsState } from "./actions";

export interface LarpTagsRow {
  id: string;
  name: string;
  href: string;
  dates: string;
  lang: string | undefined;
  tagIds: string[];
}

export interface LarpTagsFormMessages {
  columns: { name: string; dates: string; tags: string };
  save: string;
  /** `{count}` stands for the number of larps whose tags changed. */
  saved: string;
  field: Translations["Tag"]["field"];
}

const initialState: SaveLarpTagsState = { saved: 0 };

export default function LarpTagsForm({
  rows,
  tags,
  locale,
  messages: t,
}: {
  rows: LarpTagsRow[];
  tags: TagSummary[];
  locale: string;
  messages: LarpTagsFormMessages;
}) {
  const [state, formAction, isPending] = useActionState(
    saveLarpTags,
    initialState,
  );
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  // Once a save returns, the rows show the tags as stored, so that a later save does not carry
  // picks made against tags that have changed since.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    setPicked({});
  }

  return (
    <form action={formAction}>
      {state.saved > 0 && (
        <Alert variant="success">
          {t.saved.replace("{count}", String(state.saved))}
        </Alert>
      )}
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th scope="col">{t.columns.name}</th>
              <th scope="col">{t.columns.dates}</th>
              <th scope="col" style={{ minWidth: "22rem", width: "50%" }}>
                {t.columns.tags}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selectedIds = picked[row.id] ?? row.tagIds;
              return (
                <tr key={row.id}>
                  <td lang={row.lang}>
                    <Link href={row.href}>{row.name}</Link>
                  </td>
                  <td className="text-nowrap">{row.dates}</td>
                  <td>
                    <input type="hidden" name="larpId" value={row.id} />
                    <TagHiddenFields
                      larpId={row.id}
                      loadedIds={row.tagIds}
                      selectedIds={selectedIds}
                    />
                    <TagSelect
                      inputId={`LarpTagsForm-${row.id}`}
                      ariaLabel={`${t.columns.tags}: ${row.name}`}
                      tags={tags}
                      selectedIds={selectedIds}
                      onChange={(tagIds) =>
                        setPicked((current) => ({
                          ...current,
                          [row.id]: tagIds,
                        }))
                      }
                      locale={locale}
                      messages={t.field}
                      fixedMenu
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Button type="submit" disabled={isPending}>
        {t.save}
      </Button>
    </form>
  );
}
