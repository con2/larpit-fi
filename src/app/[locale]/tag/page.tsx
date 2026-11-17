import { ModalButton, SubmitButton } from "@con2/components";
import type { Metadata } from "next";
import Link from "next/link";
import { FormControl, FormLabel, FormText } from "react-bootstrap";

import { auth } from "@/auth";
import FilterBar, {
  FilterGroup,
  type FilterOption,
} from "@/components/ui/FilterBar";
import { EditIcon, PlusIcon } from "@/components/ui/icons";
import TagChips from "@/components/ui/TagChips";
import { getTagsWithCounts, type TagError } from "@/models/Tag";
import {
  compareTagNames,
  otherTagName,
  tagDescription,
  tagDescriptionExcerpt,
  tagName,
  tagSlugMaxLength,
  type TagSummary,
} from "@/models/Tag.client";
import { canModerate, getUserFromSession } from "@/models/User";
import { getReader } from "@/prisma/reader";
import { getTranslations } from "@/translations";
import type { Translations } from "@/translations/en";
import { removeTag, saveTag } from "./actions";
import styles from "./page.module.scss";

type Sort = "used" | "name" | "created";
const sorts: Sort[] = ["used", "name", "created"];

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = getTranslations(locale).Tag;
  return { title: t.listTitle, description: t.indexIntro };
}

function sortTags(tags: TagSummary[], sort: Sort, locale: string) {
  const byName = compareTagNames(locale);
  const sorted = [...tags];
  switch (sort) {
    case "used":
      return sorted.sort((a, b) => b.larpCount - a.larpCount || byName(a, b));
    case "name":
      return sorted.sort(byName);
    case "created":
      return sorted.reverse();
  }
}

function TagFormAside({
  tag,
  values,
  error,
  locale,
  messages: t,
}: {
  tag: TagSummary | null;
  locale: string;
  values: Record<string, string | undefined>;
  error: TagError | null;
  messages: Translations["Tag"];
}) {
  const value = (field: keyof TagSummary & string) =>
    values[field] ?? (tag ? String(tag[field]) : "");
  const slugLocked = !!tag && tag.larpCount > 0;
  const textFields = [
    ["nameFi", t.attributes.nameFi.title],
    ["nameEn", t.attributes.nameEn.title],
  ] as const;
  const descriptionFields = [
    ["descriptionFi", t.attributes.descriptionFi.title],
    ["descriptionEn", t.attributes.descriptionEn.title],
  ] as const;

  return (
    <aside className={`lf-surface ${styles.aside}`}>
      <h2 className="lf-title">{tag ? t.actions.editTag : t.actions.newTag}</h2>
      {error && (
        <p className="text-danger" role="alert">
          {t.errors[error]}
        </p>
      )}
      <form action={saveTag.bind(null, tag?.id ?? null)}>
        {tag && <input type="hidden" name="currentSlug" value={tag.slug} />}
        {textFields.map(([field, label]) => (
          <div className="mb-3" key={field}>
            <FormLabel htmlFor={`TagForm-${field}`}>{label}</FormLabel>
            <FormControl
              id={`TagForm-${field}`}
              name={field}
              defaultValue={value(field)}
              maxLength={100}
              required
            />
          </div>
        ))}
        <div className="mb-3">
          <FormLabel htmlFor="TagForm-slug">
            {t.attributes.slug.title}
          </FormLabel>
          <FormControl
            id="TagForm-slug"
            name="slug"
            defaultValue={value("slug")}
            maxLength={tagSlugMaxLength}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            readOnly={slugLocked}
            required={!!tag}
          />
          <FormText>
            {slugLocked
              ? t.attributes.slug.lockedHelpText
              : t.attributes.slug.helpText}
          </FormText>
        </div>
        {descriptionFields.map(([field, label]) => (
          <div className="mb-3" key={field}>
            <FormLabel htmlFor={`TagForm-${field}`}>{label}</FormLabel>
            <FormControl
              as="textarea"
              rows={4}
              id={`TagForm-${field}`}
              name={field}
              defaultValue={value(field)}
              maxLength={2000}
            />
          </div>
        ))}
        <FormText className="d-block mb-3">
          {t.attributes.descriptionHelpText}
        </FormText>
        <div className={styles.formActions}>
          <SubmitButton className="btn btn-primary">
            {t.actions.save}
          </SubmitButton>
          <Link href="/tag" className="btn btn-link">
            {t.actions.cancel}
          </Link>
        </div>
      </form>
      {tag && (
        <div className={styles.deleteAction}>
          <ModalButton
            title={t.actions.delete}
            className="btn btn-outline-danger btn-sm"
            messages={{ cancel: t.actions.cancel, submit: t.actions.delete }}
            submitButtonVariant="danger"
            action={removeTag.bind(null, tag.id)}
          >
            <p>
              {t.actions.deleteConfirm(tagName(tag, locale), tag.larpCount)}
            </p>
          </ModalButton>
        </div>
      )}
    </aside>
  );
}

