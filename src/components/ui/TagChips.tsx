import Link from "next/link";

import { compareTagNames, tagName } from "@/models/Tag.client";

export interface TagChip {
  id: string;
  slug: string;
  nameFi: string;
  nameEn: string;
}

interface Props {
  tags: TagChip[];
  locale: string;
  /** Spans instead of links, for chips inside another link. */
  static?: boolean;
  /** Shows this many chips and a `+N` chip for the rest. */
  max?: number;
  currentTagId?: string;
  small?: boolean;
}

export default function TagChips({
  tags,
  locale,
  static: isStatic = false,
  max,
  currentTagId,
  small = false,
}: Props) {
  if (tags.length === 0) return null;

  const sorted = [...tags].sort(compareTagNames(locale));
  const shown = max === undefined ? sorted : sorted.slice(0, max);
  const hiddenCount = sorted.length - shown.length;

  const className = (tag?: TagChip) =>
    [
      "lf-tag",
      "lf-tag--topic",
      small && "lf-tag--small",
      tag && tag.id === currentTagId && "lf-tag--current",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <>
      {shown.map((tag) =>
        isStatic ? (
          <span key={tag.id} className={className(tag)}>
            {tagName(tag, locale)}
          </span>
        ) : (
          <Link
            key={tag.id}
            href={`/tag/${tag.slug}`}
            className={className(tag)}
            aria-current={tag.id === currentTagId ? "page" : undefined}
          >
            {tagName(tag, locale)}
          </Link>
        ),
      )}
      {hiddenCount > 0 && <span className={className()}>+{hiddenCount}</span>}
    </>
  );
}
