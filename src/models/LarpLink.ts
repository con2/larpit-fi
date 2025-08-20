import { LarpLink, LarpLinkType } from "@/generated/prisma";
import z from "zod";

export type LarpLinkUpsertable = Pick<LarpLink, "type" | "href">;

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

  for (const [_, type] of Object.entries(LarpLinkType)) {
    const href = form[`links_${type}` as keyof LarpLinksForm];
    if (href) {
      links.push({ type, href });
    }
  }

  return links;
}
