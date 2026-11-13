import { readFileSync } from "fs";
import z from "zod";

import {
  executeImportAction,
  getFieldsToFill,
  type ImportAction,
} from "@/models/Larp";
import { LarpLinkUpsertable } from "@/models/LarpLink";
import {
  larpToContent,
  ModerationRequestContent,
} from "@/models/ModerationRequest";
import { parseDates } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { LarpLinkType } from "@/prisma/enums";
import { pool } from "@/prisma/pool";

/**
 * Imports larps scraped from Wayback Machine captures of the old larp.fi calendar
 * (www.larp.fi/kalenteri.html, 2003–2014). The input is a reviewed plan whose items either
 * create a larp or fill in the empty fields of an existing one. Every item carries a SOURCE
 * link to its archived calendar entry; an item whose SOURCE link already exists is skipped,
 * so the import can be re-run.
 *
 *   npx tsx src/bin/import-wayback-calendar.ts --dry-run import.json
 *   npx tsx src/bin/import-wayback-calendar.ts --user <user id> import.json
 */

const ImportItem = z.object({
  key: z.string(),
  action: z.enum(["create", "fill"]),
  larpId: z.string().uuid().optional(),
  content: ModerationRequestContent,
  links: z.array(LarpLinkUpsertable),
});

const ImportFile = z.object({ items: z.array(ImportItem) });

type ImportItem = z.infer<typeof ImportItem>;

type Planned =
  | { item: ImportItem; action: ImportAction; addLinks: LarpLinkUpsertable[] }
  | { item: ImportItem; skip: string };

const dryRun = process.argv.includes("--dry-run");
const userId = (() => {
  const index = process.argv.indexOf("--user");
  return index === -1 ? null : process.argv[index + 1];
})();
const filename = process.argv.find((arg) => arg.endsWith(".json"));

const message = "Tuotu vanhasta larp.fi-kalenterista (Wayback Machine)";

function sourceHref(item: ImportItem): string {
  const source = item.links.find((link) => link.type === LarpLinkType.SOURCE);
  if (!source) throw new Error(`${item.key} has no SOURCE link`);
  return source.href;
}

function normalizeHref(href: string): string {
  return href.trim().replace(/\/+$/, "").toLowerCase();
}

async function alreadyImportedSources(items: ImportItem[]): Promise<Set<string>> {
  const links = await db.orm.public.LarpLink.where((l) =>
    l.href.in(items.map(sourceHref)),
  )
    .select("href")
    .all();
  return new Set(links.map((link) => link.href));
}

async function plan(item: ImportItem): Promise<Planned> {
  if (item.action === "create") {
    return {
      item,
      action: { kind: "create", content: item.content },
      addLinks: item.links,
    };
  }

  if (!item.larpId) throw new Error(`${item.key}: fill without larpId`);
  const larp = await db.orm.public.Larp.include("links").first({
    id: item.larpId,
  });
  if (!larp) return { item, skip: `larp ${item.larpId} not found` };

  const fields = getFieldsToFill(larpToContent(parseDates(larp)), item.content);
  const existingHrefs = new Set(larp.links.map((l) => normalizeHref(l.href)));
  const hasHomepage = larp.links.some((l) => l.type === LarpLinkType.HOMEPAGE);
  const addLinks = item.links.filter(
    (link) =>
      !existingHrefs.has(normalizeHref(link.href)) &&
      !(link.type === LarpLinkType.HOMEPAGE && hasHomepage),
  );
  return {
    item,
    action: { kind: "update", larpId: larp.id, name: larp.name, fields },
    addLinks,
  };
}

function describe(planned: Planned): string {
  const name = planned.item.content.name.slice(0, 44).padEnd(45);
  if ("skip" in planned) return `SKIP    ${name}${planned.skip}`;
  const links = planned.addLinks.map((link) => link.type).join(", ");
  if (planned.action.kind === "create") {
    return `CREATE  ${name}${planned.item.content.startsAt} links: ${links}`;
  }
  if (planned.action.kind === "update") {
    const existingName = planned.action.name.slice(0, 44).padEnd(45);
    const fields = Object.keys(planned.action.fields).join(", ") || "-";
    return `FILL    ${existingName}fill: ${fields}; links: ${links || "-"}`;
  }
  return `SKIP    ${name}`;
}

async function main() {
  if (!filename || (!dryRun && !userId)) {
    console.error(
      "Usage: import-wayback-calendar.ts (--dry-run | --user <user id>) <import.json>",
    );
    process.exit(1);
  }

  const { items } = ImportFile.parse(
    JSON.parse(readFileSync(filename, "utf-8")),
  );
  const imported = await alreadyImportedSources(items);

  const planned: Planned[] = [];
  for (const item of items) {
    planned.push(
      imported.has(sourceHref(item))
        ? { item, skip: "already imported" }
        : await plan(item),
    );
  }

  for (const p of planned) console.log(describe(p));
  const count = (kind: string) =>
    planned.filter((p) => !("skip" in p) && p.action.kind === kind).length;
  console.log(
    `--- ${count("create")} CREATE, ${count("update")} FILL, ${planned.filter((p) => "skip" in p).length} SKIP`,
  );
  if (dryRun) return;

  const user = await db.orm.public.User.first({ id: userId! });
  if (!user) throw new Error(`User not found: ${userId}`);

  for (const p of planned) {
    if ("skip" in p) continue;
    await executeImportAction(p.action, user, message, p.addLinks);
  }
  console.log("done");
}

try {
  await main();
} finally {
  await db.close();
  await pool.end();
}
