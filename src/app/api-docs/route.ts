import { NextResponse } from "next/server";

// NOTE: We set quite strong caching headers for the OpenAPI UI assets, since they don't change often and can be large.
// If we need to make sure clients load new CSS and JS, add a cache-busting query parameter to the URLs in the HTML, e.g. /api-docs/swagger-ui-dist/swagger-ui.css?v=1.0.0
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>larpit.fi API docs</title>
    <link rel="stylesheet" href="/api-docs/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api-docs/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: "BaseLayout",
      });
    </script>
  </body>
</html>`;

export function GET() {
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
