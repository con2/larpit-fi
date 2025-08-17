import { UserRole } from "@/generated/prisma";
import { JSX, ReactNode } from "react";

const translations = {
  title: "Larpit.fi",
  stagingTitle: "Larpit.fi (STAGING)",

  HomePage: {
    tagline: "Crowd-sourced archive of Finnish larp",
    introduction: (
      AddLarpLink: ({ children }: { children: ReactNode }) => JSX.Element,
      PrivacyPolicyLink: ({ children }: { children: ReactNode }) => JSX.Element
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
          Larpit.fi is a service of Tracon ry, running on the infrastructure
          generously provided by Säätöyhteisö B2 ry and Tietotunkki oy, and
          maintained by <strong>Santtu ”Japsu” Pajukanta</strong>. The service
          is open source and the source code can be found on{" "}
          <a
            href="https://github.com/con2/larpit-fi"
            rel="noopener noreferer"
            target="_blank"
          >
            GitHub
          </a>
          . You can also view our{" "}
          <PrivacyPolicyLink>privacy policy</PrivacyPolicyLink>.
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
    stagingIntroduction: (
      <p>
        This is the staging environment. You might want to go to the{" "}
        <a href="https://larpit.fi" target="_blank" rel="noopener noreferrer">
          production site
        </a>
        .
      </p>
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
        <p className="form-text">
          You can also use this form to create events that are related to
          larping but are not larps themselves, including (but not limited to)
          meetups, workshops, larp festivals and conventions. In this case,
          please excuse the use of the word &quot;larp&quot; on this form; it
          shall larp whatever the type of the event you are adding.
        </p>
      </>
    ),
    actions: {
      submit: "Submit",
    },
    sections: {
      contact: {
        title: "Who are you?",
        loggedIn: (
          LogoutLink: ({ children }: { children: ReactNode }) => JSX.Element,
          ProfileLink: ({ children }: { children: ReactNode }) => JSX.Element
        ) => (
          <p>
            You are logged in as the user displayed below. If you are not this
            person, please <LogoutLink>log out</LogoutLink>. If there are errors
            in the information displayed, please correct them in your{" "}
            <ProfileLink>Kompassi profile</ProfileLink>. Then log out and back
            in again.
          </p>
        ),
        notLoggedIn: (
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
          </>
        ),
      },
      submit: {
        title: "Almost ready!",
        message: (
          <>
            <p>
              You&apos;re almost good to go! Before you submit, please review
              the provided information carefully. Your submission may need to be
              approved by a moderator before it is published. Depending on your
              relation to the larp, your future edits may have to be approved by
              the GM or a moderator.
            </p>
            <p>
              If you feel there is further context you need to add or something
              else you want to tell the person processing your request, you can
              use the field below to do so. Note that the person processing your
              request may be a moderator or the GM.
            </p>
          </>
        ),
        notLoggedIn: (
          <p>
            Oh, one more thing! Since you are not logged in, we need to make
            sure you are, in fact, a human person and not a sinister agent of
            our future machine overlords. We shall carry this out in the
            cheapest, stupidest way possible.
          </p>
        ),
        attributes: {
          cat: {
            title: "Cat",
            label: "Which animal says meow?",
            helpText: "Not a robot? Prove it!",
          },
        },
      },
    },
    subpages: {
      verificationRequired: {
        title: "Check your inbox!",
        message: (
          <p>
            A verification email has been sent to the email address you
            provided. To complete the request, please click the link in the
            email.
          </p>
        ),
      },
      thanks: {
        title: "Thank you!",
        message: (
          <p>
            Thank you for your contribution! It will be reviewed soon by our
            moderators.
          </p>
        ),
        backToFrontPage: "Back to front page",
      },
    },
  },
  EditLarpPage: {
    title: "Edit this page",
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
    title: "Larp",
    listTitle: "All larps",
    attributes: {
      emptyAttribute: "Empty",
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
          OTHER: "Other",
        },
      },
      type: {
        title: "Type",
        label: "What type of larp is this?",
        choices: {
          ONE_SHOT: {
            title: "One-shot",
          },
          CAMPAIGN_LARP: {
            title: "Campaign larp",
          },
          CAMPAIGN: {
            title: "Campaign",
          },
          MULTIPLE_RUNS: {
            title: "A larp with multiple runs",
          },
          OTHER_EVENT_SERIES: {
            title: "A series of other events",
          },
          OTHER_EVENT: {
            title: "Other event",
          },
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
      dateRange: {
        title: "Dates",
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
      signupStartsAt: {
        title: "Signup start date",
        label: "When does the signup start?",
        helpText: (
          <>
            Larps whose signup is in progress or starting soon will be
            highlighted on the front page.
          </>
        ),
      },
      signupEndsAt: {
        title: "Signup end date",
        label: "When does the signup end?",
        helpText: (
          <>
            If the signup start date is set but the signup end date is not set,
            the signup will appear open until the start date of the larp.
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
    actions: {
      showAll: {
        title: "Show everything",
        active:
          "Showing everything (including campaign pages, meetups, etc. non-larps)",
        inactive: "Showing only actual larps.",
      },
    },
  },
  ModerationRequest: {
    listTitle: "Moderation requests",
    singleTitle: "Moderation request",
    attributes: {
      createdAt: {
        title: "Request date",
      },
      action: {
        title: "Request action",
        choices: {
          CREATE: {
            title: "Create a new larp page",
          },
          UPDATE: {
            title: "Suggest changes to a larp page",
          },
          CLAIM: {
            title: "Claim a larp page",
          },
        },
      },
      name: {
        title: "Name of the larp",
      },
      submitterName: {
        title: "Submitter name",
        label: "Your name",
        helpText:
          "Need not be the name in your passport as long as this is what larpers in Finland know you by.",
      },
      submitterEmail: {
        title: "Submitter email",
        label: "Your email address",
        helpText: "A verification email will be sent to this address.",
      },
      submitterRole: {
        title: "Role of submitter",
        label: "What is your relation to this larp?",
        choices: {
          GAME_MASTER: {
            title: "Game Master",
            label: "I am a Game Master of this larp or organizer of this event",
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
      status: {
        title: "Status of the request",
        choices: {
          PENDING_VERIFICATION: {
            title: "Pending email verification",
            label: "Request pending email verification",
          },
          VERIFIED: {
            title: "Pending moderator approval",
            label: "Request pending moderator approval",
          },
          AUTO_APPROVED: {
            title: "Published (pending moderator check)",
            label: "Auto-approved request (pending moderator check)",
          },
          APPROVED: {
            title: "Approved",
            label: "Approved request",
          },
          REJECTED: {
            title: "Rejected",
            label: "Rejected request",
          },
          WITHDRAWN: {
            title: "Withdrawn",
            label: "Withdrawn request",
          },
        },
      },
      isResolved: {
        title: "Resolved",
        choices: {
          true: {
            label: "Resolved moderation request",
          },
          false: {
            label: "Pending moderation request",
          },
        },
      },
      resolvedBy: {
        title: "Resolved by",
        notResolved: "Not resolved",
      },
      message: {
        title: "Message from submitter",
        label: "Message to the person processing this request",
        helpText: "It's okay to leave this blank if you've nothing to add.",
      },
      resolvedMessage: {
        title: "Message from resolver",
        label: "Reason",
        helpText: (
          <>
            Here you can provide a reason for the resolution you took. The
            provided reason will be displayed to other moderators and the GM.
            Please be civil; if the submitter makes a subject data request, the
            contents will be included in the data provided.
          </>
        ),
      },
      larp: {
        title: "Larp subject to the request",
      },
    },
    actions: {
      showAll: {
        title: "Also show resolved requests",
        active: "Showing all requests (including resolved ones)",
      },
      resolve: {
        title: "Resolve this request",
        submit: "Resolve request",
        attributes: {
          resolution: {
            title: "Resolution",
            choices: {
              APPROVED: {
                title: "Approve the request",
                description: "The requested edit will be applied.",
                already: "This request has already been approved.",
              },
              REJECTED: {
                title: "Reject the request",
                description: "The requested edit will not be applied.",
                already: "This request has already been rejected.",
              },
            },
          },
        },
      },
      markChecked: {
        title: "Mark automatically approved request as checked",
        submit: "Mark as checked",
        description: (
          <>
            <p>
              This request was approved automatically, as the submitter had
              previously submitted a larp that was approved. On such occasions,
              subsequent larps created by them are flagged for post-moderation.
            </p>
            <p>
              Once you have checked the larp page, please mark this request as
              checked. If there is a problem with the content, please fix it by
              editing the larp page.
            </p>
          </>
        ),
      },
    },
    messages: {
      autoApproved: (_role: UserRole): string => {
        throw new Error("This message should not be used in English.");
      },
    },
  },
  VerificationCodePage: {
    title: "Verify your request",
    message: "In order to verify your request, please tap the button below.",
    actions: {
      verify: "Verify my request",
    },
    errors: {
      notPendingVerification: {
        title: "Request not pending verification",
        message: (
          <>
            <p>
              This request is not pending email verification. It may have
              already been verified or processed without verification.
            </p>
            <p>
              If you believe this is in error, please contact the site
              administrator.
            </p>
          </>
        ),
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
  User: {
    singleTitle: "User",
    listTitle: "Users",
    privacyWarning: (
      PrivacyPolicyLink: ({ children }: { children: ReactNode }) => JSX.Element
    ) => (
      <>
        <strong>NOTE:</strong> The personal data displayed below may be used{" "}
        <em>solely</em> for the purposes described in the{" "}
        <PrivacyPolicyLink>privacy policy</PrivacyPolicyLink>.
      </>
    ),
    attributes: {
      email: {
        title: "Email",
      },
      name: {
        title: "Name",
      },
      emailVerified: {
        title: "Email verified",
      },
      role: {
        title: "Role",
        choices: {
          NOT_VERIFIED: {
            title: "Not verified",
          },
          VERIFIED: {
            title: "Verified",
          },
          MODERATOR: {
            title: "Moderator",
          },
          ADMIN: {
            title: "Admin",
          },
        },
      },
    },
  },
  OwnLarpsPage: {
    title: "Own larps",
    attributes: {
      role: {
        label: "Own role in this larp",
      },
    },
  },
  RelatedUser: {
    title: "Related users",
    message: "This is a list of users who are associated with this larp.",
    attributes: {
      role: {
        title: "Role",
        label: "Role of user in this larp",
        choices: {
          EDITOR: {
            title: "Has editing rights",
          },
          CREATED_BY: {
            title: "Created larp page",
          },
          GAME_MASTER: {
            title: "Game Master",
          },
          VOLUNTEER: {
            title: "Volunteer",
          },
          PLAYER: {
            title: "Player",
          },
          FAVORITE: {
            title: "Marked as favorite",
          },
        },
      },
    },
  },
  LoginRequired: {
    title: "Login required",
    message: "You need to be logged in to see this page.",
    actions: {
      login: "Log in",
    },
  },
  ModeratorRequired: {
    title: "Insufficient privileges",
    message: "You need moderator rights to see this page.",
  },
  AdminRequired: {
    title: "Insufficient privileges",
    message: "You need admin rights to see this page.",
  },
  Navigation: {
    actions: {
      addLarp: "Add a larp",
      search: "Search larps",
      moderate: "Moderate",
      manageUsers: "Users",
    },
  },
  UserMenu: {
    ownLarps: "Own larps",
    signIn: "Sign in",
    signOut: "Sign out",
    usernameMissing: "Logged in",
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
