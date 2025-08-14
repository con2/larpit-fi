import {
  LarpLinkType,
  LarpType,
  PrismaClient,
  RelatedLarpType,
  RelatedUserRole,
} from "@/generated/prisma";
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

  const createdByRoot = await prisma.relatedUser.findMany({
    where: {
      userId: user.id,
    },
  });

  await prisma.larp.deleteMany({
    where: {
      id: {
        in: createdByRoot.map((r) => r.larpId),
      },
    },
  });

  const tprv = await prisma.larp.create({
    data: {
      alias: "tulenpunaisten-ruusujen-valtakunta",
      name: "Tulenpunaisten ruusujen valtakunta",
      tagline:
        "Larppi sodan traumoista, uuden maailman mahdollisuuksista, romantiikasta sekä mahdottomista valinnoista",
      language: "fi",
      locationText: "Nokian urheilijoiden maja",
      startsAt: new Date("2025-08-09T08:00:00+03:00"),
      endsAt: new Date("2025-08-09T20:00:00+03:00"),
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

  const aji1 = await prisma.larp.create({
    data: {
      name: "Ajan jälkeen ikuisuus (kutsupelautus)",
      tagline:
        "Scifi-larppi maailmanlopusta ja ihmiskunnan tuhosta 13 pelaajalle",
      language: "fi",
      locationText: "Vahderpään leirikeskus, Kangasala",
      startsAt: new Date("2024-04-03T08:00:00+02:00"),
      endsAt: new Date("2024-04-03T20:00:00+02:00"),
    },
  });

  const aji2 = await prisma.larp.create({
    data: {
      name: "Ajan jälkeen ikuisuus (julkinen pelautus)",
      tagline:
        "Scifi-larppi maailmanlopusta ja ihmiskunnan tuhosta 13 pelaajalle",
      language: "fi",
      locationText: "Irjalan makasiini, Tampere",
      startsAt: new Date("2025-12-13T08:00:00+02:00"),
      endsAt: new Date("2025-12-13T20:00:00+02:00"),
      signupStartsAt: new Date("2025-08-18T20:00:00+03:00"),
      signupEndsAt: new Date("2025-08-31T23:59:59+03:00"),
    },
  });

  await prisma.relatedLarp.create({
    data: {
      leftId: aji2.id,
      rightId: aji1.id,
      type: RelatedLarpType.RERUN_OF,
    },
  });

  await prisma.larpLink.create({
    data: {
      larpId: aji2.id,
      type: LarpLinkType.PLAYER_GUIDE,
      href: "https://docs.google.com/document/d/1yaWSRJ-iObqHjm8qLW1rCHR98Io2pDSVkblr9IVcW6k/edit",
    },
  });

  const peto2 = await prisma.larp.create({
    data: {
      name: "Peto kulkee kanssamme 2: Noita, knihti ja naapuri",
      tagline: "Tää on nyt se kiva kyläpeli",
      language: "fi",
      locationText: "Vallitun leirikeskus, Kangasala",
      startsAt: new Date("2025-08-23T08:00:00+03:00"),
      endsAt: new Date("2025-08-23T20:00:00+03:00"),
    },
  });

  const lohrReplayable = await prisma.larp.create({
    data: {
      name: "Lohikäärmeratsastajat",
      alias: "lohikaarmeratsastajat",
      tagline: "Tunteellinen rohkeudesta kertova fantasialarppi 10 pelaajalle",
      language: "fi",
      type: LarpType.MULTIPLE_RUNS,
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
    },
  });

  await prisma.relatedLarp.create({
    data: {
      leftId: lohr.id,
      rightId: lohrReplayable.id,
      type: RelatedLarpType.RUN_OF,
    },
  });

  await prisma.larpLink.create({
    data: {
      larpId: lohr.id,
      href: "https://project.purplie.net/lohikaarmeratsastajat/",
      type: "HOMEPAGE",
    },
  });

  const tle = await prisma.larp.create({
    data: {
      name: "The Lesser Evil",
      tagline: "An immersive LARP event set in the Witcher world",
      language: "en",
      locationText: "Pärnumaa, Estonia",
      startsAt: new Date("2025-10-02T08:00:00+03:00"),
      endsAt: new Date("2025-10-05T20:00:00+03:00"),
    },
  });

  const dp = await prisma.larp.create({
    data: {
      name: "Deep Pocket",
      tagline:
        "Älä häiritse tulen, jään äläkä salamain rauhaa, jottei jumalten kesken nouse tuhoa tuova epäsopu. Silloin on maa muuttuva tuhkaksi.",
      language: "fi",
      locationText: "Nokian Tehdassaari",
      startsAt: new Date("2025-10-16T08:00:00+03:00"),
      endsAt: new Date("2025-10-17T20:00:00+03:00"),
    },
  });

  const rv = await prisma.larp.create({
    data: {
      name: "Rakas viholliseni",
      alias: "rakas-viholliseni",
      type: LarpType.MULTIPLE_RUNS,
      language: "fi",
      tagline: "Mitä tehdä, kun sekä vihaa että rakastaa?",
      fluffText: `Ihmisistä polveutunut avaruuskulkijoiden laji asuu Ebos-planeetalla omissa oloissaan. He ovat jakautuneet kahteen kansaan: valana ja sepona. Satoja vuosia jatkunut kylmä sota kansojen välillä kärjistyi 10 vuotta sitten, jolloin alkoi väkivaltainen ja kaoottinen sisällissota. Pari päivää sitten Seponan sotatukikohdassa tapahtui valanojen hyökkäyksen yhteydessä onnettomuus, joka laukaisi tuhovoimaisen ohjuksen, joka osui väärään paikkaan ja tuloksena oli massiivinen planeetan laajuinen tuho, josta vain harvat selviytyivät.

Kuollessaan avaruuskulkija ei jätä jälkeensä ruumista vaan pienen mustan aukon, ja nyt nämä kasvavat mustat aukot uhkaavat tehdä planeetasta lopullisesti asuinkelvottoman. Jäljelle jääneet avaruuskulkijat ovat heränneet sodan järjettömyyteen ja ovat nyt kokoontumassa yhteen keskustellakseen siitä, miten tästä selvitään. Lajin jatkuminen vaatisi kuitenkin jonkinlaisen sovinnon saavuttamista verivihollisten kanssa. Niiden kanssa, jotka ovat tappaneet rakkaitasi ja vieneet sinulta kaiken. Oletko kuitenkaan itsekään syytön?`,
      description: `Rakas viholliseni on koko päivän larppi 13 pelaajalle. Peli on K18, eikä se sovellu voimakkaiden negakontaktien vuoksi ensikertalaisille, vaan pelaajilta vaaditaan osaamista sopia rajoista ja pelata muut huomioiden.

Rakas viholliseni sijoittuu yli miljardi vuotta tulevaisuuteen, fantasiamaailmaan, jossa on sekä kehittynyttä teknologiaa että taikuutta. Kaikki pelin hahmot osaavat taikoa. Avaruuskulkijoiden kulttuuri ei tunne lainkaan romanttisen rakkauden käsitettä, eikä perinteisiä romanttisia suhteita ole pelissä. Sen sijaan keskitytään mehustelemaan oikein kunnolla eeppisillä ystävyyksillä, vihollissuhteilla ja monimutkaisilla ja kieroilla suhteilla.

Rakas viholliseni -larppi on nyt tarjolla muiden uudelleenpelautettavaksi! Pelin materiaalipaketti sisältää kaiken tarvittavan: ohjeet järjestämiseen, hahmoprofiilit, metatiedot hahmojaon avuksi, tiedotustekstit, briiffit, mainoskuvat jne. Lue lisää uudelleenpelauttamisesta pelin kotisivuilta [Pelauta-alasivulta](https://larp.purplie.net/rakasviholliseni/pelauta).`,
    },
  });

  const rvSuper = await prisma.larp.create({
    data: {
      name: "Rakas viholliseni (superpelautus)",
      tagline: "Mitä tehdä, kun sekä vihaa että rakastaa?",
      type: LarpType.OTHER_EVENT,
      language: "fi",
      locationText: "Ahtelan leirikeskus, Sauvo",
      startsAt: new Date("2023-10-13T20:00:00+02:00"),
      endsAt: new Date("2023-10-15T14:00:00+02:00"),
    },
  });

  const rvSuperRuns = await prisma.larp.createManyAndReturn({
    data: [2, 3, 4, 5].map((i) => ({
      name: `Rakas viholliseni (pelautus ${i})`,
      tagline: rvSuper.tagline,
      language: "fi",
      locationText: rvSuper.locationText,
      startsAt: new Date("2023-10-14T10:00:00+02:00"),
      endsAt: new Date("2023-10-14T20:00:00+02:00"),
    })),
    select: {
      id: true,
    },
  });

  await prisma.larpLink.createMany({
    data: [rv, rvSuper, ...rvSuperRuns].map((run) => ({
      larpId: run.id,
      type: LarpLinkType.HOMEPAGE,
      href: "https://larp.purplie.net/rakasviholliseni/",
    })),
  });

  await prisma.relatedLarp.createMany({
    data: rvSuperRuns.map((run) => ({
      leftId: run.id,
      rightId: rvSuper.id,
      type: RelatedLarpType.PLAYED_AT,
    })),
  });

  await prisma.relatedLarp.createMany({
    data: rvSuperRuns.map((run) => ({
      leftId: run.id,
      rightId: rv.id,
      type: RelatedLarpType.RUN_OF,
    })),
  });

  await prisma.relatedUser.createMany({
    data: [
      tprv,
      aji1,
      aji2,
      tle,
      dp,
      peto2,
      lohr,
      lohrReplayable,
      rv,
      rvSuper,
      ...rvSuperRuns,
    ].map((larp) => ({
      userId: user.id,
      larpId: larp.id,
      role: RelatedUserRole.CREATED_BY,
    })),
  });

  console.log("✔ Database seeded.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  prisma.$transaction(main);
}
