import { PrismaClient } from "@/generated/prisma";

const prismaSymbol = Symbol();
const prismaGlobal = global as unknown as { [prismaSymbol]: typeof prisma };

// Avoid "Too many database connections" under `next dev`
function getPrismaClientInDev(): PrismaClient {
  if (prismaGlobal[prismaSymbol]) {
    return prismaGlobal[prismaSymbol];
  }
  return (prismaGlobal[prismaSymbol] = new PrismaClient());
}

const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? new PrismaClient()
    : getPrismaClientInDev();

export default prisma;
