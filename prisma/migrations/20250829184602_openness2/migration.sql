/*
  Warnings:

  - You are about to drop the column `signupOpenness` on the `larp` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "larpit"."larp" DROP COLUMN "signupOpenness",
ADD COLUMN     "openness" "larpit"."Openness";
