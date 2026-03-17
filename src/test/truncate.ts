import prisma from "@/prisma";

export async function truncateAll() {
  await prisma.$executeRaw`
    TRUNCATE moderation_request, related_larp, related_user, larp_link, larp, "user" CASCADE
  `;
}
