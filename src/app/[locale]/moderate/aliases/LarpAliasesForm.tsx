"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Alert, Button, FormControl } from "react-bootstrap";

import type { LarpAliasError } from "@/models/Larp";

import { saveLarpAliases, type SaveLarpAliasesState } from "./actions";

export interface LarpAliasesRow {
  id: string;
  name: string;
  href: string;
  dates: string;
  lang: string | undefined;
  suggestion: string;
}

export interface LarpAliasesFormMessages {
  columns: { name: string; dates: string; alias: string };
  save: string;
  /** `{count}` stands for the number of aliases saved. */
  saved: string;
  errors: Record<LarpAliasError, string>;
}

const initialState: SaveLarpAliasesState = { saved: 0, errors: {} };

export default function LarpAliasesForm({
  rows,
  maxLength,
  messages: t,
}: {
  rows: LarpAliasesRow[];
  maxLength: number;
  messages: LarpAliasesFormMessages;
}) {
  const [state, formAction, isPending] = useActionState(
    saveLarpAliases,
    initialState,
  );
  // Controlled, so that a row that failed to save keeps what the moderator typed.
  const [values, setValues] = useState<Record<string, string>>({});

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
              <th scope="col" style={{ minWidth: "18rem" }}>
                {t.columns.alias}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const error = state.errors[row.id];
              return (
                <tr key={row.id}>
                  <td lang={row.lang}>
                    <Link href={row.href}>{row.name}</Link>
                  </td>
                  <td className="text-nowrap">{row.dates}</td>
                  <td>
                    <input type="hidden" name="larpId" value={row.id} />
                    <FormControl
                      type="text"
                      name="alias"
                      aria-label={`${t.columns.alias}: ${row.name}`}
                      value={values[row.id] ?? row.suggestion}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [row.id]: event.target.value,
                        }))
                      }
                      maxLength={maxLength}
                      isInvalid={!!error}
                      autoCapitalize="none"
                      spellCheck={false}
                    />
                    {error && (
                      <FormControl.Feedback type="invalid">
                        {t.errors[error]}
                      </FormControl.Feedback>
                    )}
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
