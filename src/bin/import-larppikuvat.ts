import {
  Language,
  LarpLinkType,
  RelatedUserRole,
  User,
  UserRole,
} from "@/generated/prisma";
import {
  fromEveningNull,
  fromMorningNull,
  toPlainDateNull,
  zPlainDateNull,
} from "@/helpers/temporal";
import prisma from "@/prisma";
import { JSDOM } from "jsdom";
import pLimit from "p-limit";
import z from "zod";

const larppikuvatUrl = `https://larppikuvat.fi`;
const apiUrl = `https://larppikuvat.fi/api/v3`;

const Subalbum = z.object({
  path: z.string(),
  title: z.string(),
  date: zPlainDateNull,
});
type Subalbum = z.infer<typeof Subalbum>;

const Album = Subalbum.extend({
  subalbums: z.array(Subalbum).optional().default([]),
  body: z.string().optional().default(""),
});

const LarpAlbum = Subalbum.extend({
  slug: z.string(),
  body: z.string().optional().default(""),
});

const zLarpLinkType = z.enum<typeof LarpLinkType>(LarpLinkType);

const LarpLink = z.object({
  type: zLarpLinkType,
  href: z.string(),
});

type LarpLink = z.infer<typeof LarpLink>;

const limit = pLimit(6);

const dateParsers: ((body: string) => {
  startsAt: Date | null;
  endsAt: Date | null;
})[] = [
  function dateRangeMonthDayDontMatch(body) {
    const match = body.match(
      /(\d{1,2})\.(\d{1,2})\.?\s*[-–—]\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/u
    );
    if (!match) return { startsAt: null, endsAt: null };
    const startDay = match[1];
    const startMonth = match[2];
    const endDay = match[3];
    const endMonth = match[4];
    const year = match[5];
    const startsAt = new Date(`${year}-${startMonth}-${startDay}`);
    const endsAt = new Date(`${year}-${endMonth}-${endDay}`);
    return { startsAt, endsAt };
  },
  function dateRangeMonthMatch(body) {
    const match = body.match(
      /(\d{1,2})\.?\s*[-–—]\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/u
    );
    if (!match) return { startsAt: null, endsAt: null };
    const year = match[4];
    const month = match[3];
    const endDay = match[2];
    const startDay = match[1];
    const startsAt = new Date(`${year}-${month}-${startDay}`);
    const endsAt = new Date(`${year}-${month}-${endDay}`);
    return { startsAt, endsAt };
  },
  function singleDate(body) {
    const match = body.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!match) return { startsAt: null, endsAt: null };
    const date = new Date(`${match[3]}-${match[2]}-${match[1]}`);
    return { startsAt: date, endsAt: date };
  },
];

const commonTypos = {
  pelaututs: "pelautus",
  " - ": " – ",
};

function fixCommonTypos(s: string) {
  for (const [key, value] of Object.entries(commonTypos)) {
    s = s.replace(new RegExp(key, "g"), value);
  }
  return s;
}

const locationKeywords = {
  antaver: "Antaverkan leirikeskus, Ylöjärvi",
  vahojär: "Vahojärven leirikeskus, Parkano",
  tippsun: "Tippsundin leirikeskus, Taivassalo",
  vallitu: "Vallitun leirikeskus, Kangasala",
  kortejär: "Kortejärven tila, Tampere",
  kintulam: "Kintulammin maja, Tampere",
  bengtsår: "Bengtsårin leirisaari, Hanko",
  korpiko: "Korpikoti, Lahti",
  "St. Catherine's House – 3. peli": "Metsäpirtti, Tuusula",
  metsäpir: "Metsäpirtti, Tuusula",
  luukin: "Luukin leirikeskus, Espoo",
  ahtela: "Ahtelan nuorisoleirikeskus, Sauvo",
  tuorla: "Avaruuspuisto Väisälä, Kaarina",
  odysseus: "Torpparinmäen peruskoulu, Helsinki",
  kalajai: "Kalajaisten leirikeskus, Ilmajoki",
  kabböl: "Loviisa",
  korpkvädet: "Järnåldersleden, Malax",
  "nokian urheilijoiden maja": "Nokian urheilijoiden maja",
  vihtijär: "Vihtijärven airsoft-alue",
  pocket: "Nokian Tehdassaari",
  byarsborg: "Byarsborg, Sipoo",
  leirinie: "Leiriniemi, Mäntsälä",
  ylästön: "Ylästön kotiseututalo, Vantaa",
  "Midwinter Revisited": "Tenalji von Fersen, Suomenlinna, Helsinki",
  "Pakkasen maa 2": "Kesärinne, Tuusula",
  kukkian: "Kukkian keidas, Pälkäne",
  pyysalo: "Pyysalon leirikeskus, Kangasala",
  "Debÿtante Möshpit": "Orivesi",
  "Vaellus IV": "Vantaa",
  puuhamaa: "Tervakosken Puuhamaa",
  vankilamuseo: "Hämeenlinnan vankilamuseo",
  tampere: "Tampere",
  helsin: "Helsinki",
  oulu: "Oulu",
};

