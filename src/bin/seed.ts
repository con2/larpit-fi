import { PrismaClient } from "@/generated/prisma";
import { fileURLToPath } from "url";
import process from "process";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "root@larpit.fi" },
    update: {},
    create: {
      email: "root@larpit.fi",
      name: "Larpit.fi ylläpito",
    },
  });

  await prisma.larp.deleteMany({
    where: {
      createdById: user.id,
    },
  });

  const tprv = await prisma.larp.create({
    data: {
      alias: "tprv",
      name: "Tulenpunaisten ruusujen valtakunta",
      tagline:
        "Larppi sodan traumoista, uuden maailman mahdollisuuksista, romantiikasta sekä mahdottomista valinnoista",
      language: "fi",
      locationText: "Nokian urheilijoiden maja",
      startsAt: new Date("2025-08-09T08:00:00+03:00"),
      endsAt: new Date("2025-08-09T20:00:00+03:00"),
      createdById: user.id,
    },
  });

  await prisma.larpLink.createMany({
    data: [
      {
        larpId: tprv.id,
        href: "https://tulenpunaistenruusujenvaltakunta.wordpress.com/info/",
        type: "HOMEPAGE",
      },
      {
        larpId: tprv.id,
        href: "https://www.instagram.com/tulenpunaistenruusujenvaltakun/",
        title: "Instagram",
        type: "SOCIAL_MEDIA",
      },
    ],
  });

  await prisma.larp.create({
    data: {
      name: "Peto kulkee kanssamme 2: Noita, knihti ja naapuri",
      tagline: "Tää on nyt se kiva kyläpeli",
      language: "fi",
      locationText: "Vallitun leirikeskus, Kangasala",
      startsAt: new Date("2025-08-23T08:00:00+03:00"),
      endsAt: new Date("2025-08-23T20:00:00+03:00"),
      createdById: user.id,
    },
  });

  const lohr = await prisma.larp.create({
    data: {
      name: "Lohikäärmeratsastajat",
      tagline: "Tunteellinen rohkeudesta kertova fantasialarppi 10 pelaajalle",
      language: "fi",
      locationText: "Birgitan polku, Lempäälä",
      startsAt: new Date("2025-08-23T08:00:00+03:00"),
      endsAt: new Date("2025-08-23T20:00:00+03:00"),
      createdById: user.id,
    },
  });

  await prisma.larpLink.create({
    data: {
      larpId: lohr.id,
      href: "https://project.purplie.net/lohikaarmeratsastajat/",
      type: "HOMEPAGE",
    },
  });

  await prisma.larp.create({
    data: {
      name: "The Lesser Evil",
      tagline: "An immersive LARP event set in the Witcher world",
      language: "en",
      locationText: "Pärnumaa, Estonia",
      startsAt: new Date("2025-10-02T08:00:00+03:00"),
      endsAt: new Date("2025-10-05T20:00:00+03:00"),
      createdById: user.id,
    },
  });

  await prisma.larp.create({
    data: {
      name: "Deep Pocket",
      tagline:
        "Älä häiritse tulen, jään äläkä salamain rauhaa, jottei jumalten kesken nouse tuhoa tuova epäsopu. Silloin on maa muuttuva tuhkaksi.",
      language: "fi",
      locationText: "Nokian Tehdassaari",
      startsAt: new Date("2025-10-16T08:00:00+03:00"),
      endsAt: new Date("2025-10-17T20:00:00+03:00"),
      createdById: user.id,
    },
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
