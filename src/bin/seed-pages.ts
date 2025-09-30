import prisma from "@/prisma";
import process from "process";
import { fileURLToPath } from "url";

async function main() {
  await createPage(
    "front-page",
    "fi",
    "Larpit.fi – Suomalaisen larppaamisen joukkoistettu arkisto",
    `
**Larpit.fi** on joukkoistettu arkisto menneistä ja
tulevista larpeista, jotka on järjestetty Suomessa, joilla on
suomalaisia järjestäjiä tai joihin on osallistunut merkittävä määrä
suomalaisia.

Kuka tahansa voi [lisätä larpin](/larp/new) sivustolle tai ehdottaa muutosta
larpin tietoihin – sen ei tarvitse olla pelinjohtaja!
Ensimmäistä larppiaan lisäävän käyttäjän lisäykset ennakkotarkistetaan ja
myöhemmät lisäykset jälkitarkistetaan.
Pelinjohtaja voi ottaa oman larppinsa sivun hallintaansa.

Tutustu myös [tietosuojaselosteeseen](https://tracon.fi/tietosuoja/larpit-fi) ja
osallistu palvelun [kehittämiseen](https://github.com/con2/larpit-fi)!

##### Katso myös

[Larp.fi](https://larp.fi/) – Mitä larppaaminen on?<br>
[Larppikuvat.fi](https://larppikuvat.fi/) – Kuvia suomalaisista larpeista`
  );

  await createPage(
    "front-page",
    "en",
    "Larpit.fi – A Crowdsourced Archive of Finnish larp",
    `
**Larpit.fi** is a crowdsourced archive of past and
future larps organized in Finland, featuring
Finnish organizers, or a significant Finnvasion.

Anyone can [add a larp](/larp/new) to the site or suggest changes
to a larp page – you don't have to be the game master!
The additions of the first user adding their larp will be pre-checked,
and later additions will be post-checked.
The GM can assume control of the page of their own larp.

Also check out the [privacy policy](https://tracon.fi/tietosuoja/larpit-fi) and
participate in [development of the service](https://github.com/con2/larpit-fi)!

##### See also

[What is larp?](https://www.odysseuslarp.com/what-is-larp.html) – Larp, Nordic larp and Finnish larp explained at the Odysseus website<br>
[Larppikuvat.fi](https://larppikuvat.fi/) – Photos from Finnish larps`
  );
  console.log("✔ Content pages seeded.");
}

async function createPage(
  slug: string,
  language: string,
  title: string,
  content: string
) {
  content = content.trim();

  return prisma.page.upsert({
    where: { slug_language: { slug, language } },
    update: {
      title,
      content,
    },
    create: {
      slug,
      language,
      title,
      content,
    },
    select: {
      slug: true,
      language: true,
    },
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  prisma.$transaction(main);
}
