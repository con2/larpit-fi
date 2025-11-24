import {
  LarpType,
  RelatedLarp,
  RelatedLarpType,
} from "@/generated/prisma/client";
import prisma from "@/prisma";

async function campaignify(
  campaignName: string,
  campaignAlias: string,
  aliasPrefix: string,
  type: LarpType &
    ("CAMPAIGN" | "MULTIPLE_RUNS" | "OTHER_EVENT_SERIES") = LarpType.CAMPAIGN
) {
  const larps = await prisma.larp.findMany({
    where: {
      alias: {
        startsWith: aliasPrefix,
      },
    },
    select: {
      id: true,
      alias: true,
      name: true,
      tagline: true,
      language: true,
      fluffText: true,
      description: true,
    },
  });
  const campaign = await prisma.larp.upsert({
    where: {
      alias: campaignAlias,
    },
    create: {
      name: campaignName,
      alias: campaignAlias,
      tagline: larps[0].tagline,
      language: larps[0].language,
      fluffText: larps[0].fluffText,
      description: larps[0].description,
      type,
    },
    update: {
      type,
    },
    select: {
      id: true,
    },
  });

  let relatedLarpType: RelatedLarpType;
  switch (type) {
    case LarpType.CAMPAIGN:
      relatedLarpType = RelatedLarpType.IN_CAMPAIGN;
      break;
    case LarpType.MULTIPLE_RUNS:
      relatedLarpType = RelatedLarpType.RUN_OF;
      break;
    case LarpType.OTHER_EVENT_SERIES:
      relatedLarpType = RelatedLarpType.IN_SERIES;
      break;
    default:
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported type: ${exhaustiveCheck}`);
  }

  const relatedLarps: Pick<RelatedLarp, "leftId" | "rightId" | "type">[] = [];
  for (const larp of larps) {
    relatedLarps.push(
      await prisma.relatedLarp.upsert({
        where: {
          leftId_rightId: {
            leftId: larp.id,
            rightId: campaign.id,
          },
        },
        create: {
          leftId: larp.id,
          rightId: campaign.id,
          type: relatedLarpType,
        },
        update: {
          type: relatedLarpType,
        },
        select: {
          leftId: true,
          rightId: true,
          type: true,
        },
      })
    );
  }

  let childLarpType: LarpType;
  switch (type) {
    case LarpType.CAMPAIGN:
      childLarpType = LarpType.CAMPAIGN_LARP;
      break;
    case LarpType.MULTIPLE_RUNS:
      childLarpType = LarpType.ONE_SHOT;
      break;
    case LarpType.OTHER_EVENT_SERIES:
      childLarpType = LarpType.OTHER_EVENT;
      break;
    default:
      const exhaustiveCheck: never = type;
      throw new Error(`Unsupported type: ${exhaustiveCheck}`);
  }

  await prisma.larp.updateMany({
    where: {
      id: {
        in: larps.map((larp) => larp.id),
      },
    },
    data: {
      type: childLarpType,
    },
  });

  return { campaign, larps, relatedLarps };
}

async function main() {
  const results = await Promise.all([
    // campaignify("Odysseus", "odysseus", "odysseus-", LarpType.MULTIPLE_RUNS),
    campaignify(
      "Rakas viholliseni",
      "rakas-viholliseni",
      "rakas-viholliseni-pelautus",
      LarpType.MULTIPLE_RUNS
    ),
  ]);
  console.log(JSON.stringify(results, null, 2));
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
