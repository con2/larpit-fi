"use client";

import { socialMediaLinkTitleFromHref } from "@/helpers/socialMediaLinkTitle";
import type { Translations } from "@/translations/en";
import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardTitle,
  FormControl,
  FormSelect,
  Table,
} from "react-bootstrap";

const LINK_TYPES = [
  "HOMEPAGE",
  "PHOTOS",
  "SOCIAL_MEDIA",
  "PLAYER_GUIDE",
] as const;
type LinkType = (typeof LINK_TYPES)[number];

type ExistingRow = {
  kind: "existing";
  type: LinkType;
  href: string;
  title: string;
  removed: boolean;
};

type NewRow = {
  kind: "new";
  key: string;
  type: LinkType;
  href: string;
  title: string;
};

type LinkRow = ExistingRow | NewRow;

interface LinkData {
  type: string;
  href: string;
  title: string | null;
}

interface Props {
  translations: Translations;
  initialLinks?: LinkData[];
  compact?: boolean;
}

let newRowCounter = 0;

export default function LarpLinksManager({
  translations,
  initialLinks = [],
  compact,
}: Props) {
  const t = translations.Larp.attributes.links;
  const tSection = translations.NewLarpPage.sections.links;

  const [rows, setRows] = useState<LinkRow[]>(() =>
    initialLinks
      .filter((link): link is LinkData & { type: LinkType } =>
        (LINK_TYPES as readonly string[]).includes(link.type),
      )
      .map((link) => ({
        kind: "existing",
        type: link.type,
        href: link.href,
        title: link.title ?? "",
        removed: false,
      })),
  );

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        kind: "new",
        key: String(newRowCounter++),
        type: "HOMEPAGE",
        href: "",
        title: "",
      },
    ]);
  }

  function updateRow(i: number, updates: { type?: LinkType; href?: string; title?: string }) {
    setRows((prev) =>
      prev.map((row, j) => (j === i ? { ...row, ...updates } : row)),
    );
  }

  function removeRow(i: number) {
    setRows((prev) => {
      const row = prev[i];
      if (row.kind === "existing") {
        return prev.map((r, j) =>
          j === i ? { ...(r as ExistingRow), removed: true } : r,
        );
      } else {
        return prev.filter((_, j) => j !== i);
      }
    });
  }

  function undoRemove(i: number) {
    setRows((prev) =>
      prev.map((row, j) =>
        j === i && row.kind === "existing" ? { ...row, removed: false } : row,
      ),
    );
  }

  return (
    <Card className="mb-4">
      <CardBody>
        {!compact && (
          <>
            <CardTitle>{tSection.title}</CardTitle>
            <div className="mb-3">{tSection.message}</div>
          </>
        )}
        <input type="hidden" name="link_count" value={rows.length} />
        {rows.length > 0 && (
          <Table size="sm" className="mb-2 align-middle">
            <thead>
              <tr>
                <th scope="col">{t.columnType}</th>
                <th scope="col">{t.columnUrl}</th>
                <th scope="col">{t.columnTitle}</th>
                <th scope="col"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isRemoved = row.kind === "existing" && row.removed;
                return (
                  <tr
                    key={row.kind === "existing" ? `e-${i}` : row.key}
                    className={isRemoved ? "opacity-50" : undefined}
                  >
                    {isRemoved && (
                      <input
                        type="hidden"
                        name={`link_${i}_removed`}
                        value="1"
                      />
                    )}
                    <td style={{ minWidth: "9rem" }}>
                      <FormSelect
                        name={`link_${i}_type`}
                        value={row.type}
                        onChange={(e) =>
                          updateRow(i, { type: e.target.value as LinkType })
                        }
                        disabled={isRemoved}
                        size="sm"
                      >
                        {LINK_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {t.types[type].title}
                          </option>
                        ))}
                      </FormSelect>
                    </td>
                    <td>
                      <FormControl
                        type="url"
                        name={`link_${i}_href`}
                        value={row.href}
                        onChange={(e) => {
                          const href = e.target.value;
                          const updates: { href: string; title?: string } = {
                            href,
                          };
                          if (row.type === "SOCIAL_MEDIA" && !row.title) {
                            const suggested = socialMediaLinkTitleFromHref(href);
                            if (suggested) updates.title = suggested;
                          }
                          updateRow(i, updates);
                        }}
                        disabled={isRemoved}
                        required={!isRemoved}
                        size="sm"
                        placeholder="https://…"
                      />
                    </td>
                    <td style={{ minWidth: "8rem" }}>
                      <FormControl
                        type="text"
                        name={`link_${i}_title`}
                        value={row.title}
                        onChange={(e) => updateRow(i, { title: e.target.value })}
                        disabled={isRemoved}
                        size="sm"
                        placeholder={t.titlePlaceholder}
                      />
                    </td>
                    <td className="text-nowrap">
                      {isRemoved ? (
                        <Button
                          type="button"
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => undoRemove(i)}
                        >
                          {t.undoRemove}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={() => removeRow(i)}
                        >
                          {t.removeLink}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <Button type="button" variant="outline-primary" size="sm" onClick={addRow}>
          {t.addLink}
        </Button>
      </CardBody>
    </Card>
  );
}
