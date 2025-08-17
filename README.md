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
DATABASE_URL=postgres://japsu@localhost/larpit?schema=larpit
NEXTAUTH_URL=http://localhost:3158
AUTH_SECRET=eeeee
SMTP_HOSTNAME=smtp.ethereal.email
SMTP_USERNAME=youraccount@ethereal.email
SMTP_PASSWORD=yourpassword
```

See `src/config.ts` for available environment variables.

Note that `?schema=larpit` is mandatory (Prisma hardcodes it in migrations). Otherwise you may pick the database name, username etc. freely.

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

- [x] Front page
  - [x] Listing of past and future larps
  - [x] Emphasize those which have signup open
- [x] Larp page
  - [x] Display basic details such as date, location, fluff, description, tagline
  - [x] Display links to home page, player guide, social media etc. external resources
  - [x] Display relations between larps (eg. rerun, sequel)
  - [x] Links to claim the larp page or suggest an edit
  - [ ] Type of larp
  - [ ] Number of players
  - [ ] Author (as opposed to organizer)
  - [ ] Age limits
  - [ ] Intended audience? (-> tagging/categories?)
  - [ ] Should related users be shown somehow?
    - [ ] GM preference
    - [ ] Override how GMs are displayed
- [ ] Adding a larp
  - [x] Larp form skellington
  - [x] Add signup starts/ends dates to larp form
  - [ ] Encap larp form into a component
  - [x] Non logged in user makes a request
    - [x] Email confirmation required
  - [x] Logged in user makes a request
  - [x] Requests from logged in users having created larps previously automatically approved
  - [x] Moderator approval for requests from non logged in users
  - [ ] Create re-run of a larp, or run of multi-run larp, prefilling details
- [x] Logging in with Kompassi
- [x] Moderation requests page
  - [x] Show pending edit requests as notification balloon
  - [x] Post-moderate automatically approved requests
- [ ] User management
  - [x] Make user a moderator or an admin
  - [ ] Make user a GM of a larp
  - [ ] Shadowban user or email
    - [ ] Admin can shadowban a user or email
    - [ ] Requests by them get autorejected
  - [ ] List of requests by the user
  - [ ] List of larps the user is involved with
- [ ] Claiming a larp page (by the GM)
  - [ ] Logged in user makes the claim
  - [ ] Non logged in user makes the claim (UNSUPPORTED?)
  - [ ] Admin processes the claim
- [ ] Suggesting an edit
  - [ ] Logged in user makes a suggestion
  - [ ] Non logged in user makes a suggestion
    - [ ] Email confirmation required for each suggestion
  - [ ] Moderator processes suggested edits for non claimed larp pages
  - [ ] GM (or admin) processes suggested edits for claimed larp pages
- [ ] Subscribeable calendar resource (ICS)
- [ ] Public data API (REST/JSON)
- [ ] Own larps
  - [ ] Own larps list in profile
  - [ ] "I played this larp" button on larp page for logged in users
  - [ ] Favorite button on larp page for logged in users
  - [ ] Public player list (if set as public by GM)
- [ ] Import larps en masse
  - [ ] Import larppi.xlsx
  - [ ] Import larps and series from larppikuvat.fi
  - [ ] Ask Rai if we can scrape or emfederate kalenteri.larp.fi
- [ ] Support requests
  - [ ] I want this page gone
- [ ] Launch in X-con
  - [ ] Scream test concept with pilot group before X-con
  - [ ] Powerpoint presentation
- [ ] Deployment on QB
  - [x] Staging environment
  - [ ] Production environment
- [ ] GM preference: edits handled by GM or by moderator
- [ ] Contact GM button?
  - [ ] GM preference
- [ ] Write proper privacy policy (Tracon.fi Wordpress)

### Ideas/unsorted items from Illusia evening 15 August 2025

- [ ] Larp list view
  - [ ] Sort and filter
- [ ] Tagging, hierarchy of categories
  - [ ] Freeform tags
  - [ ] Promoting freeform tags into a curated hierarchy
- [ ] Email notifications
- [ ] Organizations (that organize larps)
- [ ] Venues
- [ ] Statistics! (total larps, larp per year etc.)
