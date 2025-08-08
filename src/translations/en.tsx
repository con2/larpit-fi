import { JSX, ReactNode } from "react";

const translations = {
  brand: "Larpit.fi",
  Home: {
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
          Anyone can <AddLarpLink>add a larp to the site</AddLarpLink> – you do
          not have to be the organizer or GM to do so! Your first larp
          submission will be pre-moderated, and subsequent changes will be
          post-moderated. The GM can take ownership of the larp page.
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
        <p>See also:</p>
        <ul>
          <li>
            <a href="https://larp.fi" rel="noopener noreferer" target="_blank">
              Larp.fi
            </a>
            – What is larp?
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
    links: {
      HOMEPAGE: "Home page of the larp",
      PHOTOS: "Photos from the larp",
      SOCIAL_MEDIA: "Social media",
    },
    actions: {
      claim: {
        title: "Are you the GM or organizer? Claim this page!",
        label: "Claim",
        message: (
          <>
            <p>
              The GM or organizer of this larp has not yet claimed the page.
              Only basic information about the larp is shown.
            </p>
            <p>
              By claiming this page, you can edit the larp information, add
              links to social media and photos etc.
            </p>
            <p>
              We will verify your claim through our network of larp organizers
              to ensure that you are indeed the GM or organizer of this larp.
            </p>
          </>
        ),
      },
    },
  },
  Navigation: {
    actions: {
      addLarp: "Add a larp",
    },
  },
};

export type Translations = typeof translations;
export default translations;
