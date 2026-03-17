import { LarpLinkType, LarpType, Openness } from "@/generated/prisma/client";
import { loadMunicipalityMapping, parseUnixTimestamp } from "@/helpers/import";
import { handleLarpLinks } from "@/models/LarpLink";
import {
  createLarpOrFillInMissingDetails,
  executeImportAction,
  ImportAction,
} from "@/models/Larp";
import { ModerationRequestContent } from "@/models/ModerationRequest";
import prisma from "@/prisma";

// attribute the imports to this user
const userId = "359e7a18-59eb-48a0-8d59-de045f8912b0";

const dryRun = process.argv.includes("--dry-run");

interface OldCalendarRow {
  id: number;
  eventname: string;
  eventtype: string;
  startdate: string;
  enddate: string;
  startsignuptime: string;
  endsignuptime: string;
  locationtextfield: string;
  storydescription: string;
  infodescription: string;
  link1: string | null;
  link2: string | null;
  invitationonly: boolean;
  languagefree: boolean;
  status: string;
}

function truncate(str: string | null | undefined, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) : str;
}

function mapRow(
  row: OldCalendarRow,
): { content: ModerationRequestContent; links: string[] } | null {
  if (row.status === "PENDING") {
    return null;
  }

  const type: LarpType =
    row.eventtype === "2" ? LarpType.ONE_SHOT : LarpType.OTHER_EVENT;

  const rawContent = {
    name: row.eventname,
    type,
    startsAt: parseUnixTimestamp(row.startdate),
    endsAt: parseUnixTimestamp(row.enddate),
    signupStartsAt: parseUnixTimestamp(row.startsignuptime),
    signupEndsAt: parseUnixTimestamp(row.endsignuptime),
    locationText: row.locationtextfield || "",
    fluffText: truncate(row.storydescription, 2000),
    description: truncate(row.infodescription, 2000),
    openness: row.invitationonly ? Openness.INVITE_ONLY : Openness.OPEN,
    language: row.languagefree ? "OTHER" : "fi",
  };

  const content = ModerationRequestContent.parse(rawContent);

  const links = [row.link1, row.link2].filter(
    (link): link is string => !!link && link.trim() !== "",
  );

  return { content, links };
}

function printDryRunTable(
  actions: Array<{ action: ImportAction; links: string[] }>,
): void {
  const col1 = 8;
  const col2 = 40;

  console.log("ACTION".padEnd(col1) + "NAME".padEnd(col2) + "DETAILS");

  let creates = 0;
  let updates = 0;
  let skips = 0;

  for (const { action } of actions) {
    let actionStr: string;
    let nameStr: string;
    let details: string;

    if (action.kind === "create") {
      actionStr = "CREATE";
      nameStr = action.content.name;
      details = action.content.startsAt
        ? `starts ${action.content.startsAt}`
        : "";
      creates++;
    } else if (action.kind === "update") {
      actionStr = "UPDATE";
      nameStr = action.name;
      details = `fill: ${Object.keys(action.fields).join(", ")}`;
      updates++;
    } else {
      actionStr = "SKIP";
      nameStr = action.name;
      details =
        action.reason === "ambiguous_match"
          ? `ambiguous match (${action.candidates} candidates)`
          : "already complete";
      skips++;
    }

    console.log(
      actionStr.padEnd(col1) +
        nameStr.slice(0, col2 - 1).padEnd(col2) +
        details,
    );
  }

  console.log("---");
  console.log(`${creates} CREATE, ${updates} UPDATE, ${skips} SKIP`);
}

async function main() {
  const municipalityMapping = await loadMunicipalityMapping();

  const rows = await prisma.$queryRaw<OldCalendarRow[]>`
    select
      id,
      eventname,
      eventtype,
      startdate,
      enddate,
      startsignuptime,
      endsignuptime,
      locationtextfield,
      storydescription,
      infodescription,
      link1,
      link2,
      invitationonly,
      languagefree,
      status
    from
      vanhalarpkalenteri.events2
    where
      status in ('ACTIVE', 'MODIFIED')
  `;

  console.log(`Found ${rows.length} rows in vanhalarpkalenteri.events2`);

  void municipalityMapping; // municipality lookup not available in old calendar

  const results: Array<{ action: ImportAction; links: string[] }> = [];

  for (const row of rows) {
    const mapped = mapRow(row);
    if (!mapped) continue;

    const action = await createLarpOrFillInMissingDetails(mapped.content);
    results.push({ action, links: mapped.links });
  }

  if (dryRun) {
    printDryRunTable(results);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found: " + userId);
  }

  const message = "Tuotu vanhasta larpkalenterista";

  for (const { action, links } of results) {
    if (action.kind === "skip") {
      console.log(
        `SKIP ${action.name} (${action.reason === "ambiguous_match" ? `ambiguous match: ${action.candidates}` : "already complete"})`,
      );
      continue;
    }

    if (action.kind === "create") {
      console.log(`CREATE ${action.content.name}`);
    } else {
      console.log(
        `UPDATE ${action.name} (fill: ${Object.keys(action.fields).join(", ")})`,
      );
    }

    const larpId = await executeImportAction(action, user, message);

    // create LarpLink records after the larp is created
    if (action.kind === "create" && links.length > 0 && larpId) {
      await handleLarpLinks(
        larpId,
        links.map((href) => ({ type: LarpLinkType.HOMEPAGE, href })),
        [],
      );
    }
  }
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
