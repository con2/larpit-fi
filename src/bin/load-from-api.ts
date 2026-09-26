import pLimit from "p-limit";
import z from "zod";

import { db } from "@/prisma/db";
import {
  Language,
  LarpLinkType,
  LarpType,
  Openness,
  RelatedLarpType,
} from "@/prisma/enums";
import { pool } from "@/prisma/pool";

/**
 * Mirrors the public larp data of a larpit.fi instance into this database, for development
 * against realistic content. Larps keep their ids, so local URLs match the source instance.
 * Users, roles and moderation history are not public and are not loaded. Municipalities are
 * matched by their Finnish name against the local municipality table, so import them first if
 * you want locations resolved.
 *
 *   npm run db:load                              # from https://larpit.fi
 *   npm run db:load -- --api http://localhost:3158
 */

const apiBase = (() => {
  const index = process.argv.indexOf("--api");
  return (index === -1 ? "https://larpit.fi" : process.argv[index + 1]).replace(
    /\/$/,
    "",
  );
})();
const pageSize = 200;
const detailConcurrency = 6;
const userAgent = "larpit-fi load-from-api (https://github.com/con2/larpit-fi)";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable();

const ApiLink = z.object({
  href: z.string(),
  type: z.enum(LarpLinkType),
  title: z.string().nullable(),
});

const ApiRelatedLarp = z.object({
  leftId: z.string().uuid(),
  rightId: z.string().uuid(),
  type: z.enum(RelatedLarpType),
});

const ApiLarpSummary = z.object({
  id: z.string().uuid(),
  alias: z.string().nullable(),
  name: z.string(),
  type: z.enum(LarpType),
  language: z.enum(Language),
  tagline: z.string().nullable(),
  openness: z.enum(Openness).nullable(),
  startsAt: isoDate,
  endsAt: isoDate,
  signupStartsAt: isoDate,
  signupEndsAt: isoDate,
  locationText: z.string().nullable(),
  municipality: z.string().nullable(),
  numPlayerCharacters: z.number().int().nullable(),
  numTotalParticipants: z.number().int().nullable(),
  links: z.array(ApiLink),
  relatedLarps: z.array(ApiRelatedLarp),
});

const ApiLarpDetail = z.object({
  fluffText: z.string().nullable(),
  description: z.string().nullable(),
  isCancelled: z.boolean(),
});

const ApiLarpPage = z.object({
  items: z.array(ApiLarpSummary),
  nextCursor: z.string().nullable(),
});

type ApiLarpSummary = z.infer<typeof ApiLarpSummary>;

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { "User-Agent": userAgent, Accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`${path} responded with HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchAllLarps(): Promise<ApiLarpSummary[]> {
  const larps: ApiLarpSummary[] = [];
  let cursor: string | null = null;
  do {
    const query = new URLSearchParams({
      include: "links,relatedLarps",
      limit: String(pageSize),
    });
    if (cursor) query.set("after", cursor);
    const page = ApiLarpPage.parse(await fetchJson(`/api/larp?${query}`));
    larps.push(...page.items);
    cursor = page.nextCursor;
    console.log(`fetched ${larps.length} larps`);
  } while (cursor);
  return larps;
}

async function municipalityIdsByName(): Promise<Map<string, string>> {
  const municipalities = await db.orm.public.Municipality.select(
    "id",
    "nameFi",
  ).all();
  return new Map(
    municipalities
      .filter((m) => m.nameFi)
      .map((m) => [m.nameFi!.toLowerCase(), m.id]),
  );
}

async function loadLarp(
  summary: ApiLarpSummary,
  municipalities: Map<string, string>,
) {
  const detail = ApiLarpDetail.parse(await fetchJson(`/api/larp/${summary.id}`));
  const existing = await db.orm.public.Larp.select("cancelledAt").first({
    id: summary.id,
  });
  const fields = {
    alias: summary.alias,
    name: summary.name,
    type: summary.type,
    language: summary.language,
    tagline: summary.tagline,
    openness: summary.openness,
    startsAt: summary.startsAt,
    endsAt: summary.endsAt,
    signupStartsAt: summary.signupStartsAt,
    signupEndsAt: summary.signupEndsAt,
    locationText: summary.locationText,
    municipalityId: summary.municipality
      ? (municipalities.get(summary.municipality.toLowerCase()) ?? null)
      : null,
    numPlayerCharacters: summary.numPlayerCharacters,
    numTotalParticipants: summary.numTotalParticipants,
    fluffText: detail.fluffText,
    description: detail.description,
    // The API tells only whether the larp is cancelled, not when.
    cancelledAt: detail.isCancelled
      ? (existing?.cancelledAt ?? new Date().toISOString())
      : null,
  };
  await db.transaction(async (tx) => {
    await tx.orm.public.Larp.upsert({
      create: { id: summary.id, ...fields },
      update: fields,
    });
    await tx.orm.public.LarpLink.where({ larpId: summary.id }).deleteAndCount();
    if (summary.links.length > 0) {
      await tx.orm.public.LarpLink.createAndCount(
        summary.links.map((link) => ({ larpId: summary.id, ...link })),
      );
    }
  });
}

async function loadRelatedLarps(larps: ApiLarpSummary[]): Promise<number> {
  const loaded = new Set(larps.map((larp) => larp.id));
  const relations = new Map<string, z.infer<typeof ApiRelatedLarp>>();
  for (const larp of larps) {
    for (const relation of larp.relatedLarps) {
      if (loaded.has(relation.leftId) && loaded.has(relation.rightId)) {
        relations.set(`${relation.leftId}:${relation.rightId}`, relation);
      }
    }
  }
  for (const relation of relations.values()) {
    await db.orm.public.RelatedLarp.upsert({
      create: relation,
      update: { type: relation.type },
    });
  }
  return relations.size;
}

async function main() {
  const larps = await fetchAllLarps();
  const municipalities = await municipalityIdsByName();
  const limit = pLimit(detailConcurrency);
  let loaded = 0;
  await Promise.all(
    larps.map((larp) =>
      limit(async () => {
        await loadLarp(larp, municipalities);
        loaded++;
        if (loaded % 100 === 0) console.log(`loaded ${loaded}/${larps.length}`);
      }),
    ),
  );
  const relations = await loadRelatedLarps(larps);
  console.log(
    `loaded ${loaded} larps and ${relations} relations from ${apiBase}`,
  );
}

try {
  await main();
} finally {
  await db.close();
  await pool.end();
}
