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

## One-time cutover from the kubectl-applied manifests

Before this chart, `src/bin/manifest.mts` generated a Deployment `node`, a Service `node` and an
Ingress `larpit`, and skaffold applied them. The chart keeps the Deployment's and Service's names
and selector, so Helm can adopt them instead of recreating them.

1. Mark the existing objects as belonging to the release:

   ```sh
   ns=larpit-production
   kubectl -n $ns annotate deployment/node service/node cronjob/sync-larppikuvat --overwrite \
     meta.helm.sh/release-name=larpit meta.helm.sh/release-namespace=$ns
   kubectl -n $ns label deployment/node service/node cronjob/sync-larppikuvat --overwrite \
     app.kubernetes.io/managed-by=Helm
   ```

2. Deploy once by hand with `--force-conflicts`, using an image tag CI has already pushed. Helm
   installs with server-side apply, which refuses to change fields that `kubectl apply` still
   owns. Clearing `managedFields` does not help: the next apply assigns every existing field to
   a placeholder owner, `before-first-apply`, and conflicts with that instead.

   ```sh
   helm upgrade --install larpit chart --namespace larpit-production \
     -f chart/values-production.yaml \
     --set image.repository=ghcr.io/con2/larpit-fi --set image.tag=<short sha> \
     --force-conflicts --wait --timeout 300s
   ```

   Later CI deploys need no flag, because Helm then owns every field. Until step 3 both the old
   Ingress and the new Gateway route larpit.fi. Wait until the new certificate is issued and the
   routes are accepted:

   ```sh
   kubectl -n larpit-production get certificate larpit      # READY True
   kubectl -n larpit-production get gateway,httproute       # PROGRAMMED / Accepted
   curl -sI https://larpit.fi/api/health
   ```

3. Remove the Ingress. cert-manager's `ingress-letsencrypt` Certificate is owned by it and goes
   with it; its TLS Secret does not.

   ```sh
   kubectl -n larpit-production delete ingress larpit
   kubectl -n larpit-production delete secret ingress-letsencrypt
   ```
