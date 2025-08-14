import type { PrismaConfig } from "prisma";

import "dotenv/config";

export default {
  migrations: {
    seed: "tsx src/bin/seed.ts",
  },
} satisfies PrismaConfig;
