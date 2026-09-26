# CLAUDE.md / copilot-instructions.md

This file provides guidance to AI agents when working with code in this repository.

## Terminology

- _larp_ is both a countable noun (meaning a single larp event or "game") and uncountable noun (meaning larp as a hobby and form of art). Do not treat it as an acronym.

## Commands

```bash
npm run dev          # Start dev server on port 3158 (no automatic migrations)
npm run build        # Production build (emits the contract first)
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test:integration  # Run integration tests (requires TEST_DATABASE_URL)
npm run email:dev    # Email template preview on port 3159
```

To run a single test file:

```bash
npx vitest run --config vitest.integration.config.ts src/models/ModerationRequest.integration.test.ts
```

Database:

```bash
npm run db:migrate:dev      # Apply pending migrations to the dev database and advance the `db` ref
npm run db:plan -- <slug>   # Emit the contract and plan a migration from the contract diff
npm run db:migrate          # Apply pending migrations (what the deploy init container does)
npm run db:verify           # Check that the database matches the contract
npm run db:load             # Mirror the public larps of larpit.fi into the database (or --api <url>)
```

## Architecture

**Next.js 15 App Router** with locale-prefixless routing (`[locale]` segment, locale inferred from request via next-intl middleware). All pages live under `src/app/[locale]/`.

**Data flow:** Pages are server components that query Prisma directly. Form submissions and mutations are handled by server actions. Client components are used only where interactivity is needed, or for performance.

**Authentication:** Auth.js v5 (`next-auth` 5.x) with Kompassi OIDC and JWT sessions, no adapter (`src/auth.ts`). On sign-in the Kompassi subject is matched to a `user` row through the `account` table, falling back to the email address, and the user id lands in the JWT. Pages look the user up by email through `getUserFromSession`, so role changes apply immediately. Users start as `NOT_VERIFIED` and must be approved by a moderator. Moderation submissions create `ModerationRequest` records; approved edits are applied to the main tables.

**Translations:** `src/translations/en.tsx` is the source of truth and defines the `Translations` type. `src/translations/fi.tsx` implements that type. Translations are TypeScript objects (not JSON) and can contain JSX. Access via `getTranslations(locale)` on the server. Functions and JSX cannot be passed to client components, which may limit some translations to JSON serializable ones.

**Prisma 8 (prisma-next), which is not Prisma 7.** Read `node_modules/@prisma/orm-postgres/skills/prisma-8/SKILL.md` and its `references/` before touching the contract, migrations or queries. Key points:

- Contract source: `src/prisma/contract.prisma`. After editing, `prisma contract emit` regenerates `contract.json` + `contract.d.ts` (committed, never hand-edited).
- Queries: `db.orm.public.<Model>` from `src/prisma/db.ts`. Enum values come from `src/prisma/enums.ts`, row types from `src/prisma/models.ts`. Raw SQL goes through the `sql` tag and `query`/`execute` in `src/prisma/sql.ts` (parameters become `$n` placeholders), or `pool.query` for hand-built statements. Use raw SQL for aggregate queries (COUNT, SUM, etc.) rather than fetching and counting in JS; note that `pg` returns bigint aggregates as strings.
- Unique fields are real constraints, so `upsert({ conflictOn: { email } })` works for them; the
  two partial unique indexes on `unauthenticated_signup` are not targetable that way.
- Timestamps: the ORM reads and writes `timestamptz` columns as ISO strings. The app works with `Date`, so pass rows through `parseDates` when reading and `formatDates`/`iso` when writing (`src/prisma/dates.ts`). Every timestamp column is listed there by field name. The larp dates (`startsAt`, `endsAt`, `signupStartsAt`, `signupEndsAt`) are `date` columns and stay `YYYY-MM-DD` strings; the helpers in `src/models/Larp.client.ts` turn them into instants wherever they are compared with now.
- The ORM cannot order with `NULLS LAST` or by a field of an included relation; sort in JS (`compareNullsLast`) or page ids in SQL, as `src/app/api/larp/route.ts` does.
- Migrations are TypeScript packages under `migrations/app/`; `ops.json` is compiled by running the migration file (`node migrations/app/<dir>/migration.ts`), never edited by hand. `migration plan` chains from the `db` ref (`migrations/app/refs/db.json`), which `db:migrate:dev` advances.
- Production applies migrations with `src/bin/migrate.mjs` (ORM command family only) from the `-migrate` image. A database that predates Prisma 8 must be signed once at the baseline migration; see `chart/README.md`.
- Prisma only appends native enum values: add new values at the end of the enum.
- `pg` and `@types/pg` stay pinned to the versions the Prisma runtime bundles.
- The CLI's "Prisma agent skills are out of date" warning is expected: skills are read from
  `node_modules`, and `prisma skills sync` (which copies them into four harness directories) is
  not used here.

## Code conventions

- Write SQL keywords in lower case.
- Remove props, types, and code that become redundant after refactoring.
- The `@/*` path alias maps to `src/*`.

## Test database setup

Integration tests require a PostgreSQL database with ICU locale support for correct Finnish sorting (ÅÄÖ at end of alphabet):

```bash
createdb --locale-provider icu --locale fi_FI.UTF-8 --icu-locale fi-FI --template template0 larpit_test
```

Set `TEST_DATABASE_URL` in your environment before running tests.

## Version control (Git)

Commit only when instructed to.

Paths containing braces, such as `src/app/[locale]/page.tsx`, need to be quoted on command lines such as `git add "src/app/[locale]/page.tsx"`.

## Important caveats

- If you start adding municipalities outside Finland to the `Municipality` model, there is a hard-coded country in `LarpJsonLd` that you need to fix to come from the `Country` model. The concept of municipality may also not transfer as-is to other countries.

## Worktree use

When working in a Git worktree:

- USE `PORT=30xx` to avoid colliding with the main working copy that uses `PORT=3000`. Select `xx` randomly.
- For now, the database is shared between worktrees for realistic test data. Warn me about doing schema changes in a worktree.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
