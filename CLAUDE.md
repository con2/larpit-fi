# CLAUDE.md / copilot-instructions.md

This file provides guidance to AI agents when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3158 (runs prisma migrate + Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test:integration  # Run integration tests (requires TEST_DATABASE_URL)
npm run email:dev    # Email template preview on port 3159
```

To run a single test file:
```bash
npx vitest run src/models/ModerationRequest.integration.test.ts
```

Database:
```bash
npm run db:migrate   # Deploy pending migrations
npm run db:reset     # Reset and re-run all migrations
npm run db:seed      # Seed with example data
```

## Architecture

**Next.js 15 App Router** with locale-prefixless routing (`[locale]` segment, locale inferred from request via next-intl middleware). All pages live under `src/app/[locale]/`.

**Data flow:** Pages are server components that query Prisma directly. Form submissions and mutations are handled by server actions. Client components are used only where interactivity is needed, or for performance.

**Authentication:** next-auth v4 with Kompassi OIDC. Users start as `NOT_VERIFIED` and must be approved by a moderator. Moderation submissions create `ModerationRequest` records; approved edits are applied to the main tables.

**Translations:** `src/translations/en.tsx` is the source of truth and defines the `Translations` type. `src/translations/fi.tsx` implements that type. Translations are TypeScript objects (not JSON) and can contain JSX. Access via `getTranslations(locale)` on the server. Functions and JSX cannot be passed to client components, which may limit some translations to JSON serializable ones.

**Prisma:** Schema at `prisma/schema.prisma`. Generated client outputs to `src/generated/prisma/` — never edit generated files. Use `prisma.$queryRaw` for aggregate queries (COUNT, SUM, etc.) rather than fetching and counting in JS.

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