export default async function TagIndexPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  const translations = getTranslations(locale);
  const t = translations.Tag;

  const [tags, user] = await Promise.all([
    getReader().then(getTagsWithCounts),
    auth().then(getUserFromSession),
  ]);
  const isModerator = canModerate(user);

  const sort: Sort = sorts.includes(query.sort as Sort)
    ? (query.sort as Sort)
    : "used";
  const sorted = sortTags(tags, sort, locale);
  const usedTags = tags.filter((tag) => tag.larpCount > 0);

  const numberFormat = new Intl.NumberFormat(locale);
  const formatCount = (count: number) => numberFormat.format(count);
  const taggedLarpCount = usedTags.reduce((sum, tag) => sum + tag.larpCount, 0);

  const editedTag = query.edit
    ? (tags.find((tag) => tag.slug === query.edit) ?? null)
    : null;
  const showForm = isModerator && (query.new === "1" || !!editedTag);
  const error =
    query.error && query.error in t.errors ? (query.error as TagError) : null;

  const sortOptions: FilterOption[] = sorts.map((value) => ({
    title: t.sort[value],
    href: value === "used" ? "/tag" : `/tag?sort=${value}`,
    current: sort === value,
  }));

  return (
    <>
      <header className="lf-container lf-page-header">
        <p className="lf-eyebrow">{t.indexEyebrow}</p>
        <h1 className="lf-display-l">{t.listTitle}</h1>
        <p className="lf-lede">{t.indexIntro}</p>
        {tags.length > 0 && (
          <p className="lf-data lf-muted">
            {t.summary(formatCount(tags.length), formatCount(taggedLarpCount))}
          </p>
        )}
        {usedTags.length > 0 && (
          <div className="lf-tags">
            <TagChips tags={usedTags} locale={locale} />
          </div>
        )}
      </header>

      <div
        className={`lf-container ${styles.body} ${showForm ? styles.withAside : ""}`}
      >
        <div className={styles.main}>
          <div className={styles.toolbar}>
            <FilterBar>
              <FilterGroup label={t.sort.label} options={sortOptions} />
            </FilterBar>
            {isModerator && (
              <Link href="/tag?new=1" className="btn btn-primary btn-sm">
                <PlusIcon size={14} /> {t.actions.newTag}
              </Link>
            )}
          </div>

          {tags.length === 0 && <p className="lf-empty">{t.empty}</p>}

          <ul className={styles.list}>
            {sorted.map((tag) => {
              const description = tagDescription(tag, locale);
              return (
                <li
                  key={tag.id}
                  id={`tag-${tag.slug}`}
                  className={`${styles.row} ${editedTag?.id === tag.id ? styles.rowEditing : ""}`}
                >
                  <div className={styles.rowMain}>
                    <Link href={`/tag/${tag.slug}`} className={styles.rowName}>
                      {tagName(tag, locale)}
                    </Link>{" "}
                    <span className="lf-dim">{otherTagName(tag, locale)}</span>
                    {description && (
                      <p className={styles.rowDescription}>
                        {tagDescriptionExcerpt(description, 160)}
                      </p>
                    )}
                  </div>
                  <span className={`lf-data lf-muted ${styles.rowCount}`}>
                    {t.larpCount(formatCount(tag.larpCount))}
                  </span>
                  {isModerator && (
                    <Link
                      href={`/tag?edit=${encodeURIComponent(tag.slug)}${sort === "used" ? "" : `&sort=${sort}`}`}
                      className={styles.rowEdit}
                      aria-label={t.actions.edit(tagName(tag, locale))}
                      title={t.actions.edit(tagName(tag, locale))}
                    >
                      <EditIcon size={16} />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {showForm && (
          <TagFormAside
            key={editedTag?.id ?? "new"}
            tag={editedTag}
            values={error ? query : {}}
            error={error}
            locale={locale}
            messages={t}
          />
        )}
      </div>
    </>
  );
}
