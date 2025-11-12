// Generate Kubernetes secret based on environment variables.
// See https://github.com/japsu/depleten for philosophy.
// Usage: DATABASE_URL=… node --experimental-strip-types src/bin/secret.ts

import { writeFileSync } from "fs";
import path from "path";

export const stack = "larpit";
const manifestsDir = path.resolve("kubernetes");

// note: keep in sync with config.ts
export const databaseUrl = process.env.DATABASE_URL || "postgresql:///";
export const authSecret =
  process.env.AUTH_SECRET || "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
export const kompassiBaseUrl =
  process.env.NEXT_PUBLIC_KOMPASSI_BASE_URL || "https://dev.kompassi.eu";
export const kompassiOidc = {
  wellKnown: `${kompassiBaseUrl}/oidc/.well-known/openid-configuration/`,
  clientId:
    process.env.KOMPASSI_OIDC_CLIENT_ID ||
    "kompassi_dev_insecure_client_id_larpit_fi",
  clientSecret:
    process.env.KOMPASSI_OIDC_CLIENT_SECRET ||
    "kompassi_dev_insecure_client_secret_larpit_fi",
};

const secret = {
  apiVersion: "v1",
  kind: "Secret",
  type: "Opaque",
  metadata: {
    name: stack,
    labels: { stack },
  },
  data: {
    KOMPASSI_OIDC_CLIENT_SECRET: b64(kompassiOidc.clientSecret),
    KOMPASSI_OIDC_CLIENT_ID: b64(kompassiOidc.clientId),
    AUTH_SECRET: b64(authSecret),
    DATABASE_URL: b64(databaseUrl),
  },
};

export function b64(str: string) {
  return Buffer.from(str).toString("base64");
}

export function writeManifest(filename: string, manifest: unknown) {
  const filePath = path.join(manifestsDir, filename);
  writeFileSync(filePath, JSON.stringify(manifest, null, 2), {
    encoding: "utf-8",
  });
  console.log("Wrote", filename);
}

function main() {
  const secretFilename = "secret.json";
  writeManifest(secretFilename, secret);
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
