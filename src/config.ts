import "dotenv/config";

import { SendMailOptions } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const nodeEnv = process.env.NODE_ENV || "development";

export const timezone = "Europe/Helsinki";
export const privacyPolicyUrl = "https://tracon.fi/tietosuoja/larpit-fi";

export const databaseUrl = process.env.DATABASE_URL || "postgresql:///";

// kompassi SSO
export const kompassiBaseUrl =
  process.env.NEXT_PUBLIC_KOMPASSI_BASE_URL || "https://dev.kompassi.eu";
export const kompassiProfileUrl = `${kompassiBaseUrl}/profile`;
export const kompassiOidc = {
  wellKnown: `${kompassiBaseUrl}/oidc/.well-known/openid-configuration/`,
  clientId:
    process.env.KOMPASSI_OIDC_CLIENT_ID ||
    "kompassi_dev_insecure_client_id_larpit_fi",
  clientSecret:
    process.env.KOMPASSI_OIDC_CLIENT_SECRET ||
    "kompassi_dev_insecure_client_secret_larpit_fi",
};

// User-visible public base URL of the service
export const publicUrl = process.env.NEXTAUTH_URL || "http://localhost:3158";
export const isStaging = publicUrl.includes("dev.larpit.fi");

// next-auth aka auth.js
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
