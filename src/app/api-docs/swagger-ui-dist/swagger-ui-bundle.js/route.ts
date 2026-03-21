import { readFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";

export function GET() {
  const content = readFileSync(join(process.cwd(), "node_modules/swagger-ui-dist/swagger-ui-bundle.js"));
  return new NextResponse(content, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
