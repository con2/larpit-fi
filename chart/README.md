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
  --from-literal=DATABASE_URL='postgresql://...' \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 32)" \
  --from-literal=KOMPASSI_OIDC_CLIENT_ID=... \
  --from-literal=KOMPASSI_OIDC_CLIENT_SECRET=...
```

The Kompassi OIDC client must allow the redirect URI `https://<hostname>/api/auth/callback/kompassi`.

## Request body limit

The `app` HTTPRoute caps request bodies at 1 MB with a Traefik Middleware. An HTTPRoute can only
reference Middlewares in its own namespace, so the chart has its own copy instead of the
cluster-wide `default/body-1m`.

## One-time cutover from the kubectl-applied manifests

Before this chart, `src/bin/manifest.mts` generated a Deployment `node`, a Service `node` and an
Ingress `larpit`, and skaffold applied them. The chart keeps the Deployment's and Service's names
and selector, so Helm can adopt them instead of recreating them.

1. Before the first chart deploy, mark the existing objects as belonging to the release:

   ```sh
   kubectl -n larpit-production annotate deployment/node service/node \
     meta.helm.sh/release-name=larpit meta.helm.sh/release-namespace=larpit-production
   kubectl -n larpit-production label deployment/node service/node \
     app.kubernetes.io/managed-by=Helm
   ```

2. Deploy (push to main). Until step 3 both the old Ingress and the new Gateway route larpit.fi.
   Wait until the new certificate is issued and the routes are accepted:

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
