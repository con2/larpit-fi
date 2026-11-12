import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Paths of the WordPress site that larp.fi hosted before this app.
const legacyLarpFiRedirects: Record<string, string> = {
  "/tietoja": "/larppaaminen/mita-on",
  "/tietoja/miten-aloittaa-larppaus": "/larppaaminen/aloita",
  "/tietoja/workshopit-ja-mallinnustekniikat": "/larppaaminen/saannot",
  "/tietoja/proppauksesta": "/larppaaminen/proppaus",
  "/tietoja/suomi-larp-sanakirja": "/larppaaminen/sanasto",
  "/tietoja/somessa": "/larppaaminen/lapsille",
  "/yhdistykset-ja-paikallistoiminta": "/larppaaminen/yhdistyksia",
  "/yhdistykset-ja-paikallistoiminta/yhdistyksia": "/larppaaminen/yhdistyksia",
  "/yhdistykset-ja-paikallistoiminta/saannolliset-tapaamiset":
    "/larp?type=OTHER_EVENT",
  "/yhdistykset-ja-paikallistoiminta/tapahtumat": "/larp?type=OTHER_EVENT",
  "/hyodyllisia-linkkeja": "/larppaaminen/linkit",
  "/larpitfi": "/",
  "/kuvia-ja-videoita": "https://larppikuvat.fi",
};

const nextConfig: NextConfig = {
  output: "standalone",
  // A trailing slash is stripped by Next.js before these are matched.
  async redirects() {
    return Object.entries(legacyLarpFiRedirects).map(
      ([source, destination]) => ({ source, destination, permanent: true }),
    );
  },
  transpilePackages: ["@con2/components"],
  outputFileTracingIncludes: {
    "/api-docs/swagger-ui-dist/swagger-ui-bundle.js": [
      "./node_modules/swagger-ui-dist/swagger-ui-bundle.js",
    ],
    "/api-docs/swagger-ui-dist/swagger-ui.css": [
      "./node_modules/swagger-ui-dist/swagger-ui.css",
    ],
  },
  sassOptions: {
    // bootstrap
    silenceDeprecations: [
      "legacy-js-api",
      "import",
      "global-builtin",
      "color-functions",
      "if-function",
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
