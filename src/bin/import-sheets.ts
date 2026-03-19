import { loadMunicipalityMapping, parseDateFi } from "@/helpers/import";
import {
  createLarpOrFillInMissingDetails,
  executeImportAction,
  ImportAction,
} from "@/models/Larp";
import { ModerationRequestContent } from "@/models/ModerationRequest";
import prisma from "@/prisma";
import { parse } from "csv/sync";
import { readFileSync } from "fs";
import { zip } from "underscore";

// attribute the imports to this user
const userId = "5e3b54cf-fff2-4994-9f3a-867d022a509d";

const dryRun = process.argv.includes("--dry-run");
const filename = process.argv.find(
  (arg) => !arg.startsWith("-") && arg.endsWith(".csv"),
);

export const headerMapping = {
  name: "Name of the larp",
  tagline: "Tagline of the larp",
  type: "What kind of larp this is",
  language: "What is the primary language of the larp?",
  numPlayerCharacters: "How many player characters are there in this larp?",
  numTotalParticipants: "How many total participants are there in this larp?",
  startsAt: "Starting date",
  endsAt: "Ending date",
  locationText: "At which venue is the larp played?",
  municipality: "Which municipality is the venue located in?",
  openness: "Who can sign up for this larp?",
  signupStartsAt: "When does the signup start?",
  signupEndsAt: "When does the signup end?",
  fluffText: "Optional fluff text about the larp",
  description: "Optional off-game description of the larp",
};

const reverseHeaderMapping: Record<string, string> = {};
for (const [key, value] of Object.entries(headerMapping)) {
  reverseHeaderMapping[value] = key;
}

function printDryRunTable(actions: ImportAction[]): void {
  const col1 = 8;
  const col2 = 40;

  console.log("ACTION".padEnd(col1) + "NAME".padEnd(col2) + "DETAILS");

  let creates = 0;
  let updates = 0;
  let skips = 0;

  for (const action of actions) {
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
  if (!filename) {
    console.error("Usage: import-sheets.ts [--dry-run] <file.csv>");
    process.exit(1);
  }

  const municipalityMapping = await loadMunicipalityMapping();

  const data = readFileSync(filename, "utf-8");
  const rows = parse(data);
  const header = rows.shift() as string[];

  const actions: ImportAction[] = [];

  for (const row of rows) {
    const mappedRow: Record<string, string> = {};
    for (const item of zip(header, row) as [string, string][]) {
      const key = reverseHeaderMapping[item[0]];
      if (!key) continue;
      mappedRow[key] = item[1].trim();
    }

    const validLanguages = ["fi", "en", "sv", "OTHER"];
    const rawContent = {
      ...mappedRow,
      language: validLanguages.includes(mappedRow.language) ? mappedRow.language : "fi",
      municipality:
        municipalityMapping[mappedRow.municipality?.toLowerCase() || ""] ||
        null,
      startsAt: parseDateFi(mappedRow.startsAt || ""),
      endsAt: parseDateFi(mappedRow.endsAt || ""),
      signupStartsAt: parseDateFi(mappedRow.signupStartsAt || ""),
      signupEndsAt: parseDateFi(mappedRow.signupEndsAt || ""),
    };

    const content = ModerationRequestContent.parse(rawContent);
    const action = await createLarpOrFillInMissingDetails(content);
    actions.push(action);
  }

  if (dryRun) {
    printDryRunTable(actions);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found: " + userId);
  }

  const message = "Tuotu Google Sheets -larppitaulukosta";

  for (const action of actions) {
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

    await executeImportAction(action, user, message);
  }
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
