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
  NewLarpPage: {
    title: "Lisää larppi",
    message: (
      <>
        <p>
          Täytä alla oleva lomake lisätäksesi uuden larpin. Tähdellä (*)
          merkityt kentät ovat pakollisia.
        </p>
        <p className="form-text">
          Voit käyttää tätä lomaketta myös sellaisten tapahtumien
          ilmoittamiseen, jotka eivät ole larppeja mutta liittyvät jollain
          tavalla larppaamiseen. Tällaisia voivat olla esimerkiksi miitit,
          työpajat, larppifestivaalit ja conit. Tässä tapauksessa suhtaudu
          luovasti sanan &quot;larppi&quot; käyttöön tällä lomakkeella: se
          larpatkoon juuri sitä minkä tyyppistä tapahtumaa olet luomassa.
        </p>
      </>
    ),
    actions: {
      submit: "Lähetä",
    },
    sections: {
      contact: {
        title: "Kuka olet?",
        loggedIn: (
          LogoutLink: ({ children }: { children: ReactNode }) => JSX.Element,
          ProfileLink: ({ children }: { children: ReactNode }) => JSX.Element
        ) => (
          <p>
            Olet kirjautunut sisään alla näkyvällä käyttäjätunnuksella. Jos et
            ole tässä mainittu henkilö, ole hyvä ja{" "}
            <LogoutLink>kirjaudu ulos</LogoutLink>. Jos tiedoissa on virheitä,
            korjaa virheet <ProfileLink>Kompassin profiilissasi</ProfileLink> ja
            kirjaudu sitten ulos ja uudestaan sisään.
          </p>
        ),
        notLoggedIn: (
          LoginLink: ({ children }: { children: ReactNode }) => JSX.Element
        ) => (
          <>
            <p>
              Koska et ole kirjautunut sisään, on meidän kysyttävä nimeäsi ja
              sähköpostiosoitettasi. Halutessasi voit{" "}
              <LoginLink>kirjautua sisään</LoginLink> Kompassi-tunnuksellasi{" "}
              välttääksesi ylimääräisen byrokratian. Huomaathan, että jos
              kirjaudut sisään nyt, kaikki tallentamattomat muokkaukset
              menetetään.
            </p>
          </>
        ),
        attributes: {
          submitterName: {
            title: "Nimi",
            label: "Nimesi",
            helpText:
              "Ei tarvitse olla passinimesi, kunhan suomalaiset larppaajat tuntevat sinut tällä nimellä.",
          },
          submitterEmail: {
            title: "Sähköposti",
            label: "Sähköpostiosoitteesi",
            helpText: "Vahvistusviesti lähetetään tähän osoitteeseen.",
          },
          submitterRole: {
            title: "Rooli",
            label: "Mikä on roolisi tässä larpissa?",
            choices: {
              GAME_MASTER: {
                title: "Pelinjohtaja",
                label:
                  "Olen tämän larpin pelinjohtaja tai pelinjohtotiimin jäsen",
              },
              VOLUNTEER: {
                title: "Vapaaehtoinen",
                label: "Olen vapaaehtoinen, apulainen tai NPC tässä larpissa",
              },
              PLAYER: {
                title: "Pelaaja",
                label:
                  "Pelasin pelaajahahmoa tässä larpissa tai minut on valittu pelaamaan siinä",
              },
              NONE: {
                title: "Muu tai ei suhdetta",
                label: "Ei mikään edellä mainituista",
              },
            },
          },
        },
      },
      privacy: {
        title: "Yksityisyydensuojasi on meille tärkeää",
        message: (
          PrivacyPolicyLink: ({
            children,
          }: {
            children: ReactNode;
          }) => JSX.Element
        ) => (
          <>
            <p>
              Nimeäsi ja sähköpostiosoitettasi käytetään ainoastaan näiden
              tietojen syöttäjän tunnistamiseksi. Jos valitsit yllä olevasi
              muussa roolissa tässä pelissä kuin &quot;
              <em>Ei mikään edellä mainituista</em>&quot;, voimme luovuttaa
              nimesi ja sähköpostiosoitteesi tämän pelin pelinjohtajalle kun
              pelinjohtaja on tunnistettu. Voimme tarvittaessa olla sinuun
              yhteydessä kysyäksemme lisätietoja antamistasi tiedoista tai
              selvittääksemme mahdollisia niihin liittyviä ongelmia.
            </p>

            <p>
              Henkilötietojasi ei käytetä muuhun tarkoitukseen tai jaeta
              kolmansille osapuolille. Lisätietoja tietosuojakäytännöistämme
              saat tutustumalla{" "}
              <PrivacyPolicyLink>tietosuojaselosteeseen</PrivacyPolicyLink>.
            </p>
          </>
        ),
        consentCheckbox: (
          <>
            Annan suostumukseni henkilötietojeni käsittelyyn yllä kuvatulla
            tavalla.
          </>
        ),
      },
      larp: {
        title: "Larpin tiedot",
        message: (
          <>
            <p>
              Näitä tietoja käytetään larppisivun luomiseen, ja ne tulevat
              näkyviin muille käyttäjille. Varaamme oikeuden muokata syöttämiäsi
              tietoja oikeellisuuden ja tyylin vuoksi.
            </p>
            <p>
              Jos et ole tämän larpin pelinjohtaja, olethan erityisen tarkka
              siitä, mitä tietoja annat tässä. Onko tieto julkaistu jossain
              julkisessa lähteessä larpin järjestäjien toimesta? Jos ei, pohdi
              mitä tietoja voit julkaista ja mitä et.
            </p>
          </>
        ),
      },
      submit: {
        title: "Melkein valmista!",
        message: (
          <>
            <p>
              Olet melkein maalissa! Ennen kuin lähetät lomakkeen, tarkistathan
              antamasi tiedot huolellisesti. Pyyntösi voi vaatia
              ennakkotarkistusta ennen kuin larpin sivu voidaan julkaista.
              Riippuen siitä, mikä on roolisi suhteessa tähän larppiin,
              myöhemmät muokkauksesi voivat edellyttää ylläpitäjän tai
              pelinjohtajan hyväksyntää.
            </p>
            <p>
              Jos tuntuu siltä, että pyyntösi vaatii lisätietoja, tai haluat
              muutoin kertoa pyyntösi käsittelijälle jotain mikä ei sovi
              mihinkään yllä olevista kentistä, voit käyttää siihen alla olevaa
              viestikenttää. Huomaathan, että pyyntösi käsittelijä saattaa olla
              sivuston ylläpitäjä, moderaattori tai pelinjohtaja.
            </p>
          </>
        ),
        notLoggedIn: (
          <p>
            Ai niin, vielä yksi juttu! Koska et ole kirjautunut sisään, meidän
            täytyy varmistua siitä että olet tosiasiassa ihminen etkä
            esimerkiksi tulevien koneylivaltiaimme katala agentti. Hoidamme
            tämän halvimmalla ja hölmöimmällä mahdollisella tavalla.
          </p>
        ),
        attributes: {
          message: {
            title: "Viesti",
            label: "Viesti pyynnön käsittelijälle",
            helpText:
              "On täysin okei jättää tämä kenttä tyhjäksi, jos sinulla ei ole lisättävää.",
          },
          cat: {
            title: "Kissa",
            label: "Mikä eläin sanoo miau?",
            helpText: "Vai et muka ole robotti? Todista se!",
          },
        },
      },
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
      name: {
        title: "Nimi",
        label: "Larpin nimi",
        helpText: (
          <>
            Jos tämä on uudelleenpelautus, voit mainita pelautuksen suluissa.
            Esimerkki: <em>Ennusmerkkejä (pelautus 2)</em>.
          </>
        ),
      },
      language: {
        title: "Kieli",
        label: "Mikä on larpin ensisijainen kieli?",
        helpText: (
          <>
            Jos valitsit <em>Muu</em>, tarkenna alla olevassa viestikentässä.
          </>
        ),
        choices: {
          fi: "suomi",
          en: "englanti",
          sv: "ruotsi",
          other: "muu",
        },
      },
      tagline: {
        title: "Tagline",
        label: "Larpin tagline",
        helpText: (
          <>
            Tässä tiivistää myyvästi muutamalla sanalla mistä larpissa on kyse.
            Tagline näytetään keskeisellä paikalla larpin nimen alapuolella.
            Löydät esimerkkejä larppien taglineistä palvelun etusivulta. Tagline
            voi olla vaikkapa muotoa &quot;
            <em>&lt;Adjektiivi&gt; larppi &lt;jostakin teemasta&gt;&quot;</em>;
            esimerkiksi &quot;<em>Jännittävä larppi aikamatkasta</em>&quot;.
          </>
        ),
      },
      startsAt: {
        title: "Alkamispäivä",
        label: "Milloin larppi alkaa?",
        helpText: (
          <>
            Yksipäiväisille larpeille riittää asettaa tämä päivämäärä.
            Monipäiväisille larpeille syötä päivämäärä, jona
            <em>tapahtuma</em> alkaa, mukaan lukien kaikki työpajat tai
            offgame-päivät, jotka sijoittuvat varsinaisen ingame-ajan yhteyteen.
          </>
        ),
      },
      endsAt: {
        title: "Päättymispäivä",
        label: "Milloin larppi päättyy?",
        helpText: (
          <>
            Yksipäiväisille larpeille voit jättää tämän tyhjäksi.
            Monipäiväisille larpeille anna päivämäärä, jona <em>tapahtuma</em>{" "}
            päättyy.
          </>
        ),
      },
      signupStartsAt: {
        title: "Ilmoittautumisen alkamispäivä",
        label: "Milloin ilmoittautuminen alkaa?",
        helpText: (
          <>
            Niitä larppeja korostetaan etusivulla, joiden ilmoittautuminen on
            käynnissä tai alkaa pian.
          </>
        ),
      },
      signupEndsAt: {
        title: "Ilmoittautumisen päättymispäivä",
        label: "Milloin ilmoittautuminen päättyy?",
        helpText: (
          <>
            Jos ilmoittautumisen alkamispäivä on asetettu mutta päättymispäivä
            ei, ilmoittautuminen näkyy avoimena larppin alkamispäivään saakka.
          </>
        ),
      },
      locationText: {
        title: "Sijainti",
        label: "Missä larppi pelataan?",
        helpText: (
          <>
            Anna tapahtumapaikan nimi. Voit lisätä kunnan tai kaupungin nimen,
            jos se ei käy ilmi tapahtumapaikan nimestä. Älä sisällytä
            katuosoitetta. <strong>HUOM:</strong> Jos tapahtumapaikka on
            yksityisasunto tmv., älä syötä osoitetta tai asukkaan nimeä. Sen
            sijaan syötä vain karkea sijainti, kuten <em>Helsinki</em> tai{" "}
            <em>Pirkanmaa</em>.
          </>
        ),
      },
      fluffText: {
        title: "Fluffiteksti",
        label: "Kirjoita halutessasi lyhyt fluffiteksti larpista",
        helpText: (
          <>
            Monilla larpeilla on lyhyt ingame- tai ifgame-tekstinpätkä, jota
            käytetään kertomaan pelin tunnelmasta ja teemoista. Tekstinpätkä voi
            olla proosa- tai runomuodossa. Tämä teksti näytetään keskeisellä
            paikalla larpin sivulla. Kaksi rivinvaihtoa tuottaa
            kappaleenvaihdon; muita muotoiluja ei ole saatavilla. Suositusmitta
            on alle 1000 merkkiä. Fluffitekstin tulisi olla larpin
            ensisijaisella kielellä. Kurkista olemassa oleville larppisivuille
            löytääksesi esimerkkejä ja inspiraatiota fluffiteksteistä.
          </>
        ),
      },
      description: {
        title: "Kuvaus",
        label: "Kirjoita halutessasi lyhyt offgame-kuvaus larpista",
        helpText: (
          <>
            Voit halutessasi kirjoittaa kirjoittaa tähän larpista lyhyen
            offgame-kuvauksen, johon voit sisällyttää esimerkiksi larpin
            teemoja, tyylilajin, premissin ym. Tekstissä voi käyttää
            Markdown-muotoiluja (lopputulos sanitoidaan; käytä järkeä äläkä
            yritä tehdä mitään jäynää). Suositusmitta on alle 1000 merkkiä.
            Kuvaus tulisi kirjoittaa larpin ensisijaisella kielellä. Kurkista
            olemassa oleville larppisivuille löytääksesi esimerkkejä ja
            inspiraatiota kuvausteksteistä.
          </>
        ),
      },
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
