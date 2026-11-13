import { UserRole } from "@/prisma/enums";
import { JSX, ReactNode } from "react";

const translations = {
  title: "Larp.fi",
  stagingTitle: "Larp.fi (STAGING)",

  Common: {
    actions: {
      returnToLarpPage: {
        title: "Return to larp page",
      },
    },
  },
  HomePage: {
    tagline: "Crowd-sourced archive of Finnish larp",
    title: "Every Finnish larp, past and upcoming, in one place.",
    actions: {
      subscribeToCalendar: "Subscribe to the calendar",
    },
    sections: {
      thisWeek: {
        title: "This week",
        week: (week: number) => `wk ${week}`,
        fullCalendar: "Full calendar",
      },
      ongoingSignup: {
        title: "Signing up now",
      },
      upcomingWhenNoOngoingSignupPresent: "Upcoming larps",
      upcomingWhenOngoingSignupPresent: "Other upcoming larps",
      recentChanges: {
        title: "Recent changes",
      },
      otherEvents: {
        title: "Conventions, festivals, meetups etc.",
        all: (count: number) => `All ${count} upcoming events`,
      },
      addLarp: {
        title: "Run a larp that isn’t here?",
        description:
          "Add it yourself in a couple of minutes. First additions are checked before publishing; later ones after.",
      },
    },
  },
  LarpPage: {
    actions: {
      alias: "Page address",
      headerImage: "Header image",
      edit: "Edit this page",
      delete: "Request deletion",
      adminDelete: "Delete this page",
      manageSignupSettings: "Sign-up settings",
      editShort: "edit",
      suggestChange: "Suggest a change",
      claim: "I’m the GM — claim this page",
      mergeDuplicate: "Merge a duplicate",
    },
    details: {
      when: "When",
      where: "Where",
      participants: "Participants",
    },
    updated: (date: ReactNode) => <>Updated {date}</>,
    signup: {
      pill: {
        open: "Signup open",
        opensSoon: "Signup opens soon",
      },
      title: "Sign-up",
      closes: (date: ReactNode) => <>Closes {date}</>,
      closed: (date: ReactNode) => <>Closed {date}</>,
      opens: (date: ReactNode) => <>Opens {date}</>,
      opened: (date: ReactNode) => <>Opened {date}</>,
      daysLeft: (days: number): string =>
        days === 0
          ? "Closes today"
          : days === 1
            ? "1 day left"
            : `${days} days left`,
      elapsed: "Share of the sign-up period already passed",
      notAnnounced: "Sign-up dates have not been announced yet.",
      cancelled: "This larp has been cancelled.",
      signUpOnSite: "Sign up on the larp’s site",
      visitSite: "Visit the larp’s site",
    },
    pendingEdits: (numPendingEdits: number) =>
      numPendingEdits === 1
        ? "You have an edit to this larp pending moderation."
        : `You have ${numPendingEdits} edits to this larp pending moderation.`,
    ownActions: {
      title: "Your actions",
      addToCalendar: "Add to calendar",
      playing: "I’m playing in this larp",
      played: "I played in this larp",
      favourite: "Favourite",
      signInFirst: "Sign in to mark this",
    },
    gm: {
      claimedByYou: "You are managing this page as the GM.",
      claimed: "The GM is managing this page.",
    },
    relatedLarps: {
      empty: "No related larps yet.",
      emptyHint: "Signed-in users can link reruns, sequels and campaign games.",
    },
    onThisPage: {
      title: "On this page",
      crowdSourced: "Details are crowd-sourced and may be out of date.",
    },
  },
  NewLarpPage: {
    title: "Add a larp",
    eyebrow: "Contribute",
    message: (
      <>
        Larps, but also meetups, workshops, larp festivals and conventions. You
        don&apos;t have to be the GM. Fields marked{" "}
        <span className="lf-accent">*</span> are required; the rest can be
        filled in later by anyone.
      </>
    ),
    actions: {
      submit: "Submit",
    },
    sectionIndex: {
      title: "Sections",
      missing: "{count} missing",
      done: "Done",
      optional: "Optional",
    },
    preview: {
      title: "How it will look in lists",
      note: "Updates as you type.",
      signupNote:
        "While signup is approaching or open, open-signup larps are also highlighted on the front page.",
      namePlaceholder: "Name of the larp",
      noDate: "No date yet",
      pill: {
        openUntil: "Open until {date}",
        opens: "Opens {date}",
        openIndefinitely: "Signup open",
        over: "Signup over",
        inviteOnly: "Invite only",
        cancelled: "Cancelled",
      },
    },
    requiredSummary: {
      allFilled: "All required fields are filled in.",
      stillEmpty: "Required fields still empty ({count}):",
    },
    alreadyListed: {
      title: "Already listed?",
      message: (
        SearchLink: ({ children }: { children: ReactNode }) => JSX.Element,
      ) => (
        <>
          Check <SearchLink>search</SearchLink> first. Reruns get their own
          page; link them as related afterwards.
        </>
      ),
    },
    opennessUnspecified: {
      title: "Not known yet",
      description: "Leave this selected if you don't know who can sign up.",
    },
    sections: {
      contact: {
        title: "Who are you?",
        loggedIn: (
          LogoutLink: ({ children }: { children: ReactNode }) => JSX.Element,
          ProfileLink: ({ children }: { children: ReactNode }) => JSX.Element,
        ) => (
          <p>
            You are logged in as the user displayed here. If you are not this
            person, please <LogoutLink>log out</LogoutLink>. If there are errors
            in the information displayed, please correct them in your{" "}
            <ProfileLink>Kompassi profile</ProfileLink>. Then log out and back
            in again.
          </p>
        ),
        notLoggedIn: (
          LoginLink: ({ children }: { children: ReactNode }) => JSX.Element,
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
          }) => JSX.Element,
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
        consentShort: "consent to data processing",
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
      cancelled: {
        title: "Is the larp cancelled?",
        message: (
          <p>
            If the larp has been cancelled, please indicate it here. It will
            still be included in the listing, but marked as cancelled. Do not
            remove any information about the larp if it has been cancelled, as
            this information is valuable for historical and research purposes.
          </p>
        ),
      },
      time: {
        title: "When and where",
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
            larp, please provide them here. You can add multiple links per
            category and an optional title for each.
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
    switchToCompactForm:
      "Switch to compact form (NOTE: Unsaved changes will be lost!)",
    switchToFullForm:
      "Switch to full form (NOTE: Unsaved changes will be lost!)",
    policy: {
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
  LocalSignupSettings: {
    title: "Sign-up at Larp.fi",
    message:
      "Configure whether participants can sign up for this event directly on Larp.fi.",
    attributes: {
      localSignupStatus: {
        label: "Sign-up mode",
        choices: {
          DISABLED: "Disabled — no sign-up form shown",
          PUBLIC: "Public — anyone can sign up",
          CODE_REQUIRED: "Invite-only — requires a code",
        },
      },
      localSignupCode: {
        label: "Invite code",
        helpText:
          "Participants must enter this code to sign up. Share it only with invited participants.",
      },
      relatedUserVisibility: {
        label: "Who can see the participant list?",
        choices: {
          GM: "Game Master and moderators only",
          PARTICIPANTS: "All signed-up participants",
        },
      },
    },
    actions: {
      save: "Save sign-up settings",
    },
    settingsSaved: "Sign-up settings saved.",
  },
  LocalSignupPage: {
    title: "Sign up",
    userSignupStatus: {
      choices: {
        CANCELLED: "This larp has been cancelled.",
        DISABLED: "Sign-up for this event is not available.",
        CODE_REQUIRED:
          "This event is only accepting sign-ups via a private link.",
        CAN_SIGN_UP: "Sign-up for this event at Larp.fi is in progress!",
        LOCAL_SIGNUP_YES: "You have signed up for this event!",
        LOCAL_SIGNUP_MAYBE: 'You have signed up "maybe" for this event!',
        LOCAL_SIGNUP_NO:
          "You have informed the host you can't make it to this event.",
      },
      actions: {
        signUp: "Sign up here!",
        change: "Update your sign-up here.",
      },
    },
    attributes: {
      displayName: { label: "Your name" },
      email: {
        label: "Email address",
        helpText: "A verification email will be sent to this address.",
      },
      signupStatus: {
        label: "Attending?",
        choices: {
          LOCAL_SIGNUP_YES: { title: "Yes", label: "I am attending" },
          LOCAL_SIGNUP_MAYBE: { title: "Maybe", label: "I might attend" },
          LOCAL_SIGNUP_NO: { title: "No", label: "I am not attending" },
        },
      },
      visibility: {
        label: "Who can see your sign-up?",
        helpText:
          "Note: the Game Master will always see your name and email address.",
        choices: {
          PARTICIPANTS: {
            title: "All participants",
            label: "All participants",
          },
          GM: { title: "Game Master only", label: "Game Master only" },
        },
      },
    },
    actions: {
      submit: "Sign up",
      change: "Update your sign-up",
      remove: "Remove sign-up",
    },
    emailSent:
      "A verification email has been sent. Please check your inbox and click the link to confirm your sign-up.",
    verifyPage: {
      title: "Confirm your sign-up",
      message: "Click the button below to confirm your sign-up for this event.",
      actions: { verify: "Confirm sign-up" },
      alreadyVerified:
        "Your sign-up has already been verified. You can close this page.",
    },
    cancelled: "This larp has been cancelled.",
    disabled: "Sign-up for this event is not available.",
    codeRequired:
      "Sign-up for this event is invite-only. You need a private link to sign up.",
    signupVerified: "Your sign-up has been confirmed!",
  },
  RolesPage: {
    title: "Participants",
    message: "This is a list of users and sign-ups associated with this event.",
    columns: {
      name: "Name",
      role: "Role",
      visibility: "Visibility",
      signedUpAt: "Signed up",
      email: "Email",
      verified: "Verified",
      actions: "Actions",
    },
    visibility: {
      PARTICIPANTS: "Participants",
      GM: "Game Master",
      ONLY_ME: "Only me",
    },
    actions: {
      exportCsv: "Export guest list (CSV)",
      remove: "Remove",
      manage: "Manage",
      confirmRemoveRole: "Remove this role? This cannot be undone.",
      confirmRemoveGmRole:
        "Warning: removing your Game Master role will revoke your edit access to this larp. Remove anyway?",
      confirmRemoveSignup:
        "Remove your sign-up for this event? This cannot be undone. Consider changing your sign-up status to 'No' instead.",
    },
    unauthenticatedSignups: {
      sectionTitle: "Unverified sign-ups",
      badge: "email only",
    },
    insufficientPrivileges:
      "You do not have permission to view the participant list for this event.",
    filters: {
      role: {
        title: "Role",
        all: "All",
        signups: "Signups",
      },
    },
  },
  LarpAliasPage: {
    title: "Page address",
    lede: "A short address for the larp page. Leave empty to remove it; the page always stays reachable at its permanent address too.",
    currentAliasLabel: "Current short address",
    noAlias: "No short address has been set.",
    label: "New short address",
    helpText: (url: string) => `The larp page will be at ${url}`,
    save: "Save",
    errors: {
      invalidFormat:
        "Use only lowercase letters a–z, digits and single hyphens between them.",
      tooLong: (maxLength: number) =>
        `The address can be at most ${maxLength} characters long.`,
      reserved: "This address is reserved for the site itself.",
      takenByLarp: "Another larp already uses this address.",
      takenByPage: "A content page already uses this address.",
    },
  },
  LarpAliasesPage: {
    title: "Short addresses",
    lede: (count: number) =>
      `${count} larps have no short address yet. The fields are prefilled with a suggestion; empty a field to skip that larp. Saved larps disappear from the list.`,
    columns: {
      name: "Larp",
      dates: "Date",
      alias: "Short address",
    },
    save: "Save",
    saved: "Short addresses saved: {count}",
    pagination: {
      title: "Pages",
      previous: "Previous",
      next: "Next",
    },
  },
  MergeLarpPage: {
    eyebrow: "Moderator",
    title: "Merge a duplicate into this page",
    lede: "Pick the duplicate, decide which details to keep, and the duplicate page goes away. Everything attached to it moves here, and its addresses lead here from now on.",
    sides: {
      a: { tag: "A · this page", note: "Survives" },
      b: { tag: "B · the duplicate", note: "Becomes a redirect" },
    },
    pick: {
      suggestions: "Looks like a duplicate",
      noSuggestions: "No larp with the same name and overlapping dates.",
      label: "Or pick any larp",
      submit: "Compare",
    },
    change: "Change",
    swap: "Swap: keep the other page instead",
    notFound: "The larp to merge was not found.",
    form: {
      identical: "{count} fields identical",
      differ: "{count} fields differ",
      progress: "{auto} auto-resolved · {needed} need you",
      status: {
        conflict: "Needs you",
        decided: "Decided",
        filled: "Auto · filled beats empty",
        keepA: "Auto · this page’s wins",
      },
      writeOwn: "Write your own",
      empty: "Empty",
      yes: "Yes",
      no: "No",
      showMore: "Show all",
      fields: {
        name: "Name",
        tagline: "Tagline",
        type: "Type",
        language: "Language",
        openness: "Openness",
        description: "Description",
        fluffText: "Fluff text",
        locationText: "Venue",
        municipalityId: "Municipality",
        numPlayerCharacters: "Player characters",
        numTotalParticipants: "Total participants",
        startsAt: "Starting date",
        endsAt: "Ending date",
        signupStartsAt: "Signup start date",
        signupEndsAt: "Signup end date",
        cancelledAt: "Cancelled",
        alias: "Short address",
        headerImageId: "Header image",
      },
      fieldNotes: {
        alias: "The address not chosen redirects here too.",
        headerImageId: "The image not chosen is deleted.",
      },
      links: {
        title: "Links",
        hint: "Duplicates are combined. Untick a link to drop it.",
        none: "Neither page has links.",
        origin: { a: "A", b: "B", both: "A + B" },
      },
      result: {
        title: "Result",
        linkCount: "{count} links",
        redirect: "B’s addresses redirect here permanently",
        irreversible: "Cannot be undone",
        pending: "{count} fields still need a decision",
        allDecided: "All fields decided",
        submit: "Merge B into this page",
        defaults: {
          title: "How defaults are picked",
          items: [
            "Identical fields need nothing.",
            "A filled field beats an empty one.",
            "This page’s short address and header image are kept unless you pick B’s.",
            "Where both pages have a different value, you decide.",
          ],
        },
      },
      errors: {
        stale:
          "One of the pages changed while you were deciding. Reload the page and check the choices again.",
        undecided: "Some fields still need a decision.",
        notFound: "One of the pages no longer exists.",
        sameLarp: "A page cannot be merged into itself.",
        forbidden: "Only moderators can merge pages.",
      },
    },
  },
  DeleteLarpPage: {
    title: "Delete larp page",
    confirmation: (
      <>
        If you think this larp page should not exist, you can request its
        removal here. Please provide a reason for the deletion request.
      </>
    ),
    submit: "Request deletion",
    adminNote: "As an admin, this will delete the larp immediately.",
    policy: {
      VERIFIED: (
        <>
          If you think this page should not exist, you can request its removal
          here. Your request will be reviewed by the administrator.
        </>
      ),
      APPROVED: (
        <>If you think this page should not exist, you can delete it here.</>
      ),
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
          OPEN: {
            title: "Open signup",
            description: "Anyone can sign up for this larp.",
          },
          TARGETED: {
            title: "Targeted signup",
            description:
              "Members of a certain group or community can sign up for this larp.",
          },
          INVITE_ONLY: {
            title: "Invite only",
            description: "Only invited participants can attend this larp.",
          },
        },
      },
      type: {
        title: "Type",
        label: "What type of larp is this?",
        choices: {
          ONE_SHOT: {
            title: "One-shot larp",
            description:
              "This larp can be attended without expectation of having attended previous related larps or attending future related larps.",
          },
          CAMPAIGN_LARP: {
            title: "Campaign larp",
            description:
              "This larp is part of a larger campaign, and at least a significant portion of its participants are expected to have attended previous larps or attend future larps in the campaign.",
          },
          CAMPAIGN: {
            title: "Campaign",
            description:
              "This is the top-level page of a campaign consisting of multiple larps. Each larp in the campaign should have its own page of the type Campaign larp.",
          },
          MULTIPLE_RUNS: {
            title: "Multiple runs",
            description:
              "This is the top-level page of a larp with multiple runs. Each run should have its own page of the type One-shot larp.",
          },
          OTHER_EVENT: {
            title: "Other event",
            description:
              "This is an event related to larping but not a larp itself, such as a meet-up, convention, or scenario festival.",
          },
          OTHER_EVENT_SERIES: {
            title: "Other event series",
            description:
              "This is a series of events related to larping but not larps themselves.",
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
      signupStatus: {
        title: "Sign-up",
        choices: {
          upcoming: "Upcoming",
          inProgress: "In progress",
          closed: "Closed",
          openIndefinitely: <>Signup open</>,
          openUntil: (formattedDate: ReactNode) => (
            <>Signup open until {formattedDate}</>
          ),
          opensAt: (formattedDate: ReactNode) => (
            <>Signup opening at {formattedDate}</>
          ),
          openUntilShort: (formattedDate: ReactNode) => (
            <>Open until {formattedDate}</>
          ),
          opensShort: (formattedDate: ReactNode) => <>Opens {formattedDate}</>,
          over: <>Signup over</>,
          inviteOnly: <>Invite only</>,
          lookingForReservePlayers: <>Looking for reserve players</>,
          cancelled: <>Cancelled</>,
        },
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
        addLink: "Add link",
        removeLink: "Remove",
        undoRemove: "Undo",
        titlePlaceholder: "Title (optional)",
        titleRequiredPlaceholder: "Title (required for this type)",
        columnType: "Type",
        columnUrl: "URL",
        columnTitle: "Title",
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
          SIGNUP: {
            title: "Sign-up",
            helpText: (
              <>
                Link directly to the sign-up form or other facility used to sign
                up for the larp.
              </>
            ),
          },
          SOURCE: {
            title: "Source",
            helpText: (
              <>
                Where the information about this larp comes from, such as an
                archived copy of an old larp calendar.
              </>
            ),
          },
          OTHER: {
            title: "Other",
            helpText: <></>,
          },
        },
      },
      relatedLarps: {
        title: "Related larps",
        noRelatedLarps: "No related larps yet.",
        actions: {
          add: {
            title: "Add related larp",
            actions: {
              submit: "Add related larp",
              swap: "Swap direction",
            },
            attributes: {
              relatedLarp: "Larp to which the relation is added",
            },
            loginRequired: {
              title: "Login required to add related larps",
              message: "You need to be logged in to add related larps.",
              actions: {
                login: "Log in",
              },
            },
          },
          remove: {
            title: "Remove related larp",
            label: "Remove",
            confirmationByPolicy: {
              VERIFIED:
                "Are you sure you want to remove the relation to this larp? This action will be reviewed by a moderator.",
              AUTO_APPROVED:
                "Are you sure you want to remove the relation to this larp? This action will be checked afterwards by a moderator.",
              APPROVED:
                "Are you sure you want to remove the relation to this larp? This action will be immediate and cannot be undone.",
            },
          },
        },
        errors: {
          alreadyRelated: "These larps are already related.",
        },
        attributes: {
          type: {
            title: "Type of relation",
            choices: {
              SEQUEL: "is a sequel to",
              SPINOFF: "is a spinoff of",
              IN_CAMPAIGN: "is a larp in campaign",
              IN_SERIES: "is an event in series",
              RUN_OF: "is a run of",
              RERUN_OF: "is a rerun of",
              PLAYED_AT: "is played at",
            },
          },
        },
      },
      leftRelatedLarps: {
        title: "Related larps (left side of the relation)",
        label: "Left side of the relation",
        types: {
          SEQUEL: "This is a sequel to",
          SPINOFF: "This is a spinoff of",
          IN_CAMPAIGN: "This is a larp in campaign",
          IN_SERIES: "This is an event in series",
          RUN_OF: "This is a run of",
          RERUN_OF: "This is a rerun of",
          PLAYED_AT: "This is played at",
        },
      },
      rightRelatedLarps: {
        title: "Related larps (right side of the relation)",
        label: "Right side of the relation",
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
      isClaimedByGm: {
        title: "Claimed by Game Master",
        message: <>The GM is managing the content of this page.</>,
        youAreTheGm: <>You are managing the content of this page as the GM.</>,
      },
      numPlayerCharacters: {
        title: <>Player characters</>,
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
        title: <>Total participants</>,
        label: "How many total participants are there in this larp?",
        helpText: (
          <>
            Including all participants, organizers, volunteers etc. If the
            number is not exactly known, enter your best estimate.
          </>
        ),
      },
      numParticipants: {
        title: "Participants",
        format(
          numPlayerCharacters: number | null,
          numTotalParticipants: number | null,
        ) {
          const sPlayerCharacters = numPlayerCharacters === 1 ? "" : "s";
          const sTotalParticipants = numTotalParticipants === 1 ? "" : "s";

          if (numPlayerCharacters && numTotalParticipants) {
            return `${numPlayerCharacters} player character${sPlayerCharacters}, ${numTotalParticipants} total participant${sTotalParticipants}`;
          } else if (numTotalParticipants) {
            return `${numTotalParticipants} total participant${sTotalParticipants}`;
          } else if (numPlayerCharacters) {
            return `${numPlayerCharacters} player character${sPlayerCharacters}`;
          } else {
            return null;
          }
        },
      },
      isCancelled: {
        title: "Cancelled",
        label: "This larp has been cancelled",
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
    filters: {
      type: {
        title: "Type",
        default: "Default types (one shots and campaign larps)",
        all: "All types",
      },
      language: {
        title: "Language",
        all: "All languages",
      },
      cancelled: {
        title: "Cancelled",
        hide: "Hide cancelled larps",
        show: "Also show cancelled larps",
        only: "Only show cancelled larps",
      },
    },
    /** Serializable attributes for client-side LarpTable component */
    clientAttributes: {
      name: { title: "Name" },
      locationText: { title: "Location" },
      municipality: { title: "Municipality" },
      language: {
        title: "Language",
        choices: {
          fi: "Finnish",
          en: "English",
          sv: "Swedish",
          OTHER: "Other",
        },
      },
      type: {
        title: "Type",
        choices: {
          ONE_SHOT: { title: "One-shot larp" },
          CAMPAIGN_LARP: { title: "Campaign larp" },
          CAMPAIGN: { title: "Campaign" },
          MULTIPLE_RUNS: { title: "Multiple runs" },
          OTHER_EVENT: { title: "Other event" },
          OTHER_EVENT_SERIES: { title: "Other event series" },
        },
      },
      dateRange: { title: "Dates" },
      yearHeaders: {
        upcoming: "(upcoming)",
        past: "(past)",
        noDate: "Date not set",
        larp: { singular: "larp", plural: "larps" },
      },
      role: {
        title: "Own role",
        choices: {
          EDITOR: "Has editing rights",
          CREATED_BY: "Created larp page",
          GAME_MASTER: "Game Master",
          TEAM_MEMBER: "Team member",
          VOLUNTEER: "Volunteer",
          PLAYER: "Player",
          FAVORITE: "Marked as favorite",
          LOCAL_SIGNUP_YES: "Signed up (yes)",
          LOCAL_SIGNUP_MAYBE: "Signed up (maybe)",
          LOCAL_SIGNUP_NO: "Signed up (no)",
        },
      },
    },
    yearHeaders: {
      upcoming: (year: number) => `Upcoming in ${year}`,
      past: (year: number) => `Past in ${year}`,
      noDate: "Date not set",
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
    tableFooter: (count: number, totalCount: number) => (
      <>
        Showing {count} request{count === 1 ? "" : "s"} (total {totalCount}).
      </>
    ),
    changes: {
      title: "Changes",
      createTitle: "New larp",
      noChanges: "No changes to larp fields.",
      rolesAdded: "Roles added",
      boolean: {
        true: "Yes",
        false: "No",
      },
      olderPendingWarning: (count: number) => (
        <>
          There {count === 1 ? "is" : "are"} {count} older unresolved request
          {count === 1 ? "" : "s"} for this larp. Please review the requests in
          order, starting from the oldest.
        </>
      ),
    },
    attributes: {
      createdAt: {
        title: "Request date",
      },
      action: {
        title: "Request action",
        choices: {
          CREATE: {
            title: "Create page",
          },
          UPDATE: {
            title: "Suggest changes",
          },
          CLAIM: {
            title: "Claim page",
          },
          DELETE: {
            title: "Delete page",
          },
          MERGE: {
            title: "Merge pages",
          },
        },
      },
      name: {
        title: "Name of the larp",
        unknown: "Name of the larp not set",
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
            label:
              "I am a Game Master of this larp or a main organizer of this event",
          },
          TEAM_MEMBER: {
            title: "Team member",
            label:
              "I am a member of the organizing team (working before the event)",
          },
          VOLUNTEER: {
            title: "Volunteer",
            label: "I am a volunteer, helper or NPC (working during the event)",
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
        title: "Added links",
      },
      removeLinks: {
        title: "Removed links",
      },
      addRelatedLarps: {
        title: "Added related larps",
      },
      removeRelatedLarps: {
        title: "Removed related larps",
      },
    },
    actions: {
      showAll: {
        title: "Also show resolved requests",
        active: "Showing all requests (including resolved ones)",
      },
      deleteAdminOnly: "Only admins can approve deletion requests.",
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
      mergedFrom: (_name: string, _id: string): string => {
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
    title: "Search",
    resultsTitle: "Search results for “{query}”",
    searchTerm: {
      title: "Search term",
      placeholder: "Search larps and pages",
    },
    submit: "Search",
    prompt:
      "Search finds larps by their name, tagline, description and fluff text, and info pages by their title and text. Words are matched in their inflected forms too.",
    pages: "Pages",
    larps: "Larps",
    noResults: "Nothing matches the search. Try fewer or different words.",
    showMore: "Show more larps",
    rateLimited:
      "Too many searches in a short time. Wait a moment and search again.",
  },
  User: {
    singleTitle: "User",
    listTitle: "Users",
    privacyWarning: (
      PrivacyPolicyLink: ({ children }: { children: ReactNode }) => JSX.Element,
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
    title: "My larps",
    lede: "Larps you organize, played or marked as favourite. Only you can see this list.",
    filters: {
      label: "Show",
      all: "All",
      organizing: "Organizing",
      played: "Played",
      favourites: "Favourites",
    },
    noDate: "Date not known",
    larpCount: (count: number) => `${count} larp${count === 1 ? "" : "s"}`,
    showMore: (count: number, year: number) =>
      `Show the other ${count} larp${count === 1 ? "" : "s"} of ${year}`,
    roleTags: {
      EDITOR: "Editor",
      CREATED_BY: "Added by you",
      GAME_MASTER: "GM",
      TEAM_MEMBER: "Team",
      VOLUNTEER: "Volunteer",
      PLAYER: "Player",
      FAVORITE: "Favourite",
      LOCAL_SIGNUP_YES: "Signed up",
      LOCAL_SIGNUP_MAYBE: "Maybe",
      LOCAL_SIGNUP_NO: "Not coming",
    },
    pendingEdits: "My pending edits",
    downloadCalendar: "Download my larps (.ics)",
    calendarName: "Larp.fi – My larps",
    empty: {
      all: "No larps here yet.",
      organizing: "You are not marked as an organizer of any larp.",
      played: "You have not marked any larp as played.",
      favourites: "You have no favourite larps yet.",
    },
    missing: {
      title: "Missing something?",
      message:
        "Mark larps as played or favourite on their pages. Organizer roles come from claiming a larp or from the moderators.",
      browse: "Browse all larps",
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
          TEAM_MEMBER: {
            title: "Team member",
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
          LOCAL_SIGNUP_YES: {
            title: "Signed up (yes)",
          },
          LOCAL_SIGNUP_MAYBE: {
            title: "Signed up (maybe)",
          },
          LOCAL_SIGNUP_NO: {
            title: "Signed up (no)",
          },
        },
      },
    },
    filters: {
      role: {
        title: "Role",
        default: "Default roles (GM, team member, volunteer or player)",
        all: "All roles",
      },
    },
  },
  Page: {
    listTitle: "Content pages",
    singleTitle: "Content page",
    editTitle: "Edit content page",
    newTitle: "New content page",
    deleteTitle: "Delete content page",
    deleteConfirmation:
      "The page and its header image will be deleted permanently. Pages in other languages are not affected.",
    attributes: {
      slug: {
        title: "Slug",
        helpText:
          "Lowercase letters, numbers and hyphens. A slug with a slash, such as larppaus/aloittaminen, is served at the root of the site (/larppaus/aloittaminen); other pages are served under /page/. Changing the slug breaks links to the old address.",
      },
      title: {
        title: "Title",
      },
      ingress: {
        title: "Ingress",
        helpText: "Shown in the page header, under the title.",
        frontPageHelpText: "Shown on the front page under the title.",
      },
      content: {
        title: "Content",
        helpText: "Shown below the page header.",
      },
      language: {
        title: "Language",
      },
      menuPosition: {
        title: "Position in the info menu",
        helpText:
          "Pages with a position appear in the “What is larp?” menu of their language, smallest first. Leave empty to keep the page out of the menu.",
      },
    },
    errors: {
      invalid:
        "The slug may only contain lowercase letters, numbers, hyphens and slashes between words.",
      reserved:
        "The slug may not start with a word that the site already uses for something else.",
      taken: "A page with this slug already exists in this language.",
      protected: "This page cannot be renamed or deleted.",
    },
    actions: {
      headerImage: {
        title: "Header image",
      },
      view: {
        title: "View page",
        label: "View",
      },
      newPage: {
        title: "Create a new content page",
        label: "New page",
      },
      create: {
        title: "Create page",
      },
      rename: {
        title: "Change slug",
      },
      delete: {
        title: "Delete page",
        label: "Delete",
      },
      cancel: {
        title: "Cancel",
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
  ContactPage: {
    title: "Contact us",
    contactForm: (
      <p>
        To contact the site administrator, please use the form below or send
        email to <em>larpit-fi ät tracon.fi</em>.
      </p>
    ),
  },
  LarpListPage: {
    eyebrow: "The archive",
    timeline: "Larps by year",
    yearBar: (year: number, count: string) =>
      `${year}: ${count} ${count === "1" ? "larp" : "larps"}`,
    chips: {
      type: {
        default: "Larps",
        other: "Other",
        all: "All",
        pick: "Types",
        selected: (count: number) => `${count} types`,
      },
      language: {
        all: "All",
      },
      cancelled: {
        hide: "Hide",
        show: "Show",
        only: "Only",
      },
    },
    larpCount: (count: string) =>
      `${count} ${count === "1" ? "larp" : "larps"}`,
    upcoming: "upcoming",
    past: "past",
    showOthers: (count: string, year: string) =>
      `Show the other ${count} ${count === "1" ? "larp" : "larps"} of ${year}`,
    showYear: (count: string, year: string) =>
      count === "1"
        ? `Show the larp of ${year}`
        : `Show the ${count} larps of ${year}`,
    showUndated: (count: string) =>
      `Show ${count} ${count === "1" ? "larp" : "larps"} without a date`,
    noDate: "Date not set",
    empty: "No larps match these filters.",
  },
  StatsPage: {
    title: "Statistics",
    eyebrow: "Larps in numbers",
    totals: {
      label: "Totals",
      pages: "Larps & events",
      years: (first: number, last: number) => `Years, ${first}–${last}`,
      thisYear: "Larps this year",
      upcoming: "Upcoming larps",
    },
    peakYear: (year: string, count: string) =>
      `The most larps were held in ${year} (${count}).`,
    larpCount: (count: string) =>
      `${count} ${count === "1" ? "larp" : "larps"}`,
    monthSummary: (
      busiest: string,
      busiestCount: string,
      quietest: string,
      quietestCount: string,
    ) =>
      `The busiest month is ${busiest} with ${busiestCount} larps; the quietest is ${quietest} with ${quietestCount}.`,
    weekSummary: (
      busiest: string,
      busiestCount: string,
      quietest: string,
      quietestCount: string,
    ) =>
      `The busiest week is week ${busiest} (${busiestCount}). The quietest is week ${quietest} (${quietestCount}).`,
    allMunicipalities: (count: string) => `All ${count} municipalities`,
    otherParticipants: "Other participants",
    openness: {
      title: "Signup openness",
      notRecorded: "Not recorded",
      unrecordedShare: (share: string) =>
        `${share} of larps do not record their openness yet.`,
    },
    shape: {
      title: "Shape of a larp",
      oneDay: "last one day",
      weekend: "are a full weekend, Fri–Sun",
      medianPlayerCharacters: (count: string, max: string) =>
        `player characters, median where known (${count} larps; largest ${max})`,
      medianTotalParticipants: (count: string, max: string) =>
        `participants in total, median where known (${count} larps; largest ${max})`,
      medianSignupWindow: (count: string) =>
        `days of signup, median where both ends are known (${count} larps)`,
      medianLeadTime: (count: string) =>
        `days from signup opening to the larp, median (${count} larps)`,
      description:
        "Each figure counts the larps where the information is known.",
    },
    message: (
      <>
        <p>
          This page contains fun and maybe useful statistics about larping in
          Finland.
        </p>{" "}
        <p>
          Please note that not all games ever played have been added to Larp.fi
          yet, so the actual number of games and participants is certainly
          higher.
        </p>{" "}
        <p>
          Unless otherwise stated, the figures include one-shot and campaign
          larps only. Other events and cancelled larps are excluded.
        </p>
      </>
    ),
    filters: {
      since: {
        title: "Time period",
        short: {
          ALL_TIME: "All",
          POST_COVID: "2022–",
          LAUNCH: "2026–",
        },
        choices: {
          ALL_TIME: "All time",
          POST_COVID: "Post-COVID era (2022–)",
          LAUNCH: "Since Larp.fi launch (2026–)",
        },
        lastTenYears: (first: number) =>
          `Last 10 full years and the current year (${first}–)`,
      },
    },
    attributes: {
      count: {
        title: "Count",
      },
      total: {
        title: "Total",
      },
      year: {
        title: "Year",
      },
      month: {
        title: "Month",
      },
      week: {
        title: "Week",
      },
    },
    reports: {
      type: {
        title: "Pages by type",
        description: <>All pages, including campaigns and other events.</>,
      },
      language: {
        title: "Larps by language",
      },
      year: {
        title: "Larps by year",
      },
      month: {
        title: "Larps by month",
      },
      week: {
        title: "Larps by week number",
        description: (
          <>A week is placed in the month its Saturday most often falls in.</>
        ),
      },
      municipality: {
        title: "Larps by municipality",
        attributes: {
          municipalityName: {
            title: "Municipality",
          },
        },
      },
      players: {
        title: "Number of participants by year",
        description: (
          <>
            Sum of the number of player characters and total participants in
            larps with known number of total participants. Please note that not
            all larps have this information available, so the actual number of
            participants is certainly higher.
          </>
        ),
      },
    },
  },
  CalendarPage: {
    title: "Calendar",
    navigation: {
      previousMonth: "Previous month",
      nextMonth: "Next month",
      goToMonth: "Jump to",
      go: "Go",
    },
    weekNumber: "Wk",
    weekNumberTitle: "Week number",
    today: "Today",
    jumpToToday: "Jump to today",
    keyboardShortcuts: {
      title: "Keyboard shortcuts:",
      changeMonth: "Change month",
    },
    monthNames: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    filters: {
      label: "Filter the calendar",
      all: "All",
      larps: "Larps",
      campaigns: "Campaigns",
      events: "Events",
      type: "Type",
      signup: "Signup",
      signupOpen: "Open",
      language: "Language",
      languages: {
        fi: "In Finnish",
        sv: "In Swedish",
        en: "In English",
      },
    },
    legend: {
      title: "Legend",
      signupOpen: "Signup open",
      openingSoon: "Opening soon",
      signupOverOrUnknown: "Signup over or unknown",
      event: "Convention, festival, meetup",
      cancelled: "Cancelled",
    },
    week: (weekNumber: number) => `Week ${weekNumber}`,
    noLarps: "No larps.",
    agendaFooter: "Month grid on wider screens",
    subscribe: {
      title: "Subscribe in your own calendar app",
      button: "Subscribe",
      urlLabel: "Calendar address",
      copy: "Copy",
      copied: "The calendar address has been copied to the clipboard.",
      help: "Updates automatically as larps are added. The feed always contains every larp, whatever the filters above.",
    },
  },
  LoginRequired: {
    eyebrow: "Sign in",
    title: "Login required",
    message: "You need to be logged in to see this page.",
    actions: {
      login: "Log in",
    },
  },
  ModeratorRequired: {
    eyebrow: "Moderators only",
    title: "Insufficient privileges",
    message: "You need moderator rights to see this page.",
  },
  AdminRequired: {
    eyebrow: "Admins only",
    title: "Insufficient privileges",
    message: "You need admin rights to see this page.",
  },
  GmRequired: {
    eyebrow: "Game masters only",
    title: "Insufficient privileges",
    message:
      "Only the game masters of this larp and moderators can see this page. If you are a GM of this larp, claim the page first.",
  },
  GatePage: {
    backToPage: "Back to the page",
  },
  NewVersionPage: {
    eyebrow: "Updated",
    title: "There is a new version of the Larp.fi site",
    lede: "Refresh the page to continue. Your latest changes were not saved.",
    reload: "Refresh the page",
  },
  NotFoundPage: {
    eyebrow: "404",
    title: "Page not found",
    lede: "The address may have a typo in it, or the page may have been removed.",
    frontPage: "Front page",
  },
  Navigation: {
    actions: {
      addLarp: "Add a larp",
      search: "Search larps",
      pages: "Content pages",
      moderate: "Moderate",
      manageUsers: "Users",
      aliases: "Short addresses",
    },
  },
  UserMenu: {
    ownLarps: "Own larps",
    preferences: "Preferences",
    signIn: "Sign in",
    signOut: "Sign out",
    usernameMissing: "Logged in",
  },
  Preferences: {
    title: "Preferences",
    save: "Save",
    attributes: {
      name: {
        label: "Display name",
        helpText: (
          <>
            Your name as it is displayed to others. At the moment this will be
            visible only to moderators. In the future we may add functionality
            where you may choose to be shown as eg. the GM of a larp.
          </>
        ),
      },
      editFormPreference: {
        label: "Larp editing form",
        helpText: (
          <>
            The compact form fits on a single screen and is faster to use once
            you are familiar with it. The full form guides you with help texts.
          </>
        ),
        choices: {
          FULL: "Full form",
          COMPACT: "Compact form",
        },
      },
      email: {
        label: "Email address",
        helpText: (
          <>
            Your email address connects your Kompassi account to your Larp.fi
            account. You cannot change it here. If you change your email address
            in your Kompassi profile, please ask the Larp.fi administrator to
            re-link your Larp.fi account to your Kompassi account if you want to
            keep it.
          </>
        ),
      },
    },
    dangerZone: {
      title: "Danger zone",
    },
    accountRemoval: {
      title: "Remove account",
      description: (
        <>
          Permanently remove your Larp.fi account. Larps you have created are
          not removed. Only your Larp.fi account is removed, not your Kompassi
          account. If you also want to remove your Kompassi account, please
          contact Kompassi support by email at <em>suunnistajat@kompassi.eu</em>
          . If you log in again with your Kompassi account, a new Larp.fi
          account will be created for you, but you will not regain the game
          master and other roles you had before removal. For security, removal
          requires confirmation by email.
        </>
      ),
      confirmationMessage: "Send a confirmation email to remove your account?",
      emailSent:
        "We have sent you an email with a link to confirm the removal of your account. Please check your inbox.",
    },
  },
  AccountRemovalPage: {
    title: "Remove account",
    confirm: {
      title: "Confirm account removal",
      message: (
        <>
          This permanently removes your Larp.fi account. Only your Larp.fi
          account is removed, not your Kompassi account. Larps you have created
          are not removed. This cannot be undone.
        </>
      ),
      submit: "Remove my account",
      confirmationMessage:
        "Permanently remove your Larp.fi account? This cannot be undone.",
    },
    invalidToken: {
      title: "Link expired or invalid",
      message: (
        <>
          This account removal link is invalid or has expired. Please request
          account removal again from your preferences if you still want to
          remove your account.
        </>
      ),
    },
  },
  AppBar: {
    mainNavigation: "Main",
    search: "Search",
    menu: "Menu",
    closeMenu: "Close menu",
    accountMenu: "Account menu",
    myLarps: "My larps",
    played: "Larps I’ve played",
    favourites: "Favourites",
    pendingEdits: "My pending edits",
    profile: "Profile & visibility",
    editInKompassi: "Edit name or email in Kompassi",
    theme: "Theme",
    themeChoices: { auto: "Auto", night: "Night", day: "Day" },
    language: "Language",
    languageAndTheme: "Language and theme",
    administration: "Administration",
    infoMenu: "What is larp?",
  },
  Footer: {
    privacyPolicy: "Privacy policy",
    source: "Source on GitHub",
    api: "API",
    note: "Crowd-sourced, volunteer-run.",
  },
  CommandPalette: {
    title: "Search and commands",
    inputLabel: "Search larps or type a command",
    placeholder: "Search larps, pages and commands…",
    commandsHint: "commands",
    close: "Cancel",
    larps: "Larps",
    pages: "Pages",
    allResults: "All results for “{query}”",
    thisPage: "This page",
    everywhere: "Everywhere",
    recent: "Recent",
    noResults: "No larps match.",
    resultCount: "{shown} of {total}",
    footerMove: "move",
    footerOpen: "open",
    footerNewTab: "new tab",
    footerTip: "words from the name or description work",
    pill: {
      cancelled: "Cancelled",
      inviteOnly: "Invite only",
      openUntil: "Open until {date}",
      openIndefinitely: "Signup open",
      opens: "Opens {date}",
      over: "Signup over",
    },
    commands: {
      headerImage: "Change the header image",
      addLarp: "Add a larp",
      calendar: "Go to calendar",
      allLarps: "Browse all larps",
      stats: "Statistics",
      themeToNight: "Switch to dark theme",
      themeToDay: "Switch to light theme",
      switchLanguage: "Vaihda suomeksi",
      editLarp: "Edit this larp",
      addRelated: "Add a related larp",
      claim: "Claim this page as GM",
      addToCalendar: "Add to calendar",
      mergeDuplicate: "Merge a duplicate into this larp",
      copyLink: "Copy link to this larp",
      share: "Share…",
      subscribe: "Subscribe to the calendar",
      jumpToToday: "Jump to today",
      copied: "Link copied",
    },
    commandSynonyms: {
      "global:addLarp": [
        "New larp",
        "Create a larp",
        "Submit a larp",
        "Add an event",
      ],
      "global:calendar": [
        "Calendar",
        "Upcoming larps",
        "Event calendar",
        "What's on",
      ],
      "global:allLarps": [
        "Larp list",
        "All larps",
        "Archive",
        "Past larps",
        "Larps by year",
      ],
      "global:stats": ["Stats", "Numbers", "Charts", "Larps per year"],
      "global:theme": [
        "Dark mode",
        "Light mode",
        "Night mode",
        "Day mode",
        "Colours",
        "Appearance",
      ],
      "global:language": [
        "Language",
        "Switch language",
        "Finnish",
        "Suomi",
        "Kieli",
      ],
      "larp:editLarp": [
        "Change larp details",
        "Update this larp",
        "Fix information",
        "Correct this larp",
      ],
      "larp:addRelated": [
        "Relations to other larps",
        "Link larps",
        "Sequel",
        "Campaign",
        "Series",
        "Rerun",
      ],
      "larp:copyLink": ["URL", "Permalink", "Address"],
      "larp:share": ["Send to a friend", "Share link"],
      "larp:claim": [
        "I am the GM",
        "Game master",
        "Organiser",
        "Take over this page",
      ],
      "larp:headerImage": ["Cover image", "Banner", "Picture", "Photo"],
      "larp:addToCalendar": [
        "iCal",
        "Calendar file",
        "Save the date",
        "Remind me",
      ],
      "larp:mergeDuplicate": ["Duplicate", "Combine pages", "Same larp twice"],
      "calendar:subscribe": [
        "Calendar feed",
        "iCal",
        "Webcal",
        "Google Calendar",
        "Sync calendar",
      ],
      "calendar:jumpToToday": ["Today", "This month", "Now"],
    } as Record<string, string[]>,
  },
  HeaderImage: {
    title: "Header image",
    ledeLarp:
      "A picture shown behind the title of the larp page. Game masters and moderators can change it.",
    ledePage: "A picture shown behind the title of this page.",
    fields: {
      file: {
        label: "Picture",
        help: "JPEG, PNG, WebP or AVIF, at most 25 MB, at least 1200 px wide",
      },
      crop: {
        label: "Crop",
        zoom: "Zoom",
        dragHint:
          "Drag the picture to choose what shows in the banner. The arrow keys move it too. On narrow screens the sides are cut off.",
        tooSmall: "Crop is {width} px wide; 1200 px is recommended",
      },
      photographerCredit: {
        label: "Photographer",
        help: "Shown in the corner of the picture. Required.",
      },
    },
    actions: {
      choose: "Choose a picture",
      upload: "Upload",
      save: "Save",
      remove: "Remove header image",
      removeConfirm: "Remove the header image? The picture will be deleted.",
      replace: "Replace picture",
      cancel: "Cancel",
      openLightbox: "Show the whole picture",
      closeLightbox: "Close",
    },
    status: {
      uploading: "Uploading… {percent} %",
      processing: "Processing…",
      saved: "Header image saved.",
      removed: "Header image removed.",
    },
    errors: {
      tooLarge: "The file is larger than 25 MB.",
      tooManyPixels: "The picture has more than 40 megapixels.",
      tooSmall: "The picture must be at least 1200 px wide.",
      unsupported: "Only JPEG, PNG, WebP and AVIF pictures are supported.",
      network: "The upload failed. Check your connection and try again.",
      forbidden: "You are not allowed to change this header image.",
      disabled: "Header images are not enabled on this server.",
      unknown: "Something went wrong. Please try again.",
    },
    credit: "Photo: {credit}",
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
