import { execSync } from "child_process";

export function setup() {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
