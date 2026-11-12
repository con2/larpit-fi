import z from "zod";

import { db } from "@/prisma/db";
import { deleteHeaderImage } from "./HeaderImage";
import {
  contactPageSlug,
  frontPageSlug,
  type PageSlugError,
  protectedPageSlugs,
  seeAlsoSlug,
  validatePageSlug,
} from "./Page.client";

export const PageForm = z.object({
  title: z.string().min(1),
  ingress: z.string().optional().default(""),
  content: z.string().optional().default(""),
  menuPosition: z.number().int().nullable(),
});

export const NewPageForm = z.object({
  slug: z.string(),
  language: z.enum(["fi", "en"]),
  title: z.string().min(1),
  menuPosition: z.number().int().nullable(),
});

const defaultPages: Record<
  string,
  Record<string, { title: string; ingress?: string; content?: string }>
> = {
  [frontPageSlug]: {
    en: {
      title: "Larp.fi development instance",
      ingress: `### Larp.fi development instance

The actual site can be found at [larp.fi](https://larp.fi)
`,
    },
    fi: {
      title: "Larp.fi-kehitysinstanssi",
      ingress: `### Larp.fi-kehitysinstanssi

Varsinainen sivusto löytyy osoitteesta [larp.fi](https://larp.fi)
`,
    },
  },
  [seeAlsoSlug]: {
    en: {
      title: "See also",
      content: `- [What is larp, Nordic larp and Finnish larp? (Odysseus)](https://www.odysseuslarp.com/what-is-larp.html)
- [Photos from Finnish larps (Larppikuvat.fi)](https://larppikuvat.fi/)
- Larps from [Sweden (lajvhistoria.se)](https://lajvhistoria.se), [Norway (laiv.org)](https://laiv.org/laiv/DetStore.nsf/Dato) and [Denmark (alexandria.dk)](https://alexandria.dk/en/)
- Photos from larps in [Finland (Larppikuvat.fi)](https://larppikuvat.fi/), [Sweden (lajvhistoria.se)](https://galleri.lajvhistoria.se/) and [Norway (laivgalleriet.no)](https://www.laivgalleriet.no/piwigo/)
`,
    },
    fi: {
      title: "Katso myös",
      content: `- [Mitä larppaaminen on? (Larp.fi)](https://larp.fi/)
- Larppeja [Ruotsissa (lajvhistoria.se)](https://lajvhistoria.se), [Norjassa (laiv.org)](https://laiv.org/laiv/DetStore.nsf/Dato) ja [Tanskassa (alexandria.dk)](https://alexandria.dk/en/)
- Kuvia larpeista [Suomessa (Larppikuvat.fi)](https://larppikuvat.fi/), [Ruotsissa (lajvhistoria.se)](https://galleri.lajvhistoria.se/) ja [Norjassa (laivgalleriet.no)](https://www.laivgalleriet.no/piwigo/)
`,
    },
  },
  [contactPageSlug]: {
    en: {
      title: "Contact us",
      ingress:
        "You can contact the administrator via email at *larpit-fi ät tracon.fi*.\n",
      content: `The team behind Larp.fi is listed below.

Larp.fi is managed by Tracon ry (2886274-5). To contact Tracon ry, see the [home page of Tracon ry](https://ry.tracon.fi).
`,
    },
    fi: {
      title: "Ota yhteyttä",
      ingress:
        "Larp.fi:n ylläpitäjän tavoitat sähköpostiosoitteesta *larpit-fi ät tracon.fi*.\n",
      content: `Larp.fi:n tiimiin kuuluvat alla luetellut henkilöt.

Hallinnollisesti Larp.fi:stä vastaa Tracon ry (2886274-5). Tracon ry:n yhteystiedot löydät [yhdistyksen kotisivuilta](https://ry.tracon.fi).
`,
    },
  },
};

/**
 * The front page, the see also page and the contact page of each language are looked up by slug.
 * Missing pages are created with default content; existing pages are kept.
 */
export async function ensureDefaultPages(): Promise<void> {
  for (const [slug, pages] of Object.entries(defaultPages)) {
    for (const [language, page] of Object.entries(pages)) {
      await db.orm.public.Page.upsert({
        create: { slug, language, content: "", ...page },
        update: {},
      });
    }
  }
}

export interface InfoMenuPage {
  slug: string;
  title: string;
}

/** The pages in the info menu of the app bar, in menu order. */
export async function getInfoMenuPages(
  language: string,
  reader: typeof db = db,
): Promise<InfoMenuPage[]> {
  return reader.orm.public.Page.select("slug", "title")
    .where({ language })
    .where((p) => p.menuPosition.isNotNull())
    .orderBy([(p) => p.menuPosition.asc(), (p) => p.title.asc()])
    .all();
}

export type PageChangeResult =
  { ok: true } | { ok: false; error: PageSlugError };

function isPagePrimaryKeyViolation(error: unknown): boolean {
  const { sqlState, constraint } = (error ?? {}) as {
    sqlState?: unknown;
    constraint?: unknown;
  };
  return sqlState === "23505" && constraint === "page_pkey";
}

export async function createPage(
  page: z.infer<typeof NewPageForm>,
): Promise<PageChangeResult> {
  const error = validatePageSlug(page.slug);
  if (error) return { ok: false, error };
  try {
    await db.orm.public.Page.create({ ...page, ingress: "", content: "" });
  } catch (error) {
    if (isPagePrimaryKeyViolation(error)) return { ok: false, error: "taken" };
    throw error;
  }
  return { ok: true };
}

export async function renamePage(
  slug: string,
  language: string,
  newSlug: string,
): Promise<PageChangeResult> {
  if (protectedPageSlugs.includes(slug)) {
    return { ok: false, error: "protected" };
  }
  const error = validatePageSlug(newSlug);
  if (error) return { ok: false, error };
  try {
    await db.orm.public.Page.where({ slug, language }).update({
      slug: newSlug,
    });
  } catch (error) {
    if (isPagePrimaryKeyViolation(error)) return { ok: false, error: "taken" };
    throw error;
  }
  return { ok: true };
}

/** Deletes the page and its header image; returns false for the pages that cannot be deleted. */
export async function deletePage(
  slug: string,
  language: string,
): Promise<boolean> {
  if (protectedPageSlugs.includes(slug)) return false;
  const page = await db.orm.public.Page.select("headerImageId").first({
    slug,
    language,
  });
  if (!page) return true;
  await db.orm.public.Page.where({ slug, language }).delete();
  if (page.headerImageId) await deleteHeaderImage(page.headerImageId);
  return true;
}
