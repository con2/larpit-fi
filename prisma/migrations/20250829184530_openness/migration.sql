-- CreateEnum
CREATE TYPE "larpit"."Openness" AS ENUM ('OPEN', 'TARGETED', 'INVITE_ONLY');

-- AlterTable
ALTER TABLE "larpit"."larp" ADD COLUMN     "signupOpenness" "larpit"."Openness";
