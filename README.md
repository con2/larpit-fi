# Larpit.fi

[Larpit.fi](https://larpit.fi) is a crowd-sourced archive of past and future larps organized in Finland, by Finns, or having a significant Finnvasion.

## Technologies used

* PostgreSQL
* Node.js
* TypeScript
* Next.js
* React
* Prisma.io

## Getting started

Have PostgreSQL, Node.js (22+) and VS Code.

Install deps:

```
npm install
```

Create an `.env` file not unlike the following:

```ini
DATABASE_URL=postgresql://japsu@localhost/larpit
NEXTAUTH_URL=http://localhost:3158
AUTH_SECRET=eeeee
SMTP_HOSTNAME=smtp.ethereal.email
SMTP_USERNAME=youraccount@ethereal.email
SMTP_PASSWORD=yourpassword
```

See `src/config.ts` for available environment variables.

If you want to see how the HTML email messages look like, get a throwaway SMTP account at [ethereal.email](https://ethereal.email). If you leave `SMTP_HOSTNAME` unset, email text content is logged at the terminal.

You may want to create the database beforehand with the `createdb` command to get strings to sort properly according to Finnish sort order (ÅÄÖ at the end of the alphabet and not with AAO):

```bash
createdb --locale-provider icu --locale fi_FI.UTF-8 --icu-locale fi_FI --template template0
```
or via `psql`
```sql
create database larpit
locale_provider icu
icu_locale 'fi-FI'
locale 'fi_FI.UTF-8'
template template0
```

Start the development environment with

```
npm run dev
```

You can add some larps to the database with

```
npm run db:seed
```

Now open <http://localhost:3158> in your browser. Log in with your [dev.kompassi.eu](https://dev.kompassi.eu) account.

## Features/TODO list

### Next priorities (as of 2025-11-15)

- [x] Upgrade to Prisma 7
- [ ] Import kalenteri.larp.fi content
- [x] Import Myssy megatable
- [x] Arrange larp details on larp page as some sort of details/properties card
  - [x] Put signup starts/ends on larp page
- [ ] List moderators and admins
- [ ] Support requests / contact form
  - [ ] There is a problem with this page that cannot be rectified by suggesting an edit
  - [ ] I am a journalist or researcher and want to speak to an expert about larp
  - [ ] I need to contact the GM of a larp
  - [ ] I want to give feedback about the site
- [ ] Enhanced moderation (show what was changed)
- [ ] Related larps

### Known bugs / good first issues :)

- [ ] Add/edit larp: Fluff text has a relatively low length limit of 2000 characters and there is no physical limitation on the form field. If the length is exceeded, a nondescript error message (”An application error has occurred…”) will be shown. Solve by creating a `<TextArea>` component that has a JavaScript-based length limit (and possibly a `1337/2000` character count display). Bonus points for `setCustomValidity`.

### Unsorted feature list

- [ ] Enhanced larp page
  - [ ] Visual layout of larp page: How to show all the data but at the same time make the page aesthetically pleasing and readable?
  - [ ] Author (as opposed to organizer)
  - [ ] Age limits
  - [ ] Intended audience? (-> tagging/categories?)
  - [ ] Hide signup link (/suggest not to enter) if targeted?
  - [ ] Should related users be shown somehow?
    - [ ] GM preference
    - [ ] Override how GMs are displayed
  - [ ] Edit history (shown to moderators & GM)
  - [ ] "You have 2 edits to this larp page pending moderation."
    - [ ] "Show page as it will be once these edits are approved"
- [ ] Enhanced larp list view
  - [ ] Sort and filter
    - [x] Type
    - [x] Language
    - [ ] Year
  - [ ] Group by year (other groupings?)
  - [ ] Number of characters/participants
  - [x] Language
  - [ ] Openness
  - [ ] Pagination
- [ ] Tagging, hierarchy of categories
  - [ ] Freeform tags
  - [ ] Promoting freeform tags into a curated hierarchy
- [ ] Create re-run of a larp, or run of multi-run larp, prefilling details
- [ ] Enhanced user management
  - [ ] List of requests by the user
  - [ ] List of larps the user is involved with
  - [ ] (Shadow?)ban user
  - [ ] (Shadow?)ban email address
  - [ ] Autoreject requests by banned users
- [ ] Enhanced / specific UX for the claim (now uses the edit UX)
- [ ] Enable non logged in users to make suggestions (currently requires login)
  - [ ] Email confirmation required for each suggestion
- [ ] GM processes suggested edits for claimed larp pages
  - [ ] GM preference if they want to do this themselves?
- [ ] Subscribeable calendar resource (ICS)
- [ ] Public data API (REST/JSON)
- [ ] Own larps
  - [ ] Filter own larps list by role
  - [ ] "I played this larp" button on larp page for logged in users
  - [ ] Favorite button on larp page for logged in users
  - [ ] Public player list (if set as public by GM)
- [ ] GM preference: edits handled by GM or by moderator
- [ ] Contact GM button?
  - [ ] GM preference
- [ ] English translation of privacy policy
- [ ] Email notifications
  - [ ] To GM
    - [ ] An edit is suggested that ought to be moderated by the GM
  - [ ] To moderators
    - [ ] An edit is suggested that ought to be moderated by a moderator (nightly digest?)
  - [ ] To admin
    - [ ] A user removed their account
  - [ ] To users
    - [ ] New games with open signup added
    - [ ] Weekly/monthly newsletter?
- [ ] Make venue a first class citizen (currently only a text field)
- [ ] Statistics! (total larps, larp per year etc.)
- [ ] Moderator needs to be able to set alias for larp
- [ ] Organizations (that organize larps)
- [ ] User profile page with visibility toggle
- [ ] Move backlog to GitHub Projects
- [ ] Spike of Drizzle as DB layer instead of Prisma
- [ ] Larppikuvat.fi integration
  - [x] Public API in larpit.fi providing basic public information of larp
  - [ ] In larppikuvat.fi, introduce a field for external metadata URL in album
    - [ ] If it's a larpit.fi page, generate album body from meowth (name of larp, fluff text, description, homepage url, larpit.fi url)
  - [ ] When a public photo album of a larp is added in larppikuvat.fi: Add it as a photo link in larpit.fi
  - [ ] When description, fluff text or home page are updated in larpit.fi: Update meowth in larppikuvat.fi
  - [ ] `<link rel="???">` JSON/LD / Schema.org Event
