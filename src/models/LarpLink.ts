import { and, or } from "@prisma/orm-postgres/orm-client";
import z from "zod";

import { socialMediaLinkTitleFromHref } from "@/helpers/socialMediaLinkTitle";
import { iso } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { LarpLinkType } from "@/prisma/enums";

const zLarpLinkType = z.enum(LarpLinkType);

// TODO use z.url() instead when we have proper feedback from validation
export const LarpLinkUpsertable = z.object({
  type: zLarpLinkType,
  href: z.string().max(400),
  title: z.string().max(200).optional(),
});

export type LarpLinkUpsertable = z.infer<typeof LarpLinkUpsertable>;

export const LarpLinkRemovable = z.object({
  type: zLarpLinkType,
  href: z.string(),
  title: z.string().optional(),
});

export type LarpLinkRemovable = z.infer<typeof LarpLinkRemovable>;

// Only http(s) URLs may be stored as link hrefs. Schemes like `javascript:` or
// `data:` parse successfully via `new URL` but would become XSS vectors when
// rendered as anchor hrefs on the public larp page.
export function isSafeLinkHref(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseIndexedLinksFromFormData(
  data: FormData,
): LarpLinkUpsertable[] {
  const count = parseInt((data.get("link_count") as string) || "0");
  const links: LarpLinkUpsertable[] = [];

  for (let i = 0; i < count; i++) {
    if (data.get(`link_${i}_removed`) === "1") continue;

    const href = ((data.get(`link_${i}_href`) as string) || "").trim();
    if (!href || !isSafeLinkHref(href)) continue;

    const type = (data.get(`link_${i}_type`) as string) || "";
    if (!Object.values(LarpLinkType).includes(type as LarpLinkType)) continue;

    const title =
      ((data.get(`link_${i}_title`) as string) || "").trim() || undefined;
    links.push({ type: type as LarpLinkType, href, title });
  }

  return links;
}

export function diffLarpLinks(
  current: LarpLinkUpsertable[],
  desired: LarpLinkUpsertable[],
): { addLinks: LarpLinkUpsertable[]; removeLinks: LarpLinkRemovable[] } {
  const key = (l: LarpLinkUpsertable) => `${l.type}:${l.href}:${l.title ?? ""}`;
  const currentKeys = new Set(current.map(key));
  const desiredKeys = new Set(desired.map(key));

  return {
    addLinks: desired.filter((l) => !currentKeys.has(key(l))),
    removeLinks: current.filter((l) => !desiredKeys.has(key(l))),
  };
}

export async function handleLarpLinks(
  larpId: string,
  addLinks: LarpLinkUpsertable[],
  removeLinks: LarpLinkRemovable[],
) {
  if (removeLinks.length === 0 && addLinks.length === 0) {
    return;
  }

  // Title-only edits produce the same (type, href) in both addLinks and
  // removeLinks. Sequence delete-then-create in a transaction so that an
  // earlier-completing insert cannot be wiped by the subsequent delete
  // (whose WHERE matches by type+href, not title).
  await db.transaction(async (tx) => {
    if (removeLinks.length > 0) {
      await tx.orm.public.LarpLink.where({ larpId })
        .where((l) =>
          or(
            ...removeLinks.map(({ href, type }) =>
              and(l.href.eq(href), l.type.eq(type)),
            ),
          ),
        )
        .deleteAndCount();
    }

    if (addLinks.length > 0) {
      await tx.orm.public.LarpLink.createAndCount(
        addLinks.map(({ type, href, title: providedTitle }) => {
          href = href.trim();

          const title =
            providedTitle?.trim() ||
            (type === LarpLinkType.SOCIAL_MEDIA
              ? socialMediaLinkTitleFromHref(href)
              : null);

          return {
            larpId,
            type,
            href,
            title,
          };
        }),
      );
    }

    // API consumers polling with updatedAfter need to see link changes, and
    // updatedAt only moves on writes to the larp row itself.
    await tx.orm.public.Larp.where({ id: larpId }).update({
      updatedAt: iso(new Date()),
    });
  });
}
