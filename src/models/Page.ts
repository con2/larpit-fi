import z from "zod";

import { db } from "@/prisma/db";

export const frontPageSlug = "front-page";

export const PageForm = z.object({
  slug: z.string().min(1).max(200),
  language: z.string().min(2).max(2),
  title: z.string().min(1),
  content: z.string().optional().default(""),
});

const defaultFrontPages = {
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
} as const;

/**
 * The front page renders a content page per language. A fresh database has none, so
 * placeholder pages are created for every language that lacks one; existing pages are kept.
 */
export async function ensureFrontPages(): Promise<void> {
  for (const [language, page] of Object.entries(defaultFrontPages)) {
    await db.orm.public.Page.upsert({
      create: { slug: frontPageSlug, language, ...page },
      update: {},
    });
  }
}
