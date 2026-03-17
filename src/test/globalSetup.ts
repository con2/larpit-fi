import { execSync } from "child_process";

export function setup() {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: "postgresql://japsu@localhost/larpit_test" },
    stdio: "inherit",
  });
}
