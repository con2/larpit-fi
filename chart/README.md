# larpit Helm chart

Deploys larpit.fi: a Next.js Deployment (with a Prisma migration init container), the hourly
Larppikuvat.fi sync CronJob, a per-namespace Gateway with HTTPRoutes, and a cert-manager
Certificate. `.github/workflows/cicd.yaml` runs `helm upgrade --install larpit chart` into
`larpit-production` on every push to main.

## Images

`docker-bake.hcl` builds three images from the Dockerfile, all tagged with the short commit SHA:

- `ghcr.io/con2/larpit-fi:<sha>`: the Next.js standalone server.
- `ghcr.io/con2/larpit-fi:<sha>-migrate`: the migration init container, with only the Prisma
  ORM engine packages and the migrations.
- `ghcr.io/con2/larpit-fi:<sha>-builder`: the full build stage with `node_modules` and `src`.
  The sync CronJob runs from it, because the standalone image has no `src/bin`.

## Migrations

The init container runs `migration check` and `db migrate` (`src/bin/migrate.mjs`, the ORM
command family only). `db migrate` replays the on-disk migration graph from the database's
marker; it never plans anything itself.

### One-time cutover from Prisma 7

The Prisma 7 migration history (`_prisma_migrations`) is unknown to Prisma 8, so a database that
predates the Prisma 8 build has no marker and `db migrate` refuses it. Sign it once at the
baseline migration, whose contract describes exactly the schema the last Prisma 7 migration left
behind. Do this before deploying the first Prisma 8 build, from a pod with the migrate image:

```sh
kubectl -n larpit-production run larpit-sign --rm -it --restart=Never \
  --image=ghcr.io/con2/larpit-fi:<short sha>-migrate \
  --overrides='{"spec":{"containers":[{"name":"sign","image":"ghcr.io/con2/larpit-fi:<short sha>-migrate","command":["node","src/bin/migrate.mjs","db","sign","20260926T1125_baseline"],"envFrom":[{"secretRef":{"name":"larpit"}}]}]}}'
```

`db sign` verifies the live schema against that contract before writing the marker, so it fails
rather than mislabels a database that does not match. The deploy then applies every migration
after the baseline. Drop the leftover `_prisma_migrations` table whenever convenient; Prisma 8
tolerates unmanaged tables.

## Prerequisites per namespace

```sh
kubectl create namespace larpit-production
kubectl -n larpit-production create secret generic larpit \
  --from-literal=DATABASE_URL='postgresql://larpit:...@postgres-rw.postgres.svc.cluster.local:5432/larpit?sslmode=disable' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=KOMPASSI_OIDC_CLIENT_ID=... \
  --from-literal=KOMPASSI_OIDC_CLIENT_SECRET=...
```

The Kompassi OIDC client must allow the redirect URI `https://<hostname>/api/auth/callback/kompassi`.

The database is the shared CloudNativePG cluster on qb; the role, database and password come
from `infrastructure/kubernetes/postgres/README.md`, and its `update-secret.sh` writes both
`DATABASE_URL` and `DATABASE_URL_REPLICA` into this Secret. Connections stay on the pod network
and use `sslmode=disable`, because the operator rotates its own CA and nothing on qb keeps a
copy of it fresh in this namespace.

`DATABASE_URL_REPLICA` is optional. When set, the public read paths (front page, larp pages,
listing, calendar, search, stats, the public API) query it and everything else still uses
`DATABASE_URL`; when unset, all queries go to `DATABASE_URL`. On qb it points at the
`postgres-ro` service, which has only the streaming replicas behind it.

For a database reached over the internet, use `sslmode=verify-full`, not `require`. `pg` treats
`require`, `prefer` and `verify-ca` as aliases for `verify-full` today and only warns about
them, but a future major version will give them their libpq meaning, which skips hostname
verification.

## Field ownership after the adoption from kubectl

The Deployment, Service and CronJob were adopted from kubectl-applied manifests. Helm installs
with server-side apply, and a field that Helm has not changed since the adoption is still owned by
the placeholder `before-first-apply`. The first deploy that changes such a field fails with
`Apply failed with 1 conflict: conflict with "before-first-apply"`. Deploy that one change by hand
with `--force-conflicts` (the CI command from `.github/workflows/cicd.yaml` plus the flag); Helm
then owns the field and later deploys need nothing special.

## Request body limit

The `app` HTTPRoute caps request bodies at 1 MB with a Traefik Middleware. An HTTPRoute can only
reference Middlewares in its own namespace, so the chart has its own copy instead of the
cluster-wide `default/body-1m`.
