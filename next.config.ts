import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api-docs/swagger-ui-dist/swagger-ui-bundle.js": ["./node_modules/swagger-ui-dist/swagger-ui-bundle.js"],
    "/api-docs/swagger-ui-dist/swagger-ui.css": ["./node_modules/swagger-ui-dist/swagger-ui.css"],
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
