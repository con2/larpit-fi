import "dotenv/config";

import { SendMailOptions } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const nodeEnv = process.env.NODE_ENV || "development";

export const timezone = "Europe/Helsinki";
export const privacyPolicyUrl = "https://tracon.fi/tietosuoja/larpit-fi";

export const databaseUrl = process.env.DATABASE_URL || "postgresql:///";
/** Streaming replica for public read paths; unset means those reads go to the primary. */
export const databaseReplicaUrl = process.env.DATABASE_URL_REPLICA || undefined;

// kompassi SSO
export const kompassiBaseUrl =
  process.env.NEXT_PUBLIC_KOMPASSI_BASE_URL || "https://dev.kompassi.eu";
export const kompassiProfileUrl = `${kompassiBaseUrl}/profile`;
export const kompassiOidc = {
  issuer: `${kompassiBaseUrl}/oidc`,
  clientId:
    process.env.KOMPASSI_OIDC_CLIENT_ID ||
    "kompassi_dev_insecure_client_id_larpit_fi",
  clientSecret:
    process.env.KOMPASSI_OIDC_CLIENT_SECRET ||
    "kompassi_dev_insecure_client_secret_larpit_fi",
};

// User-visible public base URL of the service
export const publicUrl = process.env.AUTH_URL || "http://localhost:3158";
export const isStaging = publicUrl.includes("dev.larpit.fi");

// Auth.js
export const authSecret =
  process.env.AUTH_SECRET || "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

export const nodemailerConfig: SMTPTransport.Options = {
  host: process.env.SMTP_HOSTNAME || "",
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  auth: {
    user: process.env.SMTP_USERNAME || "",
    pass: process.env.SMTP_PASSWORD || "",
  },
};

export const mailSender = process.env.MAIL_SENDER || "larpit-fi@tracon.fi";
export const formattedMailFrom =
  process.env.FORMATTED_MAIL_FROM || `Larpit.fi <larpit-fi@tracon.fi>`;

export const mailOptions: Partial<SendMailOptions> = {
  sender: mailSender,
  from: formattedMailFrom,
};

// Edegal instance whose top-level albums are cross-linked with larps
export const larppikuvatApiUrl =
  process.env.LARPPIKUVAT_API_URL || "https://larppikuvat.fi/api/v3/";

/**
 * S3-compatible storage for header images (Garage in production). The server calls `endpoint`,
 * which may be an in-cluster address; browsers follow presigned URLs to `publicEndpoint`. An empty
 * bucket turns header images off.
 */
const s3Endpoint = process.env.S3_ENDPOINT || "";
export const s3 = {
  bucket: process.env.S3_BUCKET || "",
  endpoint: s3Endpoint,
  publicEndpoint: process.env.S3_PUBLIC_ENDPOINT || s3Endpoint,
  region: process.env.S3_REGION || "garage",
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
};
export const headerImagesEnabled = !!s3.bucket;

export const featureFlags = {
  localSignup: false,
  /**
   * Off: everyone gets the plain Day theme and the theme controls are hidden. On: Night mode and
   * the theme controls, and in Day mode a night-sky app bar and aurora hero over the day page.
   */
  nordicNight: false,
} as const;
