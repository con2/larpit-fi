# Larpit.fi

Larpit.fi is a crowd-sourced archive of past and future larps organized in Finland, by Finns, or having a significant Finnvasion.

## Features/TODO list

- [x] Front page
  - [x] Listing of past and future larps
  - [x] Emphasize those which have signup open
- [x] Larp page
  - [x] Display basic details such as date, location, fluff, description, tagline
  - [x] Display links to home page, player guide, social media etc. external resources
  - [x] Display relations between larps (eg. rerun, sequel)
  - [x] Links to claim the larp page or suggest an edit
  - [ ] Should related users be shown somehow?
    - [ ] GM preference
    - [ ] Override how GMs are displayed
- [ ] Adding a larp
  - [x] Larp form skellington
  - [ ] Add signup starts/ends dates to larp form
  - [ ] Encap larp form into a component
  - [ ] Non logged in user makes a request
    - [ ] Email confirmation required
  - [ ] Logged in user makes a request
  - [ ] Requests from logged in users having created larps previously automatically approved
  - [ ] Moderator approval for requests from non logged in users
  - [ ] Create re-run of a larp, or run of multi-run larp, prefilling details
- [ ] Logging in with Kompassi
- [ ] Admin menu
  - [ ] Show pending edit requests as notification balloon
- [ ] User management
  - [ ] Make user a moderator or an admin
  - [ ] Make user a GM of a larp
  - [ ] Shadowban user or email
    - [ ] Admin can shadowban a user or email
    - [ ] Requests by them get autorejected
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
  - [ ] Staging environment
  - [ ] Production environment
- [ ] GM preference: edits handled by GM or by moderator
- [ ] Contact GM button?
  - [ ] GM preference

## Getting started

Have PostgreSQL, Node.js (22+) and VS Code.

Install deps:

```
npm install
```

Create an `.env` file not unlike the following:

```ini
DATABASE_URL="postgres://japsu@localhost/larpit?schema=larpit"
NEXTAUTH_URL="http://localhost:3158"
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
