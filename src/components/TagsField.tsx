"use client";

import Link from "next/link";
import { useState } from "react";
import { FormLabel, FormText } from "react-bootstrap";
import Select, { type MultiValue } from "react-select";

import {
  otherTagName,
  tagDescription,
  tagDescriptionExcerpt,
  tagMatches,
  tagName,
  tagsFieldMarker,
  type TagSummary,
} from "@/models/Tag.client";
import type { Translations } from "@/translations/en";

type Option = {
  value: string;
  label: string;
  tag: TagSummary;
};

interface Props {
  tags: TagSummary[];
  defaultTagIds: string[];
  locale: string;
  messages: Translations["Tag"]["field"];
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

  const options: Option[] = tags.map((tag) => ({
    value: tag.id,
    label: tagName(tag, locale),
    tag,
  }));
  const [selected, setSelected] = useState<readonly Option[]>(() =>
    options.filter((option) => defaultTagIds.includes(option.value)),
  );

  return (
    <div className={compact ? "form-group mb-3" : "mb-4"}>
      <FormLabel htmlFor={id} className={compact ? "form-text" : undefined}>
        {t.label}
      </FormLabel>
      <input type="hidden" name={tagsFieldMarker} value="1" />
      {defaultTagIds.map((tagId) => (
        <input key={tagId} type="hidden" name="tagLoaded" value={tagId} />
      ))}
      {selected.map((option) => (
        <input
          key={option.value}
          type="hidden"
          name="tagId"
          value={option.value}
        />
      ))}
      <Select
        inputId={id}
        className="larpit-select"
        classNamePrefix="larpit-select"
        isMulti
        options={options}
        value={selected}
        onChange={(value: MultiValue<Option>) => setSelected(value)}
        filterOption={(option, input) => tagMatches(option.data.tag, input)}
        placeholder={t.placeholder}
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
      {!compact && <FormText>{t.helpText}</FormText>}
    </div>
  );
}
