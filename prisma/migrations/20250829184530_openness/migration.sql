-- CreateEnum
CREATE TYPE "Openness" AS ENUM ('OPEN', 'TARGETED', 'INVITE_ONLY');

-- AlterTable
ALTER TABLE "larp" ADD COLUMN     "signupOpenness" "Openness";
