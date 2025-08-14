import { JSX, ReactNode } from "react";

const translations = {
  brand: "Larpit.fi",
  HomePage: {
    tagline: "Crowd-sourced archive of Finnish larp",
    introduction: (
      AddLarpLink: ({ children }: { children: ReactNode }) => JSX.Element
    ) => (
      <>
        <p>
          Larpit.fi is a crowd-sourced archive of past and future larps
          organized in Finland, by Finns, or having a significant Finnvasion.
        </p>
        <p>
          Anyone can <AddLarpLink>add a larp to the site</AddLarpLink> or
          suggest a change – you do not have to be the organizer or GM to do so!
          Your first larp submission will be pre-moderated, and subsequent
          changes will be post-moderated. The GM can take ownership of the larp
          page.
        </p>
        <p>
          Larpit.fi is generously hosted on infrastructure provided Tracon ry,
          Säätöyhteisö B2 ry and Tietotunkki oy, and maintained by Japsu. The
          service is open source and the source code can be found on{" "}
          <a
            href="https://github.com/con2/larpit-fi"
            rel="noopener noreferer"
            target="_blank"
          >
            GitHub
          </a>
          .
        </p>
        <h5>See also</h5>
        <ul className="bullet-none">
          <li>
            <a
              href="https://www.odysseuslarp.com/what-is-larp.html"
              rel="noopener noreferer"
              target="_blank"
            >
              What is larp?
            </a>{" "}
            – Larp, Nordic larp and Finnish larp explained at the Odysseus
            website
          </li>
          <li>
            <a
              href="https://larppikuvat.fi"
              rel="noopener noreferer"
              target="_blank"
            >
              Larppikuvat.fi
            </a>{" "}
            – Photos from Finnish larps
          </li>
        </ul>
      </>
    ),
    sections: {
      ongoingSignup: "Sign-up in progress or opening soon",
      upcoming: "Other upcoming larps",
      past: "Past larps",
    },
  },
  LarpPage: {
    actions: {
      claim: (
        ClaimLink: ({ children }: { children: ReactNode }) => JSX.Element
      ) => (
        <>
          Are you the GM or organizer? <ClaimLink>Claim this page</ClaimLink> to
          edit the details!
        </>
      ),
      suggestEdit: (
        EditLink: ({ children }: { children: ReactNode }) => JSX.Element
      ) => (
        <>
          Is there something wrong on this page? Is there public info missing?{" "}
          <EditLink>Suggest an edit</EditLink>!
        </>
      ),
    },
  },
  NewLarpPage: {
    title: "Add a larp",
    message: (
      <>
        <p>
          To add a new larp, please fill out the following form with all the
          relevant details. Fields marked with an asterisk (*) are required.
        </p>
      </>
    ),
    actions: {
      submit: "Submit",
    },
    sections: {
      contact: {
        title: "Who are you?",
        message: (
          LoginLink: ({ children }: { children: ReactNode }) => JSX.Element
        ) => (
          <>
            <p>
              Since you are not logged in, we need to ask for your name and
              email address. Alternatively, you can{" "}
              <LoginLink>log in with your Kompassi account</LoginLink> to skip
              some of the bureaucracy. Any unsaved changes will be lost if you
              log in now.
            </p>
          </>
        ),
        attributes: {
          submitterName: {
            title: "Name",
            label: "Your name",
            helpText:
              "Need not be the name in your passport as long as this is what larpers in Finland know you by.",
          },
          submitterEmail: {
            title: "Email",
            label: "Your email address",
            helpText: "A verification email will be sent to this address.",
          },
          submitterRole: {
            title: "Role of submitter",
            label: "What is your relation to this larp?",
            choices: {
              GAME_MASTER: {
                title: "Game Master",
                label:
                  "I am a Game Master of this larp or organizer of this event",
              },
              VOLUNTEER: {
                title: "Volunteer",
                label: "I am a volunteer, helper or NPC at this larp or event",
              },
              PLAYER: {
                title: "Player",
                label:
                  "I played a character in this larp or have been selected to play in it",
              },
              NONE: {
                title: "Other or no relation",
                label: "None of the above",
              },
            },
          },
        },
      },
      privacy: {
        title: "We take your privacy seriously",
        message: (
          PrivacyPolicyLink: ({
            children,
          }: {
            children: ReactNode;
          }) => JSX.Element
        ) => (
          <>
            <p>
              Your name and email will only be used for the purpose of knowing
              who submitted this information. If you claim any other relation to
              this larp than &quot;<em>None of the above</em>&quot;, we may
              share your name and email with the GM of this larp, once they have
              been identified. We may contact you to ask for more information or
              to address a problem with your submission.
            </p>
            <p>
              Your personal data will not be used for any other purpose or
              shared with third parties. For further information about our
              privacy practices, please see our{" "}
              <PrivacyPolicyLink>Privacy Policy</PrivacyPolicyLink>.
            </p>
          </>
        ),
        consentCheckbox: (
          <>
            I consent to the processing of my personal data as described above.
          </>
        ),
      },
      larp: {
        title: "Details of the larp",
        message: (
          <>
            <p>
              This information will be used to create the larp page and will be
              visible to other users. We reserve the right to edit any
              information you provide here for correctness and style.
            </p>
            <p>
              If you are not the GM or organizer, please be considerate about
              what info you provide here. Has the information been made
              available in a public source by the larp organizers? If not,
              please take a moment to consider what can be shared and what
              cannot.
            </p>
            <p>
              You can also use this form to create events that are related to
              larping but are not larps themselves, including (but not limited
              to) meetups, workshops, larp festivals and conventions. In this
              case, please excuse the use of the word &quot;larp&quot; on this
              form form; it shall larp whatever the type of the event you are
              adding.
            </p>
          </>
        ),
      },
      submit: {
        title: "Almost ready!",
        message: (
          <>
            <p>
              You&apos;re almost good to go! Before you submit, please review
              the provided information carefully. Since you are not logged in,
              your submission may need to be approved by a site administrator
              before it is published. Depending on your relation to the larp,
              your future edits may have to be approved by the GM or site
              administration.
            </p>
            <p>
              If you feel there is further context you need to add or something
              else you want to tell the person processing your request, you can
              use the field below to do so. Note that the person processing your
              request may be a site administrator, a community moderator or the
              GM.
            </p>
            <p>
              Oh, one more thing! Since you are not logged in, we need to make
              sure you are, in fact, a human person and not a sinister agent of
              our future machine overlords. We shall carry this out in the
              cheapest, stupidest way possible.
            </p>
          </>
        ),
        attributes: {
          message: {
            title: "Message",
            label: "Message to the person processing this request",
            helpText: "It's okay to leave this blank if you've nothing to add.",
          },
          cat: {
            title: "Cat",
            label: "Which animal says meow?",
            helpText: "Not a robot? Prove it!",
          },
        },
      },
    },
  },
  SearchPage: {
    title: "Search for larps",
    searchTerm: {
      title: "Search term",
      placeholder: "Enter a search term and press Enter",
    },
  },
  ClaimLarpPage: {
    title: "Claim this page",
    message: (
      <>
        <p>
          The GM or organizer of this larp has not yet claimed the page. Only
          basic information about the larp is shown.
        </p>
        <p>
          By claiming this page, you can edit the larp information, add links to
          social media and photos etc.
        </p>
        <p>
          We will carefully verify your claim to ensure that you are indeed the
          GM or organizer of this larp or other event.
        </p>
      </>
    ),
  },
  Larp: {
    attributes: {
      name: {
        title: "Name",
        label: "Name of the larp",
        helpText: (
          <>
            If this is a re-run, you can include the run in parentheses.
            Example: <em>Signs and Portents (run 2)</em>.
          </>
        ),
      },
      language: {
        title: "Language",
        label: "What is the primary language of the larp?",
        helpText: (
          <>
            If you selected <em>Other</em>, please elaborate in the message
            field below.
          </>
        ),
        choices: {
          fi: "Finnish",
          en: "English",
          sv: "Swedish",
          other: "Other",
        },
      },
      tagline: {
        title: "Tagline",
        label: "Tagline of the larp",
        helpText: (
          <>
            Here you can summarize what the larp is about in a few words, in the
            primary language of the larp. This will be prominently displayed
            next to the name of the larp. You can check the front page for
            examples of taglines. A good format is &quot;
            <em>An &lt;adjective&gt; larp about &lt;topic&gt;</em>&quot;: for
            example, &quot;<em>An epic larp about space exploration</em>
            &quot;.
          </>
        ),
      },
      startsAt: {
        title: "Starting date",
        label: "When does the larp start?",
        helpText: (
          <>
            For single-day events, this is the only date you need to provide.
            For multi-day events, please provide the date the <em>event</em>{" "}
            starts, including any workshops or off-game days adjacent to actual
            in-game time.
          </>
        ),
      },
      endsAt: {
        title: "Ending date",
        label: "When does the larp end?",
        helpText: (
          <>
            For single-day events, you can leave this blank. For multi-day
            events, please provide the date the <em>event</em> ends.
          </>
        ),
      },
      locationText: {
        title: "Location",
        label: "Where is the larp played?",
        helpText: (
          <>
            Please provide the name of the venue. You can add the name of the
            municipality or city, if it is not apparent from the name of the
            venue. Do not include the street address. <strong>NOTE:</strong> If
            this is a private residence or similar, do not provide the address
            or the name of the resident. Instead, only give a vague location
            such as <em>Helsinki</em> or <em>Tampere region</em>.
          </>
        ),
      },
      fluffText: {
        title: "Fluff text",
        label: "Optional fluff text about the larp",
        helpText: (
          <>
            Many larps have a short, in-game or if-game piece of prose or poem
            that is used to convey the mood and themes of the game. This text
            will be displayed prominently on the larp page above the
            description. Two newlines produce a paragraph break; no other
            formatting is available. We suggest you keep this shorter than 1000
            characters. The fluff text should be written in the primary language
            of the larp. You can check the pages of existing larps for examples
            and inspiration.
          </>
        ),
      },
      description: {
        title: "Description",
        label: "Optional off-game description of the larp",
        helpText: (
          <>
            You can write a short off-game, matter-of-fact description of the
            larp here. You can include its themes, setting, and any other
            relevant information. Markdown formatting is available (sanitized;
            use common sense and don&apos;t try to play pranks on us). We
            suggest you keep this shorter than 1000 characters. The description
            should be written in the primary language of the larp. You can check
            the pages of existing larps for examples and inspiration.
          </>
        ),
      },
      links: {
        title: "Links",
        types: {
          HOMEPAGE: "Home page of the larp",
          PHOTOS: "Photos from the larp",
          SOCIAL_MEDIA: "Social media",
          PLAYER_GUIDE: "Player guide",
        },
      },
      leftRelatedLarps: {
        title: "Related larps (left side of the relation)",
        types: {
          SEQUEL: "A sequel to",
          SPINOFF: "A spinoff of",
          IN_CAMPAIGN: "A larp in campaign",
          IN_SERIES: "An event in series",
          RUN_OF: "A run of",
          RERUN_OF: "A rerun of",
          PLAYED_AT: "Played at",
        },
      },
      rightRelatedLarps: {
        title: "Related larps (right side of the relation)",
        types: {
          SEQUEL: "is a sequel to this larp",
          SPINOFF: "is a spinoff of this larp",
          IN_CAMPAIGN: "is a larp in this campaign",
          IN_SERIES: "is an event in this series",
          RUN_OF: "is a run of this larp",
          RERUN_OF: "is a rerun of this larp",
          PLAYED_AT: "was played at this event",
        },
      },
      signupOpen: {
        openIndefinitely: <>Signup open</>,
        openUntil: (formattedDate: ReactNode) => (
          <>Signup open until {formattedDate}</>
        ),
        opensAt: (formattedDate: ReactNode) => (
          <>Signup opening at {formattedDate}</>
        ),
      },
    },
  },
  Navigation: {
    actions: {
      addLarp: "Add a larp",
      search: "Search larps",
    },
  },
  LanguageSwitcher: {
    supportedLanguages: {
      fi: "Finnish",
      en: "English",
    },
    // NOTE: value always in target language
    switchTo: {
      fi: "suomeksi",
      en: "In English",
    },
  },
};

export type Translations = typeof translations;
export default translations;
