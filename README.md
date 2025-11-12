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
DATABASE_URL=postgresql://japsu@localhost/larpit?schema=larpit
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

### Next priorities (as of 2025-08-19)

- [ ] Adding homepage, player's guide etc. URLs when creating a larp page
- [ ] Suggesting edits
- [ ] Claiming a page as the GM
- [ ] Support requests

### Unsorted feature list

- [x] Front page
  - [x] Listing of past and future larps
  - [x] Emphasize those which have signup open
- [x] Larp page
  - [x] Display basic details such as date, location, fluff, description, tagline
  - [x] Display links to home page, player guide, social media etc. external resources
  - [x] Display relations between larps (eg. rerun, sequel)
  - [x] Links to claim the larp page or suggest an edit
  - [x] Type of larp
  - [ ] Number of players
  - [ ] Author (as opposed to organizer)
  - [ ] Age limits
  - [ ] Intended audience? (-> tagging/categories?)
  - [ ] Signup openness (public/targeted/invite only)
  - [ ] Should related users be shown somehow?
    - [ ] GM preference
    - [ ] Override how GMs are displayed
  - [ ] Edit history (shown to moderators & GM)
  - [ ] "You have 2 edits to this larp page pending moderation."
    - [ ] "Show page as it will be once these edits are approved"
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
  - [ ] List of requests by the user
  - [ ] List of larps the user is involved with
  - [ ] (Shadow?)ban user
  - [ ] (Shadow?)ban email address
  - [ ] Autoreject requests by banned users
- [ ] Claiming a larp page (by the GM)
  - [ ] Logged in user makes the claim
  - [ ] Non logged in user makes the claim (UNSUPPORTED?)
  - [ ] Admin processes the claim
- [x] Suggesting an edit
  - [x] Logged in user makes a suggestion
  - [ ] Non logged in user makes a suggestion
    - [ ] Email confirmation required for each suggestion
  - [x] Moderator processes suggested edits for non claimed larp pages
  - [ ] GM (or admin) processes suggested edits for claimed larp pages
- [ ] Subscribeable calendar resource (ICS)
- [ ] Public data API (REST/JSON)
- [ ] Own larps
  - [x] Own larps list in profile
  - [ ] Filter own larps list by role
  - [ ] "I played this larp" button on larp page for logged in users
  - [ ] Favorite button on larp page for logged in users
  - [ ] Public player list (if set as public by GM)
- [ ] Import larps en masse
  - [ ] Import larppi.xlsx
  - [x] Import larps and series from larppikuvat.fi
  - [ ] Ask Rai if we can scrape or emfederate kalenteri.larp.fi
- [ ] Support requests
  - [ ] There is a problem with this page that cannot be rectified by suggesting an edit
  - [ ] I am a journalist or researcher and want to speak to an expert about larp
  - [ ] I need to contact the GM of a larp
  - [ ] I want to give feedback about the site
- [ ] Launch in X-con
  - [x] Scream test concept with pilot group before X-con
  - [x] Powerpoint presentation
- [x] Deployment on QB
  - [x] Staging environment (<https://dev.larpit.fi>)
  - [x] Production environment (<https://larpit.fi>)
- [ ] GM preference: edits handled by GM or by moderator
- [ ] Contact GM button?
  - [ ] GM preference
- [x] Write proper privacy policy (Tracon.fi Wordpress)
  - [ ] English translation
- [ ] Move backlog to GitHub Projects

### Ideas/unsorted items from Illusia evening 15 August 2025

- [ ] Larp list view
  - [ ] Sort and filter
- [ ] Tagging, hierarchy of categories
  - [ ] Freeform tags
  - [ ] Promoting freeform tags into a curated hierarchy
- [ ] Email notifications
  - [ ] To GM
    - [ ] An edit is suggested that ought to be moderated by the GM
  - [ ] To moderators
    - [ ] An edit is suggested that ought to be moderated by a moderator (nightly digest?)
  - [ ] To admin
    - [ ] A user removed their account
- [ ] Organizations (that organize larps)
- [ ] Venues
- [ ] Statistics! (total larps, larp per year etc.)
- [ ] Moderator needs to be able to set alias for larp