function guessLocation(...sources: (string | null)[]): string | null {
  for (const source of sources) {
    for (const [keyword, text] of Object.entries(locationKeywords)) {
      if (source?.toLowerCase().includes(keyword.toLowerCase())) {
        return text;
      }
    }
  }
  return null;
}

function parseDates(description: string) {
  for (const parser of dateParsers) {
    const { startsAt, endsAt } = parser(description);
    if (startsAt) {
      return { startsAt, endsAt };
    }
  }
  return { startsAt: null, endsAt: null };
}

/// Body is HTML that (usually) consists of an <h1> that we don't care about,
/// followed by one or more <p> elements with content wrapped in <em> that form the fluffText,
/// followed by one or more <p> elements without <em> wrapping that form the description,
/// followed by a possible <p> with an <a> that has the homepage url.
/// We want to split that into { fluffText, description, homepageUrl }. It's ok if any of those are null.
function parseBody(body: string): {
  fluffText: string | null;
  description: string | null;
  homepageUrl: string | null;
} {
  const dom = new JSDOM(body);
  const paragraphs = dom.window.document.querySelectorAll("p");
  const fluffParagraphs: string[] = [];
  const descriptionParagraphs: string[] = [];
  let homepageUrl: string | null = null;

  paragraphs.forEach((p) => {
    const link = p.querySelector("a");
    const linkContent = link?.textContent?.trim() || "";
    const em = p.querySelector("em");
    const textContent = p.textContent?.trim() || "";
    const emContent = em?.textContent?.trim() || "";

    if (em && textContent === emContent) {
      // Entire paragraph wrapped in em – part of fluff text
      fluffParagraphs.push(emContent);
    } else if (link && textContent === linkContent) {
      // Entire paragraph wrapped in link – homepage url
      homepageUrl = (link as HTMLAnchorElement).href || null;
    } else if (textContent) {
      // Neither of the above – part of description
      if (
        !textContent.startsWith("Näitä kuvia saa käyttää") &&
        !textContent.startsWith("You may use these pictures")
      ) {
        descriptionParagraphs.push(textContent);
      }
    }
  });

  return {
    fluffText: fluffParagraphs.length > 0 ? fluffParagraphs.join("\n\n") : null,
    description:
      descriptionParagraphs.length > 0
        ? descriptionParagraphs.join("\n\n")
        : null,
    homepageUrl,
  };
}

async function importLarp(subalbum: Subalbum, user: Pick<User, "id">) {
  const url = `${apiUrl}${subalbum.path}`;
  console.log("Fetching", url);
  const response = await fetch(url);
  const data = await response.json();
  const album = LarpAlbum.parse(data);

  const href = `${larppikuvatUrl}${album.path}`;
  const links: LarpLink[] = [{ type: LarpLinkType.PHOTOS, href }];
  const { fluffText, description, homepageUrl } = parseBody(album.body);
  if (homepageUrl) {
    links.push({ type: LarpLinkType.HOMEPAGE, href: homepageUrl });
  }

  const { startsAt, endsAt } = parseDates(description || album.body || "");
  const name = fixCommonTypos(album.title);
  const locationText: string | null = guessLocation(description, name);

  let language: Language = Language.fi;
  if (album.slug.includes("odysseus") && album.slug.includes("local")) {
    language = Language.en;
  } else if (name.includes("Debÿtante Möshpit")) {
    language = Language.en;
  } else if (album.title === "Korpkvädet") {
    language = Language.sv;
  }

  return prisma.larp.create({
    data: {
      alias: album.slug,
      name,
      language,
      locationText,
      startsAt: fromMorningNull(toPlainDateNull(startsAt ?? album.date)),
      endsAt: fromEveningNull(toPlainDateNull(endsAt ?? album.date)),
      fluffText,
      description,
      links: {
        create: links,
      },
      relatedUsers: {
        create: [
          {
            userId: user.id,
            role: RelatedUserRole.CREATED_BY,
          },
        ],
      },
    },
    include: {
      links: true,
      relatedUsers: true,
    },
  });
}

async function importLarps() {
  const user = await prisma.user.upsert({
    where: { email: "yhteys@larppikuvat.fi" },
    update: {},
    create: {
      email: "yhteys@larppikuvat.fi",
      name: "Larppikuvat.fi ylläpito",
    },
    select: {
      id: true,
    },
  });

  const response = await fetch(apiUrl);
  const data = await response.json();
  const rootAlbum = Album.parse(data);
  return Promise.all(
    rootAlbum.subalbums?.map((album) => limit(() => importLarp(album, user))) ??
      []
  );
}

async function main() {
  const larps = await importLarps();
  console.log(JSON.stringify(larps, null, 2));
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
