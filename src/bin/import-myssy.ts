import { EditAction, EditStatus } from "@/generated/prisma/client";
import {
  approveRequest,
  ModerationRequestContent,
} from "@/models/ModerationRequest";
import prisma from "@/prisma";
import { parse } from "csv/sync";
import { readFileSync } from "fs";
import { zip } from "underscore";

const filename = "data/myssy.csv";

// attribute the imports to this user
const userId = "4d706c72-4a87-4d8d-8e41-a01544293cb7";

const headerMapping = {
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

function parseDateFi(dateStr: string): string | null {
  if (!dateStr) {
    return null;
  }

  const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  console.warn("INVALID DATE:", dateStr);
  return null;
}

async function alreadyExists(larp: { name: string }): Promise<boolean> {
  const search = larp.name;
  const matchingLarpIds = await prisma.$queryRaw<{ id: string }[]>`
    select id from larp
    where to_tsvector('finnish', name) @@ phraseto_tsquery('finnish', ${search})
  `;
  return matchingLarpIds.length > 0;
}

async function loadMunicipalityMapping(): Promise<Record<string, string>> {
  const municipalities = await prisma.municipality.findMany();
  const mapping: Record<string, string> = {};
  for (const municipality of municipalities) {
    if (!municipality.nameFi) {
      continue;
    }
    mapping[municipality.nameFi.toLowerCase()] = municipality.id;
  }
  return mapping;
}

async function main() {
  const data = readFileSync(filename, "utf-8");
  const rows = parse(data);
  const header = rows.shift() as string[];
  const larps: ModerationRequestContent[] = [];
  const municipalityMapping = await loadMunicipalityMapping();
  for (const row of rows) {
    const mappedRow: Record<string, string> = {};
    for (const item of zip(header, row) as [string, string][]) {
      const key = reverseHeaderMapping[item[0]];
      if (!key) {
        continue;
      }

      const value = item[1].trim();
      mappedRow[key] = value;
    }

    const rawContent = {
      ...mappedRow,
      municipality:
        municipalityMapping[mappedRow.municipality?.toLowerCase() || ""] ||
        null,
      startsAt: parseDateFi(mappedRow.startsAt || ""),
      endsAt: parseDateFi(mappedRow.endsAt || ""),
      signupStartsAt: parseDateFi(mappedRow.signupStartsAt || ""),
      signupEndsAt: parseDateFi(mappedRow.signupEndsAt || ""),
    };
    const content = ModerationRequestContent.parse(rawContent);

    if (await alreadyExists(content)) {
      console.log("ALREADY EXISTS: " + content.name);
      continue;
    }

    larps.push(content);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new Error("User not found: " + userId);
  }

  for (const larp of larps) {
    console.log("Importing: " + larp.name);
    const status = EditStatus.APPROVED;
    const message = "Tuotu Myssyn larppitaulukosta";

    const request = await prisma.moderationRequest.create({
      data: {
        action: EditAction.CREATE,
        status,
        submitterId: user.id,
        submitterName: user.name || "",
        submitterEmail: user.email,
        message,
        newContent: larp,
      },
    });
    await approveRequest(request, user, message, status);
  }
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
