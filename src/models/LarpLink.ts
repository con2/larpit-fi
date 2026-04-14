import { LarpLinkType } from "@/generated/prisma/client";
import { socialMediaLinkTitleFromHref } from "@/helpers/socialMediaLinkTitle";
import prisma from "@/prisma";
import z from "zod";

const zLarpLinkType = z.enum<typeof LarpLinkType>(LarpLinkType);

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
});

export type LarpLinkRemovable = z.infer<typeof LarpLinkRemovable>;

export function parseIndexedLinksFromFormData(data: FormData): LarpLinkUpsertable[] {
  const count = parseInt((data.get("link_count") as string) || "0");
  const links: LarpLinkUpsertable[] = [];

  for (let i = 0; i < count; i++) {
    if (data.get(`link_${i}_removed`) === "1") continue;

    const href = ((data.get(`link_${i}_href`) as string) || "").trim();
    if (!href) continue;

    const type = (data.get(`link_${i}_type`) as string) || "";
    if (!Object.values(LarpLinkType).includes(type as LarpLinkType)) continue;

    const title = ((data.get(`link_${i}_title`) as string) || "").trim() || undefined;
    links.push({ type: type as LarpLinkType, href, title });
  }

  return links;
}

export function diffLarpLinks(
  current: LarpLinkUpsertable[],
  desired: LarpLinkUpsertable[]
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
  removeLinks: LarpLinkRemovable[]
) {
  const promises: Promise<unknown>[] = [];

  if (addLinks.length > 0) {
    promises.push(
      prisma.larpLink.createMany({
        data: addLinks.map(({ type, href, title: providedTitle }) => {
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
      })
    );
  }

  if (removeLinks.length > 0) {
    promises.push(
      prisma.larpLink.deleteMany({
        where: {
          larpId,
          OR: removeLinks.map(({ href, type }) => ({ href, type })),
        },
      })
    );
  }

  await Promise.all(promises);
}
