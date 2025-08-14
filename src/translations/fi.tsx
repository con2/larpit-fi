import { JSX, ReactNode } from "react";
import type { Translations } from "./en";

const translations: Translations = {
  brand: "Larpit.fi",
  HomePage: {
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
          <AddLarpLink>lisätä larpin sivustolle</AddLarpLink> tai ehdottaa
          muutosta larpin tietoihin – sen ei tarvitse olla pelinjohtaja!
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
    actions: {
      claim: (
        ClaimLink: ({ children }: { children: ReactNode }) => JSX.Element
      ) => (
        <>
          Oletko tämän larpin pelinjohtaja tai tapahtuman järjestäjä?{" "}
          <ClaimLink>Ota sivu hallintaasi</ClaimLink> muokataksesi tietoja!
        </>
      ),
      suggestEdit: (
        EditLink: ({ children }: { children: ReactNode }) => JSX.Element
      ) => (
        <>
          Onko tällä sivulla jotain pielessä? Puuttuuko julkisia tietoja?{" "}
          <EditLink>Ehdota muutosta</EditLink>!
        </>
      ),
    },
  },
  ClaimLarpPage: {
    title: "Oletko pelinjohtaja tai järjestäjä? Ota sivu hallintaasi!",
    message: (
      <>
        <p>
          Tämän larpin pelinjohtaja tai järjestäjä ei ole vielä ottanut sivua
          hallintaansa. Sivulla näytetään pelistä vain perustiedot.
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
  Larp: {
    attributes: {
      links: {
        title: "Links",
        types: {
          HOMEPAGE: "Pelin kotisivu",
          PHOTOS: "Kuvia pelistä",
          SOCIAL_MEDIA: "Sosiaalinen media",
          PLAYER_GUIDE: "Pelaajan käsikirja",
        },
      },
      leftRelatedLarps: {
        title: "Tähän larppiin liittyvät larpit",
        types: {
          SEQUEL: "Jatko-osa larpille",
          SPINOFF: "Spinoff larpista",
          IN_CAMPAIGN: "Larppi kampanjassa",
          IN_SERIES: "Tapahtuma sarjassa",
          RUN_OF: "Pelautus larpista",
          RERUN_OF: "Uudelleenpelautus larpista",
          PLAYED_AT: "Pelattu tapahtumassa",
        },
      },
      rightRelatedLarps: {
        title: "Related larps (right side of the relation)",
        types: {
          SEQUEL: "on jatko-osa tälle larpille",
          SPINOFF: "on tämän larpin spinoff",
          IN_CAMPAIGN: "on larppi tässä kampanjassa",
          IN_SERIES: "on tapahtuma tässä sarjassa",
          RUN_OF: "on pelautus tästä larpista",
          RERUN_OF: "on uudelleenpelautus tästä larpista",
          PLAYED_AT: "pelattiin tässä tapahtumassa",
        },
      },
      signupOpen: {
        openIndefinitely: <>Ilmoittautuminen auki</>,
        openUntil: (formattedDate: ReactNode) => (
          <>Ilmoittautuminen auki {formattedDate} asti</>
        ),
        opensAt: (formattedDate: ReactNode) => (
          <>Ilmoittautuminen avautuu {formattedDate}</>
        ),
      },
    },
  },
  SearchPage: {
    title: "Etsi larppeja",
    searchTerm: {
      title: "Hakusana",
      placeholder: "Syötä hakusana ja paina rivinvaihtoa",
    },
  },
  Navigation: {
    actions: {
      addLarp: "Lisää larppi",
      search: "Etsi larppeja",
    },
  },
  UserMenu: {
    ownLarps: "Omat larpit",
    signIn: "Kirjaudu sisään",
    signOut: "Kirjaudu ulos",
    usernameMissing: "Kirjautunut sisään",
  },
  LanguageSwitcher: {
    supportedLanguages: {
      fi: "suomi",
      en: "englanti",
    },
    // NOTE: value always in target language
    switchTo: {
      fi: "suomeksi",
      en: "In English",
    },
  },
};

export default translations;
