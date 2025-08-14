export const timezone = "Europe/Helsinki";
export const privacyPolicyUrl = "https://tracon.fi/tietosuoja/larpit-fi";

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

export const publicUrl = process.env.NEXTAUTH_URL || "http://localhost:3158";
