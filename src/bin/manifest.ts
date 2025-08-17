// Generate Kubernetes manifests based on environment variables.
// See https://github.com/japsu/depleten for philosophy.

import { databaseUrl, kompassiOidc, authSecret } from "@/config";
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import path from "path";

interface Environment {
  hostname: string;
  secretManaged: boolean;
  kompassiBaseUrl: string;
  tlsEnabled: boolean;
}

const manifestsDir = path.resolve(path.join(__dirname, "../../kubernetes"));

type EnvironmentName = "dev" | "staging" | "production";
const environmentNames: EnvironmentName[] = ["dev", "staging", "production"];

const environmentConfigurations: Record<EnvironmentName, Environment> = {
  dev: {
    hostname: "larpit.localhost",
    secretManaged: true,
    kompassiBaseUrl: "https://dev.kompassi.eu",
    tlsEnabled: false,
  },
  staging: {
    hostname: "dev.larpit.fi",
    secretManaged: false,
    kompassiBaseUrl: "https://dev.kompassi.eu",
    tlsEnabled: true,
  },
  production: {
    hostname: "larpit.fi",
    secretManaged: false,
    kompassiBaseUrl: "https://kompassi.eu",
    tlsEnabled: true,
  },
};

function getEnvironmentName(): EnvironmentName {
  const environmentName = process.env.ENV;
  if (!environmentNames.includes(environmentName as EnvironmentName)) {
    return "dev";
  }
  return environmentName as EnvironmentName;
}

const environmentConfiguration =
  environmentConfigurations[getEnvironmentName()];

// image name will be replaced by skaffold
const image = "larpit-fi";
const migrateImage = "larpit-fi-builder";

export const stack = "larpit";
const nodeServiceName = "node";
const clusterIssuer = "letsencrypt-prod";
const tlsSecretName = "ingress-letsencrypt";
const port = 3000;
const ingressClassName = "nginx";
const livenessProbeEnabled = true;
const smtpHostname = "sr1.pahaip.fi";

const { hostname, secretManaged, kompassiBaseUrl, tlsEnabled } =
  environmentConfiguration;

const ingressProtocol = tlsEnabled ? "https" : "http";
const publicUrl = `${ingressProtocol}://${hostname}`;

// Startup and liveness probe
const probe = {
  httpGet: {
    path: "/api/health",
    port,
    httpHeaders: [
      {
        name: "host",
        value: hostname,
      },
    ],
  },
};

export function labels(component?: string) {
  return {
    stack,
    component,
  };
}

function secretKeyRef(key: string) {
  return {
    secretKeyRef: {
      name: stack,
      key,
    },
  };
}

const env = Object.entries({
  PORT: port,
  DATABASE_URL: secretKeyRef("DATABASE_URL"),
  AUTH_SECRET: secretKeyRef("AUTH_SECRET"),
  NEXTAUTH_URL: publicUrl,
  NEXT_PUBLIC_KOMPASSI_BASE_URL: kompassiBaseUrl,
  KOMPASSI_OIDC_CLIENT_ID: secretKeyRef("KOMPASSI_OIDC_CLIENT_ID"),
  KOMPASSI_OIDC_CLIENT_SECRET: secretKeyRef("KOMPASSI_OIDC_CLIENT_SECRET"),
  SMTP_HOSTNAME: smtpHostname,
}).map(([key, value]) => {
  if (value instanceof Object) {
    return {
      name: key,
      valueFrom: value,
    };
  } else {
    return {
      name: key,
      value: String(value),
    };
  }
});

const volumes = [
  {
    name: "next-temp",
    emptyDir: {},
  },
];

const volumeMounts = [
  {
    name: "next-temp",
    mountPath: "/usr/src/app/.next/cache",
  },
];

const securityContext = {
  readOnlyRootFilesystem: false,
  allowPrivilegeEscalation: false,
};

const deployment = {
  apiVersion: "apps/v1",
  kind: "Deployment",
  metadata: {
    name: nodeServiceName,
    labels: labels(nodeServiceName),
  },
  spec: {
    selector: {
      matchLabels: labels(nodeServiceName),
    },
    template: {
      metadata: {
        labels: labels(nodeServiceName),
      },
      spec: {
        enableServiceLinks: false,
        securityContext: {
          runAsUser: 1000,
          runAsGroup: 1000,
          fsGroup: 1000,
        },
        volumes,
        initContainers: [
          {
            name: "migrate",
            image: migrateImage,
            command: ["npm", "run", "db:migrate"],
            env,
            securityContext,
            volumeMounts,
          },
        ],
        containers: [
          {
            name: nodeServiceName,
            image,
            env,
            ports: [{ containerPort: port }],
            securityContext,
            startupProbe: probe,
            livenessProbe: livenessProbeEnabled ? probe : undefined,
            volumeMounts,
          },
        ],
      },
    },
  },
};

const service = {
  apiVersion: "v1",
  kind: "Service",
  metadata: {
    name: nodeServiceName,
    labels: labels(nodeServiceName),
  },
  spec: {
    ports: [
      {
        port,
        targetPort: port,
      },
    ],
    selector: labels(nodeServiceName),
  },
};

const tls = tlsEnabled
  ? [{ hosts: [hostname], secretName: tlsSecretName }]
  : [];

const defaultIngressAnnotations = {
  "nginx.ingress.kubernetes.io/proxy-body-size": "1m",
  "nginx.org/client-max-body-size": "1m",
};
const ingressAnnotations = tlsEnabled
  ? {
      "cert-manager.io/cluster-issuer": clusterIssuer,
      "nginx.ingress.kubernetes.io/ssl-redirect": "true",
      ...defaultIngressAnnotations,
    }
  : defaultIngressAnnotations;

const ingress = {
  apiVersion: "networking.k8s.io/v1",
  kind: "Ingress",
  metadata: {
    name: stack,
    labels: labels(),
    annotations: ingressAnnotations,
  },
  spec: {
    ingressClassName,
    tls,
    rules: [
      {
        host: hostname,
        http: {
          paths: [
            {
              pathType: "Prefix",
              path: "/",
              backend: {
                service: {
                  name: nodeServiceName,
                  port: {
                    number: port,
                  },
                },
              },
            },
          ],
        },
      },
    ],
  },
};

export function b64(str: string) {
  return Buffer.from(str).toString("base64");
}

// only written if secretManaged is true
const secret = {
  apiVersion: "v1",
  kind: "Secret",
  type: "Opaque",
  metadata: {
    name: stack,
    labels: labels(),
  },
  data: {
    KOMPASSI_OIDC_CLIENT_SECRET: b64(kompassiOidc.clientSecret),
    KOMPASSI_OIDC_CLIENT_ID: b64(kompassiOidc.clientId),
    AUTH_SECRET: b64(authSecret),
    DATABASE_URL: b64(databaseUrl),
  },
};

export function writeManifest(filename: string, manifest: unknown) {
  const filePath = path.join(manifestsDir, filename);
  writeFileSync(filePath, JSON.stringify(manifest, null, 2), {
    encoding: "utf-8",
  });
  console.log("Wrote", filename);
}

function main() {
  mkdirSync(manifestsDir, { recursive: true });

  writeManifest("deployment.json", deployment);
  writeManifest("service.json", service);
  writeManifest("ingress.json", ingress);

  const secretFilename = "secret.json";
  const secretPath = path.join(manifestsDir, secretFilename);
  if (secretManaged) {
    writeManifest(secretFilename, secret);
  } else if (existsSync(secretPath)) {
    unlinkSync(secretPath);
  }
}

if (import.meta.url === "file://" + process.argv[1]) {
  main();
}
