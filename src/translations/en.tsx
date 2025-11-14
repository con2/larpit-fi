import { UserRole } from "@/generated/prisma";
import { JSX, ReactNode } from "react";

const translations = {
  title: "Larpit.fi",
  stagingTitle: "Larpit.fi (STAGING)",

  HomePage: {
    tagline: "Crowd-sourced archive of Finnish larp",
    sections: {
      upcomingOtherEvents: "Upcoming conventions, meetups and other events",
      ongoingSignup: "Sign-up in progress or opening soon",
      upcomingWhenNoOngoingSignupPresent: "Upcoming larps",
      upcomingWhenOngoingSignupPresent: "Other upcoming larps",
      past: "Some past larps",
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
      time: {
        title: "When is the larp played?",
        message: (
          <>
            <p>
              If the larp already has its dates set, please provide them here.
              For one-day events, just the starting date is enough. If the dates
              are not yet set, you can leave these blank.
            </p>
            <p>
              <strong>NOTE:</strong> Please leave these blank if you are
              creating a page for a campaign (as opposed to a single larp in a
              campaign), or a larp with multiple runs (as opposed to a single
              run of such a larp), or a series of events (as opposed to a single
              event in such a series).
            </p>
          </>
        ),
      },
      location: {
        title: "Where is the larp played?",
        message: (
          <>
            Please provide the name of the venue and the municipality it is
            located in. Do not include the street address.{" "}
          </>
        ),
      },
      signup: {
        title: "Signup information",
        message: (
          <>
            <p>
              Here you can provide information about the who can sign up for
              this larp and when.
            </p>
          </>
        ),
      },
      content: {
        title: "Larp page content",
        message: (
          <>
            Here you can provide a short fluff text and a description for the
            larp page.
          </>
        ),
      },
      links: {
        title: "Links",
        message: (
          <p>
            If you know the address of the home page, a public player&apos;s
            handbook, a public photo album or a social media account for the
            larp, please provide them here. Only add the URL (<em>https://…</em>
            ), nothing else.
          </p>
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
    underConstruction: {
      title: "Under construction",
      message: (
        <>
          The edit page is still under construction. But we&apos;re nearly
          there! In the meantime, if there&apos;s something you really need
          fixed right now, send Japsu a message.
        </>
      ),
    },
    editPolicy: {
      VERIFIED: (
        <>
          Your edits will be reviewed by a moderator or the GM before being
          published.
        </>
      ),
      AUTO_APPROVED: (
        <>
          You can edit this page directly without moderation. Your edits will be
          checked afterwards by a moderator.
        </>
      ),
      APPROVED: <>You can edit this page directly without moderation.</>,
    },
  },
  ClaimLarpPage: {
    title: "Claim this page",
    underConstruction: {
      title: "Under construction",
      message: (
        <>
          The claim page is still under construction. In the meantime, if
          there&apos;s something you really need fixed right now, send Japsu a
          message.
        </>
      ),
    },
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
      openness: {
        title: "Openness",
        label: "Who can sign up for this larp?",
        helpText: (
          <>
            Open signup means anyone can apply for this larp. Larps with open
            signup will be highlighted on the front page when the signup is
            approaching or underway. Targeted signup means the larp is targeted
            towards members of a certain association or community. Invite only
            means only people who are invited by the GM can attend.
          </>
        ),
        choices: {
          OPEN: "Open signup",
          TARGETED: "Targeted signup",
          INVITE_ONLY: "Invite only",
        },
      },
      type: {
        title: "Type",
        label: "What type of larp is this?",
        choices: {
          ONE_SHOT: {
            title: "One-shot",
            label: <>A one-shot larp (or a run of a larp with multiple runs)</>,
          },
          CAMPAIGN_LARP: {
            title: "Campaign larp",
            label: <>A larp in a campaign</>,
          },
          CAMPAIGN: {
            title: "Campaign",
            label: <>A campaign of multiple larps</>,
          },
          MULTIPLE_RUNS: {
            title: "Multiple runs",
            label: <>A larp with multiple runs</>,
          },
          OTHER_EVENT: {
            title: "Other event",
            label: (
              <>
                Other event (such as a meet-up, convention, or scenario
                festival)
              </>
            ),
          },
          OTHER_EVENT_SERIES: {
            title: "Other event series",
            label: <>A series of other events</>,
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
        label: "At which venue is the larp played?",
        helpText: (
          <>
            This will be shown as-is on the larp page. <strong>NOTE:</strong> If
            the venue is a private residence or similar, do not provide the
            address or the name of the resident. Instead, leave this field blank
            and select the municipality.
          </>
        ),
      },
      municipality: {
        title: "Municipality",
        label: "Which municipality is the venue located in?",
        helpText: (
          <>
            If the municipality is not in the list, just fill it in the venue
            name field and an admin will take it from there.
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
          HOMEPAGE: {
            title: "Home page of the larp",
            helpText: <></>,
          },
          PHOTOS: {
            title: "Photos from the larp",
            helpText: (
              <>Links to Larppikuvat.fi are preferred (if available).</>
            ),
          },
          SOCIAL_MEDIA: {
            title: "Social media",
            helpText: <></>,
          },
          PLAYER_GUIDE: {
            title: "Player guide",
            helpText: (
              <>
                A player guide is a document that provides most of the
                information about a larp all players need to know. Only share
                the link to the player guide if it is meant to be publicly
                accessible.
              </>
            ),
          },
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
        inviteOnly: <>Invite only</>,
        lookingForReservePlayers: <>Looking for reserve players</>,
      },
      isClaimedByGm: {
        title: "Claimed by Game Master",
        message: <>The Game Master is managing the content of this page.</>,
      },
      numPlayerCharacters: {
        title: "Number of player characters",
        label: "How many player characters are there in this larp?",
        helpText: (
          <>
            If this larp separates player characters and NPCs, include only the
            player characters. If the number is not exactly known, enter your
            best estimate.
          </>
        ),
      },
      numTotalParticipants: {
        title: "Total number of participants",
        label: "How many total participants are there in this larp?",
        helpText: (
          <>
            Including all participants, organizers, volunteers etc. If the
            number is not exactly known, enter your best estimate.
          </>
        ),
      },
      numParticipants(
        numPlayerCharacters: number | null,
        numTotalParticipants: number | null
      ) {
        if (numPlayerCharacters && numTotalParticipants) {
          return `${numPlayerCharacters} player character, ${numTotalParticipants} total participants`;
        } else if (numTotalParticipants) {
          return `${numTotalParticipants} total participants`;
        } else if (numPlayerCharacters) {
          return `${numPlayerCharacters} player characters`;
        } else {
          return null;
        }
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
    tableFooter: (count: number, totalCount: number) => (
      <>
        Showing {count} larp{count === 1 ? "" : "s"} (total {totalCount}).
      </>
    ),
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
      addLinks: {
        title: "Links",
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
      approvedAutomaticallyBecauseUserIs: (_role: UserRole): string => {
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
  Page: {
    listTitle: "Content pages",
    singleTitle: "Content page",
    editTitle: "Edit content page",
    attributes: {
      slug: {
        title: "Slug",
      },
      title: {
        title: "Title",
      },
      content: {
        title: "Content",
      },
      language: {
        title: "Language",
      },
    },
    actions: {
      view: {
        title: "View page",
        label: "View",
      },
      newPage: {
        title: "Create a new content page",
        label: "New page",
      },
      edit: {
        title: "Edit this page",
        label: "Edit",
      },
      submit: {
        title: "Save changes",
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
      pages: "Content pages",
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
