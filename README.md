# Larpit.fi

[Larpit.fi](https://larpit.fi) is a crowd-sourced archive of past and future larps organized in Finland, by Finns, or having a significant Finnvasion.

## Technologies used

- PostgreSQL
- Node.js
- TypeScript
- Next.js
- React
- Prisma.io

## Getting started

Have PostgreSQL, Node.js (22+) and VS Code.

Install deps:

```
npm install
```

Create an `.env` file not unlike the following:

```ini
DATABASE_URL=postgresql://yourusername@localhost/larpit
TEST_DATABASE_URL=postgresql://yourusername@localhost/larpit_test
AUTH_URL=http://localhost:3158
AUTH_SECRET=eeeee
SMTP_HOSTNAME=smtp.ethereal.email
SMTP_USERNAME=youraccount@ethereal.email
SMTP_PASSWORD=yourpassword
```

See `src/config.ts` for available environment variables.

If you want to see how the HTML email messages look like, get a throwaway SMTP account at [ethereal.email](https://ethereal.email). If you leave `SMTP_HOSTNAME` unset, email text content is logged at the terminal.

Create the database beforehand with the `createdb` command to get strings to sort properly according to Finnish sort order (ÅÄÖ at the end of the alphabet and not with AAO):

```bash
createdb --locale-provider icu --locale fi_FI.UTF-8 --icu-locale fi-FI --template template0 larpit
createdb --locale-provider icu --locale fi_FI.UTF-8 --icu-locale fi-FI --template template0 larpit_test
```

or via `psql`

```sql
create database larpit
locale_provider icu
icu_locale 'fi-FI'
locale 'fi_FI.UTF-8'
template template0;

create database larpit_test
locale_provider icu
icu_locale 'fi-FI'
locale 'fi_FI.UTF-8'
template template0;
```

Bring the database to the current contract, then start the development server:

```
npm run db:migrate:dev
npm run dev
```

An empty database is dull. Mirror the public larps of larpit.fi into it with

```
npm run db:load
```

Now open <http://localhost:3158> in your browser. Log in with your [dev.kompassi.eu](https://dev.kompassi.eu) account.

### Header images (optional)

Header images of larp pages and content pages are stored in S3. Without `S3_BUCKET` the feature
is hidden. To try it locally, start a single-node Garage with Docker and create its bucket and key:

```
docker compose up -d && scripts/garage-init.sh
```

Paste the printed `S3_*` lines into `.env`, then let the browser upload to the bucket from the
origin in `AUTH_URL` (further origins go as arguments):

```
npm run s3:setup
```

### Running tests

**Integration tests** try to test key business logic against an actual database. Run these with

```
npm run test:integration
```

See above for creating the `larpit_test` database.

## Backlog

See the [Larpit.fi project](https://github.com/orgs/con2/projects/15) and [issues](https://github.com/con2/larpit-fi/issues).
