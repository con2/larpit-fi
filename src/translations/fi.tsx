import { JSX, ReactNode } from "react";
import type { Translations } from "./en";

const translations: Translations = {
  brand: "Larpit.fi",
  Home: {
    tagline: "Suomalaisen larppaamisen joukkoistettu arkisto",
    introduction: (
      AddLarpLink: ({ children }: { children: ReactNode }) => JSX.Element
    ) => (
      <>
        <p>
          <strong>Larpit.fi</strong> on joukkoistettu arkisto menneistä ja
          tulevista larpeista, jotka on järjestetty Suomessa, joilla on
          suomalaisia järjestäjiä tai joihin on osallistunut merkittävä määrä
          suomalaisia.
        </p>
        <p>
          Larpit.fi eroaa esimerkiksi{" "}
          <a
            href="https://kalenteri.larp.fi"
            rel="noopener noreferrer"
            target="_blank"
          >
            LARP-kalenterista
          </a>{" "}
          siten, että kuka tahansa voi{" "}
          <AddLarpLink>lisätä larpin sivustolle</AddLarpLink>. Sinun ei tarvitse
          olla larpin pelinjohtaja tai järjestäjä voidaksesi lisätä pelin!
          Ensimmäistä larppiaan lisäävän käyttäjän lisäykset ennakkotarkistetaan
          ja muut muutokset jälkitarkistetaan. Pelinjohtaja voi ottaa oman
          larppinsa sivun hallintaansa.
        </p>
        <p>
          Larpit.fi pyörii Tampereen Nekalassa Tracon ry:n, Säätöyhteisö B2 ry:n
          ja Tietotunkki oy:n tarjoamalla infrastruktuurilla, ja sitä ylläpitää{" "}
          <strong>Santtu ”Japsu” Pajukanta</strong>. Palvelun avoimeen
          lähdekoodiin voit tutustua{" "}
          <a
            href="https://github.com/con2/larpit-fi"
            rel="noopener noreferer"
            target="_blank"
          >
            GitHubissa
          </a>
          . Tutustu myös{" "}
          <a
            rel="noopener noreferer"
            target="_blank"
            href="https://tracon.fi/tietosuoja/larpit-fi"
          >
            tietosuojaselosteeseen
          </a>
          .
        </p>
        <h5>Katso myös</h5>
        <ul className="bullet-none">
          <li>
            <a href="https://larp.fi" rel="noopener noreferer" target="_blank">
              Larp.fi
            </a>{" "}
            – Mitä larppaaminen on?
          </li>
          <li>
            <a
              href="https://larppikuvat.fi"
              rel="noopener noreferer"
              target="_blank"
            >
              Larppikuvat.fi
            </a>{" "}
            – Kuvia suomalaisista larpeista
          </li>
        </ul>
      </>
    ),
    sections: {
      ongoingSignup: "Ilmoittautuminen käynnissä tai avautumassa pian",
      upcoming: "Muut tulevat larpit",
      past: "Menneet larpit",
    },
  },
  LarpPage: {
    links: {
      HOMEPAGE: "Pelin kotisivu",
      PHOTOS: "Kuvia pelistä",
      SOCIAL_MEDIA: "Sosiaalinen media",
    },
    actions: {
      claim: {
        title: "Oletko pelinjohtaja tai järjestäjä? Ota sivu hallintaasi!",
        label: "Ota hallintaan",
        message: (
          <>
            <p>
              Tämän larpin pelinjohtaja tai järjestäjä ei ole vielä ottanut
              sivua hallintaansa. Sivulla näytetään pelistä vain perustiedot.
            </p>
            <p>
              Ottamalla sivun hallintaasi voit muokata pelin tietoja, lisätä
              linkkejä sosiaaliseen mediaan ja kuviin jne.
            </p>
            <p>
              Tarkistamme pelien hallintaanottopyynnöt verkostostamme
              varmistuaksemme siitä, että hallintaa pyytävä on oikeasti pelin
              pelinjohtaja tai järjestäjä.
            </p>
          </>
        ),
      },
    },
  },
  Navigation: {
    actions: {
      addLarp: "Lisää larppi",
    },
  },
};

export default translations;
