import { JSX, ReactNode } from "react";
import type { Translations } from "./en";
import { UserRole } from "@/generated/prisma";

const translations: Translations = {
  title: "Larpit.fi",
  stagingTitle: "Larpit.fi (STAGING)",

  HomePage: {
    tagline: "Suomalaisen larppaamisen joukkoistettu arkisto",
    sections: {
      upcomingOtherEvents: "Tulevat conit, miitit ja muut tapahtumat",
      ongoingSignup: "Ilmoittautuminen käynnissä tai avautumassa pian",
      upcomingWhenNoOngoingSignupPresent: "Tulevat larpit",
      upcomingWhenOngoingSignupPresent: "Muut tulevat larpit",
      past: "Viimeaikaisia larppeja",
    },
  },
  LarpPage: {
    actions: {
      edit: "Muokkaa tätä sivua",
      claim: (
        ClaimLink: ({ children }: { children: ReactNode }) => JSX.Element
      ) => (
        <>
          Oletko tämän larpin pelinjohtaja tai tapahtuman järjestäjä?{" "}
          <ClaimLink>Ota sivu hallintaasi</ClaimLink> muokataksesi tietoja!
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
        title: "Larpin perustiedot",
        message: (
          <>
            <p>
              Nämä tiedot näytetään larppisivulla. Varaamme oikeuden muokata
              syöttämiäsi tietoja oikeellisuuden ja tyylin nimissä.
            </p>
            <p>
              Jos et ole tämän larpin pelinjohtaja, olethan erityisen tarkka
              siitä, mitä tietoja annat tässä. Ovatko larpin järjestäjät
              julkaisseet jossain tiedon, jonka olet lisäämässä? Jos eivät,
              pohdi tarkoin mitä tietoja voit lisätä ja mitä et.
            </p>
          </>
        ),
      },
      time: {
        title: "Milloin larppi pelataan?",
        message: (
          <>
            <p>
              Jos larpin alku- ja loppupäivä on jo tiedossa, syötä ne tässä.
              Yksipäiväisille larpeille riittää syöttää vain alkupäivä.
            </p>
            <p>
              <strong>HUOM:</strong> Jätä nämä tyhjäksi, jos olet luomassa
              larppisivua kampanjalle (vrt. kampanjan yksittäinen peli),
              larpille josta on useita pelautuksia (vrt. yksittäinen pelautus)
              tai tapahtumasarjalle (vrt. yksittäinen tapahtuma sarjassa).
            </p>
          </>
        ),
      },
      location: {
        title: "Missä larppi pelataan?",
        message: (
          <>
            Tässä voit syöttää pelipaikan nimen ja paikkakunnan, jossa se
            sijaitsee. Älä syötä katuosoitetta.
          </>
        ),
      },
      signup: {
        title: "Tietoja larppiin ilmoittautumisesta",
        message: (
          <>
            <p>
              Tässä voit syöttää tietoja siitä, kuka voi ilmoittautua tähän
              larppiin ja milloin.
            </p>
          </>
        ),
      },
      content: {
        title: "Larppisivun tekstisisältö",
        message: (
          <>
            Tässä voit antaa lyhyen fluffitekstin ja esittelyn larppisivua
            varten.
          </>
        ),
      },
      links: {
        title: "Linkit",
        message: (
          <>
            <p>
              Jos tiedät larpin kotisivun, pelaajan käsikirjan, valokuvien tai
              sosiaalisen median profiilin osoitteen, voit lisätä sen tähän.
              Syötä vain URL (<em>https://…</em>), ei mitään muuta.
            </p>
            <p>
              Harkitse, onko linkki jota olet lisäämässä tarkoitettu julkisesti
              jaettavaksi. Esimerkiksi joidenkin pelien pelaajan käsikirjat on
              suunnattu kaikille pelistä kiinnostuneille, toisissa vain
              pelaajaksi valituille.
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
          cat: {
            title: "Kissa",
            label: "Mikä eläin sanoo miau?",
            helpText: "Vai et muka ole robotti? Todista se!",
          },
        },
      },
    },
    subpages: {
      verificationRequired: {
        title: "Tarkista sähköpostisi!",
        message: (
          <>
            Vahvistusviesti on lähetetty antamaasi sähköpostiosoitteeseen.
            Napsauta vahvistusviestissä olevaa linkkiä vahvistaaksesi pyyntösi.
          </>
        ),
      },
      thanks: {
        title: "Kiitos!",
        message: (
          <>
            Kiitos panoksestasi! Moderaattorimme tarkistavat ehdottamasi
            muutoksen pikimmiten.
          </>
        ),
        backToFrontPage: "Takaisin etusivulle",
      },
    },
  },
  EditLarpPage: {
    title: "Muokkaa larppia",
    underConstruction: {
      title: "Rakenteilla",
      message: (
        <>
          Muokkaussivu on vielä rakenteilla (melkein valmis!). Sillä välin, jos
          jotain tarvitsee korjata saman tien, laita viesti Japsulle.
        </>
      ),
    },
    editPolicy: {
      LOG_IN_TO_EDIT: (
        <>Sinun täytyy kirjautua sisään muokataksesi tätä sivua.</>
      ),
      VERIFIED: (
        <>
          Muokkauksesi tarkistetaan ennen julkaisua moderaattorin tai
          pelinjohtajan toimesta.
        </>
      ),
      AUTO_APPROVED: (
        <>
          Voit muokata tätä sivua ilman ennakkotarkistusta. Muokkauksesi
          tarkistetaan jälkikäteen moderaattorin toimesta.
        </>
      ),
      APPROVED: <>Voit muokata tätä sivua ilman ennakkotarkistusta.</>,
    },
  },
  ClaimLarpPage: {
    title: "Oletko pelinjohtaja tai järjestäjä? Ota sivu hallintaasi!",
    underConstruction: {
      title: "Rakenteilla",
      message: (
        <>
          Larppisivun haltuunottosivu on vielä rakenteilla. Sillä välin, jos
          jotain tarvitsee korjata saman tien, laita viesti Japsulle.
        </>
      ),
    },
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
    title: "Larppi",
    listTitle: "Kaikki larpit",
    attributes: {
      emptyAttribute: "Tyhjä",
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
          OTHER: "muu",
        },
      },
      openness: {
        title: "Avoimuus",
        label: "Kuka voi ilmoittautua tähän larppiin?",
        helpText: (
          <>
            <strong>Avoin pelaajahaku</strong> tarkoittaa, että kuka tahansa voi
            hakea tähän larppiin. Larppeja, joilla on avoin pelaajahaku,
            nostetaan etusivulla, kun ilmoittautuminen on käynnissä tai
            alkamassa. <strong>Kohdennettu pelaajahaku</strong> tarkoittaa, että
            larppi on suunnattu tietyn yhdistyksen tai yhteisön jäsenille.{" "}
            <strong>Kutsupeliin</strong> voivat osallistua vain pelinjohtajan
            kutsumat henkilöt. Jos peliin ilmoittaudutaan ostamalla lippu,
            valitse avoin pelaajahaku.
          </>
        ),
        choices: {
          OPEN: "Avoin pelaajahaku",
          TARGETED: "Kohdennettu pelaajahaku",
          INVITE_ONLY: "Kutsupeli",
        },
      },
      type: {
        title: "Tyyppi",
        label: "Minkä tyyppinen larppi on kyseessä?",
        choices: {
          ONE_SHOT: {
            title: "One-shot",
            label: (
              <>One-shot (tai pelautus larpista, josta on useita pelautuksia)</>
            ),
          },
          CAMPAIGN_LARP: {
            title: "Kampanjapeli",
            label: <>Kampanjapeli (yksittäinen peli kampanjassa)</>,
          },
          CAMPAIGN: {
            title: "Kampanja",
            label: <>Kampanja (joka sisältää useita pelejä)</>,
          },
          MULTIPLE_RUNS: {
            title: "Useita pelautuksia",
            label: <>Larppi, josta on useita pelautuksia</>,
          },
          OTHER_EVENT: {
            title: "Muu tapahtuma",
            label: (
              <>Muu tapahtuma (kuten miitti, coni tai skenaariofestivaali)</>
            ),
          },
          OTHER_EVENT_SERIES: {
            title: "Muiden tapahtumien sarja",
            label: <>Tapahtumasarja</>,
          },
        },
      },
      tagline: {
        title: "Tagline",
        label: "Larpin tagline",
        helpText: (
          <>
            Tässä voit tiivistää myyvästi muutamalla sanalla mistä larpissa on
            kyse. Tagline näytetään keskeisellä paikalla larpin nimen
            alapuolella. Löydät esimerkkejä larppien taglineistä palvelun
            etusivulta. Tagline voi olla vaikkapa muotoa &quot;
            <em>&lt;Adjektiivi&gt; larppi &lt;jostakin teemasta&gt;&quot;</em>;
            esimerkiksi &quot;<em>Jännittävä larppi aikamatkasta</em>&quot;.
          </>
        ),
      },
      dateRange: {
        title: "Ajankohta",
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
            Etusivulla korostetaan larppeja, joilla on avoin ilmoittautuminen
            käynnissä tai alkamassa pian.
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
        title: "Pelipaikka",
        label: "Mikä on pelipaikan nimi?",
        helpText: (
          <>
            Tämä näytetään sellaisenaan larppisivulla. <strong>HUOM:</strong>{" "}
            Jos tapahtumapaikka on yksityisasunto tai vastaava, älä syötä
            osoitetta tai asukkaan nimeä. Jätä sen sijaan tämä kenttä tyhjäksi
            ja valitse vain paikkakunta.
          </>
        ),
      },
      municipality: {
        title: "Kunta",
        label: "Missä kunnassa pelipaikka sijaitsee?",
        helpText: (
          <>
            Jos kunta ei ole listalla, lisää se pelipaikkakenttään, niin
            ylläpitäjä hoitaa sen siitä eteenpäin.
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
          HOMEPAGE: {
            title: "Pelin kotisivu",
            helpText: <></>,
          },
          PHOTOS: {
            title: "Kuvia pelistä",
            helpText: <>Suosi Larppikuvat.fi-linkkejä.</>,
          },
          SOCIAL_MEDIA: {
            title: "Sosiaalinen media",
            helpText: <></>,
          },
          PLAYER_GUIDE: {
            title: "Pelaajan käsikirja",
            helpText: (
              <>
                Pelaajan käsikirja on dokumentti, joka sisältää olennaisimmat
                pelaajille tarpeelliset tiedot larpista. Joissain yhteisöissä
                pelaajan käsikirjaa kutsutaan myös nimellä yleisinfo.
              </>
            ),
          },
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
        inviteOnly: <>Kutsupeli</>,
        lookingForReservePlayers: <>Hakee varapelaajia</>,
      },
      isClaimedByGm: {
        title: "Pelinjohtajan hallinnassa",
        message: <>Pelinjohtaja hallinnoi tämän sivun sisältöä.</>,
        youAreTheGm: <>Hallinnoit tämän sivun sisältöä pelinjohtajan.</>,
      },
      numPlayerCharacters: {
        title: "Pelaajahahmojen lukumäärä",
        label: "Kuinka monta pelaajahahmoa tässä larpissa on?",
        helpText: (
          <>
            Jos tässä larpissa erotellaan pelaajahahmot ja ei-pelaajahahmot
            (NPC:t), sisällytä tähän lukumäärään vain pelaajahahmot.
          </>
        ),
      },
      numTotalParticipants: {
        title: "Osallistujien kokonaismäärä",
        label: "Kuinka monta osallistujaa tässä larpissa on yhteensä?",
        helpText: (
          <>Sisältäen pelaajat, pelinjohtajat, järjestäjät, apulaiset ym.</>
        ),
      },
      numParticipants(
        numPlayerCharacters: number | null,
        numTotalParticipants: number | null
      ) {
        if (numPlayerCharacters && numTotalParticipants) {
          return `${numPlayerCharacters} pelaajahahmoa, ${numTotalParticipants} osallistujaa yhteensä`;
        } else if (numTotalParticipants) {
          return `${numTotalParticipants} osallistujaa yhteensä`;
        } else if (numPlayerCharacters) {
          return `${numPlayerCharacters} pelaajahahmoa`;
        } else {
          return null;
        }
      },
    },
    actions: {
      showAll: {
        title: "Näytä ihan kaikki",
        active: "Näytetään ihan kaikki (ml. kampanjasivut, miitit ym).",
        inactive:
          "Näytetään vain varsinaiset pelautukset (ei kampanjasivuja, miittejä ym).",
      },
    },
    tableFooter: (count: number, totalCount: number) => (
      <>
        Näytetään {count} larppi{count === 1 ? "" : "a"} (yhteensä {totalCount}
        ).
      </>
    ),
  },
  ModerationRequest: {
    listTitle: "Moderointipyynnöt",
    singleTitle: "Moderointipyyntö",
    attributes: {
      createdAt: {
        title: "Pyynnön ajankohta",
      },
      action: {
        title: "Pyydetty muokkaus",
        choices: {
          CREATE: {
            title: "Uuden larppisivun luominen",
          },
          UPDATE: {
            title: "Ehdotettu muokkaus",
          },
          CLAIM: {
            title: "Pyyntö ottaa sivu hallintaan",
          },
        },
      },
      name: {
        title: "Larpin nimi",
      },
      submitterName: {
        title: "Lähettäjän nimi",
        label: "Nimesi",
        helpText:
          "Ei tarvitse olla passinimesi, kunhan suomalaiset larppaajat tuntevat sinut tällä nimellä.",
      },
      submitterEmail: {
        title: "Lähettäjän sähköpostiosoite",
        label: "Sähköpostiosoitteesi",
        helpText: "Vahvistusviesti lähetetään tähän osoitteeseen.",
      },
      submitterRole: {
        title: "Lähettäjän ilmoittama rooli pelissä",
        label: "Mikä on roolisi tässä larpissa?",
        choices: {
          GAME_MASTER: {
            title: "Pelinjohtaja",
            label:
              "Olen tämän larpin pelinjohtaja tai tapahtuman pääjärjestäjä",
          },
          TEAM_MEMBER: {
            title: "Tiimin jäsen",
            label:
              "Olen pelinjohto-/järjestelytiimin jäsen (työskentelen ennen tapahtumaa)",
          },
          VOLUNTEER: {
            title: "Vapaaehtoinen",
            label:
              "Olen vapaaehtoinen, avustaja tai NPC (työskentelen tapahtuman aikana)",
          },
          PLAYER: {
            title: "Pelaaja",
            label:
              "Pelasin pelaajahahmoa tässä larpissa tai minut on valittu pelaamaan siinä",
          },
          NONE: {
            title: "Muu tai ei roolia",
            label: "Ei mikään edellä mainituista",
          },
        },
      },
      status: {
        title: "Pyynnön tila",
        choices: {
          PENDING_VERIFICATION: {
            title: "Odottaa sähköpostivahvistusta",
            label: "Sähköpostivahvistusta odottava pyyntö",
          },
          VERIFIED: {
            title: "Odottaa moderaattorin hyväksyntää",
            label: "Moderaattorin hyväksyntää odottava pyyntö",
          },
          AUTO_APPROVED: {
            title: "Julkaistu (odottaa moderaattorin tarkistusta)",
            label:
              "Moderaattorin tarkistusta odottava automaattisesti hyväksytty pyyntö",
          },
          APPROVED: {
            title: "Hyväksytty",
            label: "Hyväksytty pyyntö",
          },
          REJECTED: {
            title: "Hylätty",
            label: "Hylätty pyyntö",
          },
          WITHDRAWN: {
            title: "Peruttu",
            label: "Peruttu pyyntö",
          },
        },
      },
      resolvedBy: {
        title: "Pyynnön käsittelijä",
        notResolved: "Ei vielä käsitelty",
      },
      isResolved: {
        title: "Pyynnön tila",
        choices: {
          true: {
            label: "Käsitelty moderointipyyntö",
          },
          false: {
            label: "Käsittelyä odottava moderointipyyntö",
          },
        },
      },
      message: {
        title: "Lähettäjän viesti",
        label: "Viesti pyynnön käsittelijälle",
        helpText:
          "On täysin okei jättää tämä kenttä tyhjäksi, jos sinulla ei ole lisättävää.",
      },
      resolvedMessage: {
        title: "Käsittelijän viesti",
        label: "Käsittelijän viesti",
        helpText: (
          <>
            Tässä voit halutessasi perustella ratkaisusi. Perustelu näkyy muille
            moderaattoreille ja pelinjohtajalle. Ole kohtelias perusteluissasi:
            jos lähettäjä pyytää omia tietojaan, perustelu sisällytetään
            toimitettaviin tietoihin.
          </>
        ),
      },
      larp: {
        title: "Larppi jota pyyntö koskee",
      },
      addLinks: {
        title: "Linkit",
      },
    },
    actions: {
      showAll: {
        title: "Näytä myös käsitellyt pyynnöt",
        active: "Näytetään myös käsitellyt pyynnöt.",
      },
      resolve: {
        title: "Käsittele pyyntö",
        submit: "Käsittele pyyntö",
        attributes: {
          resolution: {
            title: "Ratkaisu",
            choices: {
              APPROVED: {
                title: "Hyväksy pyyntö",
                description: "Pyydetty muutos toteutetaan.",
                already: "Tämä pyyntö on jo hyväksytty.",
              },
              REJECTED: {
                title: "Hylkää pyyntö",
                description: "Pyydettyä muutosta ei toteuteta.",
                already: "Tämä pyyntö on jo hylätty.",
              },
            },
          },
        },
      },
      markChecked: {
        title: "Merkitse automaattisesti hyväksytty pyyntö tarkistetuksi",
        submit: "Merkitse tarkistetuksi",
        description: (
          <>
            <p>
              Tämä pyyntö hyväksyttiin automaattisesti, koska lähettäjä oli
              aiemmin luonut larpin joka hyväksyttiin. Tällöin saman lähettäjän
              myöhemmät larpit hyväksytään automaattisesti, mutta ne merkitään
              jälkikäteen tarkistettavaksi.
            </p>
            <p>
              Kun olet tarkistanut larpin sivun, merkitse tämä pyyntö
              tarkistetuksi. Jos sisällössä on ongelmia, korjaa ne muokkaamalla
              suoraan larpin sivua.
            </p>
          </>
        ),
      },
    },
    messages: {
      approvedAutomaticallyBecauseUserIs: (role: UserRole) => {
        let roleName: string = role;
        if (role === UserRole.ADMIN) {
          roleName = "ylläpitäjä";
        } else if (role === UserRole.MODERATOR) {
          roleName = "moderaattori";
        } else {
          throw new Error(`Not implemented: ${role}`);
        }
        return `Hyväksytty automaattisesti, koska lähettäjä on ${roleName}.`;
      },
    },
  },
  VerificationCodePage: {
    title: "Pyynnön vahvistaminen",
    message: "Napsauta alla olevaa painiketta vahvistaaksesi pyyntösi.",
    actions: {
      verify: "Vahvista pyyntöni",
    },
    errors: {
      notPendingVerification: {
        title: "Pyyntö ei edellytä vahvistusta",
        message: (
          <>
            <p>
              Tämä pyyntö ei edellytä sähköpostivahvistusta. Se on voitu jo
              vahvistaa tai käsitellä ilman vahvistusta.
            </p>
            <p>
              Jos uskot tämän olevan virhe, ota yhteyttä sivuston ylläpitäjään.
            </p>
          </>
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
  User: {
    singleTitle: "Käyttäjä",
    listTitle: "Käyttäjät",
    privacyWarning: (
      PrivacyPolicyLink: ({ children }: { children: ReactNode }) => JSX.Element
    ) => (
      <>
        <strong>HUOM:</strong> Alla olevia tietoja saa käyttää{" "}
        <em>ainoastaan</em>{" "}
        <PrivacyPolicyLink>tietosuojakäytännön</PrivacyPolicyLink> mukaisiin
        tarkoituksiin.
      </>
    ),
    attributes: {
      email: {
        title: "Sähköposti",
      },
      name: {
        title: "Nimi",
      },
      emailVerified: {
        title: "Sähköposti vahvistettu",
      },
      role: {
        title: "Rooli",
        choices: {
          NOT_VERIFIED: {
            title: "Ei vahvistettu",
          },
          VERIFIED: {
            title: "Vahvistettu",
          },
          MODERATOR: {
            title: "Moderaattori",
          },
          ADMIN: {
            title: "Ylläpitäjä",
          },
        },
      },
    },
  },
  OwnLarpsPage: {
    title: "Omat larpit",
    attributes: {
      role: {
        label: "Oma rooli tässä larpissa",
      },
    },
  },
  RelatedUser: {
    title: "Liitetyt käyttäjät",
    message: "Tämä on lista käyttäjistä, jotka on liitetty tähän larppiin.",
    attributes: {
      role: {
        title: "Rooli",
        label: "Käyttäjän rooli tässä larpissa",
        choices: {
          EDITOR: {
            title: "Muokkausoikeutettu",
          },
          CREATED_BY: {
            title: "Luonut sivun",
          },
          GAME_MASTER: {
            title: "Pelinjohtaja",
          },
          TEAM_MEMBER: {
            title: "Tiimin jäsen",
          },
          VOLUNTEER: {
            title: "Vapaaehtoinen",
          },
          PLAYER: {
            title: "Pelaaja",
          },
          FAVORITE: {
            title: "Merkinnyt suosikiksi",
          },
        },
      },
    },
  },
  Page: {
    listTitle: "Sisältösivut",
    singleTitle: "Sisältösivu",
    editTitle: "Muokkaa sisältösivua",
    attributes: {
      slug: {
        title: "Tekninen nimi",
      },
      title: {
        title: "Otsikko",
      },
      content: {
        title: "Sisältö",
      },
      language: {
        title: "Kieli",
      },
    },
    actions: {
      view: {
        title: "Näytä sivu",
        label: "Näytä",
      },
      newPage: {
        title: "Luo uusi sisältösivu",
        label: "Uusi sivu",
      },
      edit: {
        title: "Muokkaa tätä sivua",
        label: "Muokkaa",
      },
      submit: {
        title: "Tallenna muutokset",
      },
    },
  },
  LoginRequired: {
    title: "Kirjautuminen vaaditaan",
    message: "Sinun on kirjauduttava sisään nähdäksesi tämän sivun.",
    actions: {
      login: "Kirjaudu sisään",
    },
  },
  ModeratorRequired: {
    title: "Ei käyttöoikeutta",
    message: "Tämä näkymä edellyttää moderaattorin oikeuksia.",
  },
  AdminRequired: {
    title: "Ei käyttöoikeutta",
    message: "Tämä näkymä edellyttää ylläpitäjän oikeuksia.",
  },
  Navigation: {
    actions: {
      addLarp: "Lisää larppi",
      search: "Etsi larppeja",
      pages: "Sisältösivut",
      moderate: "Moderoi",
      manageUsers: "Käyttäjät",
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
