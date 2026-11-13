"use client";

import { LarpLinkType } from "@/prisma/enums";
import { socialMediaLinkTitleFromHref } from "@/helpers/socialMediaLinkTitle";
import { useState } from "react";
import { Button, FormControl, FormSelect } from "react-bootstrap";
import { PlusIcon } from "./ui/icons";
import styles from "./LarpForm.module.scss";

// Hand-maintained to avoid pulling the Prisma runtime into the client bundle.
// `satisfies` ties this to the Prisma enum so additions there will fail type-check here.
const LINK_TYPES = [
  "HOMEPAGE",
  "PHOTOS",
  "SOCIAL_MEDIA",
  "PLAYER_GUIDE",
  "SIGNUP",
  "SOURCE",
  "OTHER",
] as const satisfies readonly LarpLinkType[];
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

interface Messages {
  links: {
    addLink: string;
    removeLink: string;
    undoRemove: string;
    titlePlaceholder: string;
    titleRequiredPlaceholder: string;
    columnType: string;
    columnUrl: string;
    columnTitle: string;
    types: Record<LinkType, { title: string }>;
  };
}

interface Props {
  messages: Messages;
  initialLinks?: LinkData[];
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M2 2 L12 12 M12 2 L2 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

let newRowCounter = 0;

export default function LarpLinksManager({
  messages,
  initialLinks = [],
}: Props) {
  const t = messages.links;

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

  function updateRow(
    i: number,
    updates: { type?: LinkType; href?: string; title?: string },
  ) {
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
    <>
      <input type="hidden" name="link_count" value={rows.length} />
      {rows.length > 0 && (
        <div className={styles.linkRows}>
          <div
            className={`${styles.linkRow} ${styles.linkHeader}`}
            aria-hidden="true"
          >
            <span className="lf-label">{t.columnType}</span>
            <span className="lf-label">{t.columnUrl}</span>
            <span className="lf-label">{t.columnTitle}</span>
            <span />
          </div>
          {rows.map((row, i) => {
            const isRemoved = row.kind === "existing" && row.removed;
            const titleRequired = !isRemoved && row.type === "OTHER";
            return (
              <div
                key={row.kind === "existing" ? `e-${i}` : row.key}
                className={`${styles.linkRow} ${isRemoved ? styles.linkRowRemoved : ""}`}
              >
                <FormSelect
                  name={`link_${i}_type`}
                  aria-label={t.columnType}
                  value={row.type}
                  onChange={(e) =>
                    updateRow(i, { type: e.target.value as LinkType })
                  }
                  disabled={isRemoved}
                >
                  {LINK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {t.types[type].title}
                    </option>
                  ))}
                </FormSelect>
                <FormControl
                  type="url"
                  id={`LarpLinksManager-${i}-href`}
                  name={`link_${i}_href`}
                  aria-label={t.columnUrl}
                  className={styles.linkHref}
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
                  placeholder="https://…"
                />
                <FormControl
                  type="text"
                  id={`LarpLinksManager-${i}-title`}
                  name={`link_${i}_title`}
                  aria-label={t.columnTitle}
                  value={row.title}
                  onChange={(e) => updateRow(i, { title: e.target.value })}
                  disabled={isRemoved}
                  required={titleRequired}
                  placeholder={
                    titleRequired
                      ? t.titleRequiredPlaceholder
                      : t.titlePlaceholder
                  }
                />
                <div>
                  {isRemoved && (
                    <input type="hidden" name={`link_${i}_removed`} value="1" />
                  )}
                  {isRemoved ? (
                    <Button
                      type="button"
                      variant="outline-secondary"
                      onClick={() => undoRemove(i)}
                    >
                      {t.undoRemove}
                    </Button>
                  ) : (
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label={t.removeLink}
                      title={t.removeLink}
                      onClick={() => removeRow(i)}
                    >
                      <CloseIcon />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Button
        type="button"
        variant="outline-secondary"
        className={styles.addLink}
        onClick={addRow}
      >
        <PlusIcon size={12} />
        {t.addLink}
      </Button>
    </>
  );
}
