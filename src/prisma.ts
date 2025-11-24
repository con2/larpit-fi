import { databaseUrl } from "./config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaSymbol = Symbol();
const prismaGlobal = global as unknown as { [prismaSymbol]: typeof prisma };

// Avoid "Too many database connections" under `next dev`
function getPrismaClientInDev(): PrismaClient {
  if (prismaGlobal[prismaSymbol]) {
    return prismaGlobal[prismaSymbol];
  }
  return (prismaGlobal[prismaSymbol] = getPrismaClient());
}

function getPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? getPrismaClient()
    : getPrismaClientInDev();

export default prisma;
