import z from "zod";

import { db } from "@/prisma/db";

export const frontPageSlug = "front-page";
export const seeAlsoSlug = "see-also";

export const PageForm = z.object({
  slug: z.string().min(1).max(200),
  language: z.string().min(2).max(2),
  title: z.string().min(1),
  content: z.string().optional().default(""),
});

const defaultPages: Record<
  string,
  Record<string, { title: string; content: string }>
> = {
  [frontPageSlug]: {
    en: {
      title: "Larpit.fi development instance",
      content: `### Larpit.fi development instance

The actual site can be found at [larpit.fi](https://larpit.fi)
`,
    },
    fi: {
      title: "Larpit.fi-kehitysinstanssi",
      content: `### Larpit.fi-kehitysinstanssi

Varsinainen sivusto löytyy osoitteesta [larpit.fi](https://larpit.fi)
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
};

/**
 * The front page renders the front page and the see also page of each language, and content
 * pages cannot be created from the UI. Missing pages are created with default content; existing
 * pages are kept.
 */
export async function ensureDefaultPages(): Promise<void> {
  for (const [slug, pages] of Object.entries(defaultPages)) {
    for (const [language, page] of Object.entries(pages)) {
      await db.orm.public.Page.upsert({
        create: { slug, language, ...page },
        update: {},
      });
    }
  }
}
