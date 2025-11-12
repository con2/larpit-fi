import { LarpLinkType } from "@/generated/prisma";
import prisma from "@/prisma";
import z from "zod";

const zLarpLinkType = z.enum<typeof LarpLinkType>(LarpLinkType);

// TODO use z.url() instead when we have proper feedback from validation
export const LarpLinkUpsertable = z.object({
  type: zLarpLinkType,
  href: z.string().max(400),
});

export type LarpLinkUpsertable = z.infer<typeof LarpLinkUpsertable>;

export const LarpLinkRemovable = z.object({
  id: z.uuid(),
});

export type LarpLinkRemovable = z.infer<typeof LarpLinkRemovable>;

// TODO Cheap-ass solution, only provides for single link of each type.
// TODO use z.url() instead when we have proper feedback from validation
export const LarpLinksForm = z.object({
  links_HOMEPAGE: z.string().max(400).optional(),
  links_PHOTOS: z.string().max(400).optional(),
  links_SOCIAL_MEDIA: z.string().max(400).optional(),
  links_PLAYER_GUIDE: z.string().max(400).optional(),
});

export type LarpLinksForm = z.infer<typeof LarpLinksForm>;

export function larpLinksToForm(links: LarpLinkUpsertable[]): LarpLinksForm {
  const result: Record<keyof LarpLinksForm, string | undefined> = {
    links_HOMEPAGE: undefined,
    links_PHOTOS: undefined,
    links_SOCIAL_MEDIA: undefined,
    links_PLAYER_GUIDE: undefined,
  };

  for (const link of links) {
    if (link.type === "HOMEPAGE") {
      result.links_HOMEPAGE = link.href;
    } else if (link.type === "PHOTOS") {
      result.links_PHOTOS = link.href;
    } else if (link.type === "SOCIAL_MEDIA") {
      result.links_SOCIAL_MEDIA = link.href;
    } else if (link.type === "PLAYER_GUIDE") {
      result.links_PLAYER_GUIDE = link.href;
    } else {
      throw new Error(`Unknown link type: ${link.type}`);
    }
  }

  return result;
}

export function formToLarpLinks(form: LarpLinksForm): LarpLinkUpsertable[] {
  const links: LarpLinkUpsertable[] = [];

  for (const type of Object.values(LarpLinkType)) {
    const href = form[`links_${type}` as keyof LarpLinksForm];
    if (href) {
      links.push({ type, href });
    }
  }

  return links;
}

export function socialMediaLinkTitleFromHref(href: string) {
  href = href.trim();

  if (href.startsWith("https://instagram.com")) {
    return "Instagram";
  } else if (
    href.startsWith("https://x.com") ||
    href.startsWith("https://twitter.com")
  ) {
    return "Twitter";
  } else if (
    href.startsWith("https://facebook.com") ||
    href.startsWith("https://fb.me")
  ) {
    return "Facebook";
  } else if (href.startsWith("https://discord.gg")) {
    return "Discord";
  } else if (
    href.startsWith("https://youtu.be") ||
    href.startsWith("https://www.youtube.com")
  ) {
    return "YouTube";
  }

  return null;
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
        data: addLinks.map(({ type, href }) => {
          href = href.trim();

          const title =
            type === LarpLinkType.SOCIAL_MEDIA
              ? socialMediaLinkTitleFromHref(href)
              : null;

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
          id: { in: removeLinks.map((link) => link.id) },
          larpId,
        },
      })
    );
  }

  await Promise.all(promises);
}
