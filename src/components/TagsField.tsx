"use client";

import Link from "next/link";
import { useState } from "react";
import { FormLabel, FormText } from "react-bootstrap";
import Select, { type MultiValue } from "react-select";

import {
  otherTagName,
  tagDescription,
  tagDescriptionExcerpt,
  tagFieldNames,
  tagMatches,
  tagName,
  tagsFieldMarker,
  type TagSummary,
} from "@/models/Tag.client";
import type { Translations } from "@/translations/en";

type TagFieldMessages = Translations["Tag"]["field"];

type Option = {
  value: string;
  label: string;
  tag: TagSummary;
};

interface TagSelectProps {
  inputId: string;
  ariaLabel?: string;
  tags: TagSummary[];
  selectedIds: readonly string[];
  onChange: (tagIds: string[]) => void;
  locale: string;
  messages: TagFieldMessages;
  /** Keeps the menu from being clipped by a scrolling container, such as a responsive table. */
  fixedMenu?: boolean;
}

/** Picks tags of the vocabulary. Renders no form fields of its own. */
export function TagSelect({
  inputId,
  ariaLabel,
  tags,
  selectedIds,
  onChange,
  locale,
  messages: t,
  fixedMenu = false,
}: TagSelectProps) {
  const options: Option[] = tags.map((tag) => ({
    value: tag.id,
    label: tagName(tag, locale),
    tag,
  }));
  const selected = selectedIds.flatMap(
    (id) => options.find((option) => option.value === id) ?? [],
  );

  return (
    <Select
      inputId={inputId}
      instanceId={inputId}
      aria-label={ariaLabel}
      className="larpit-select"
      classNamePrefix="larpit-select"
      isMulti
      options={options}
      value={selected}
      onChange={(value: MultiValue<Option>) =>
        onChange(value.map((option) => option.value))
      }
      filterOption={(option, input) => tagMatches(option.data.tag, input)}
      placeholder={t.placeholder}
      menuPosition={fixedMenu ? "fixed" : undefined}
      noOptionsMessage={() => (
        <>
          {t.noOptions} <Link href="/contact">{t.suggest}</Link>
        </>
      )}
      formatOptionLabel={(option, { context }) =>
        context === "value" ? (
          option.label
        ) : (
          <div className="larpit-select__tag-option">
            <div>
              <strong>{option.label}</strong>{" "}
              <span className="larpit-select__tag-other">
                {otherTagName(option.tag, locale)}
              </span>
              <span className="larpit-select__tag-count">
                {t.larpCount.replace("{count}", String(option.tag.larpCount))}
              </span>
            </div>
            {tagDescription(option.tag, locale) && (
              <div className="larpit-select__tag-description">
                {tagDescriptionExcerpt(tagDescription(option.tag, locale))}
              </div>
            )}
          </div>
        )
      }
    />
  );
}

/**
 * The hidden fields that carry the tags the larp had when the form was loaded and the ones
 * picked; `parseLarpTagsFromFormData` reads them.
 */
export function TagHiddenFields({
  larpId,
  loadedIds,
  selectedIds,
}: {
  larpId?: string;
  loadedIds: readonly string[];
  selectedIds: readonly string[];
}) {
  const names = tagFieldNames(larpId);
  return (
    <>
      {loadedIds.map((tagId) => (
        <input key={tagId} type="hidden" name={names.loaded} value={tagId} />
      ))}
      {selectedIds.map((tagId) => (
        <input key={tagId} type="hidden" name={names.desired} value={tagId} />
      ))}
    </>
  );
}

interface Props {
  tags: TagSummary[];
  defaultTagIds: string[];
  locale: string;
  messages: TagFieldMessages;
  compact?: boolean;
}

export default function TagsField({
  tags,
  defaultTagIds,
  locale,
  messages: t,
  compact = false,
}: Props) {
  const id = "TagsField-input";
  const [selectedIds, setSelectedIds] = useState<readonly string[]>(() =>
    defaultTagIds.filter((tagId) => tags.some((tag) => tag.id === tagId)),
  );

  return (
    <div className={compact ? "form-group mb-3" : "mb-4"}>
      <FormLabel htmlFor={id} className={compact ? "form-text" : undefined}>
        {t.label}
      </FormLabel>
      <input type="hidden" name={tagsFieldMarker} value="1" />
      <TagHiddenFields loadedIds={defaultTagIds} selectedIds={selectedIds} />
      <TagSelect
        inputId={id}
        tags={tags}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
        locale={locale}
        messages={t}
      />
      {!compact && <FormText>{t.helpText}</FormText>}
    </div>
  );
}
