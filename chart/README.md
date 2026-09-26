# larpit Helm chart

Deploys larpit.fi: a Next.js Deployment (with a Prisma migration init container), the hourly
Larppikuvat.fi sync CronJob, a per-namespace Gateway with HTTPRoutes, and a cert-manager
Certificate. `.github/workflows/cicd.yaml` runs `helm upgrade --install larpit chart` into
`larpit-production` on every push to main.

## Images

`docker-bake.hcl` builds two images from the Dockerfile, both tagged with the short commit SHA:

- `ghcr.io/con2/larpit-fi:<sha>`: the Next.js standalone server.
- `ghcr.io/con2/larpit-fi:<sha>-builder`: the full build stage with `node_modules` and `src`.
  The migration init container and the sync CronJob run from it, because the standalone image
  has neither the Prisma CLI nor `src/bin`.

## Prerequisites per namespace

```sh
kubectl create namespace larpit-production
kubectl -n larpit-production create secret generic larpit \
  --from-literal=DATABASE_URL='postgresql://larpit:...@siilo.tracon.fi/larpit?sslmode=verify-full' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=KOMPASSI_OIDC_CLIENT_ID=... \
  --from-literal=KOMPASSI_OIDC_CLIENT_SECRET=...
```

The Kompassi OIDC client must allow the redirect URI `https://<hostname>/api/auth/callback/kompassi`.

Use `sslmode=verify-full`, not `require`. `pg` treats `require`, `prefer` and `verify-ca` as
aliases for `verify-full` today and only warns about them, but a future major version will give
them their libpq meaning, which skips hostname verification.

## Request body limit

The `app` HTTPRoute caps request bodies at 1 MB with a Traefik Middleware. An HTTPRoute can only
reference Middlewares in its own namespace, so the chart has its own copy instead of the
cluster-wide `default/body-1m`.
