/*
  Warnings:

  - You are about to drop the `alias` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[alias]` on the table `larp` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "larpit"."alias" DROP CONSTRAINT "alias_larp_id_fkey";

-- AlterTable
ALTER TABLE "larpit"."larp" ADD COLUMN     "alias" TEXT;

-- DropTable
DROP TABLE "larpit"."alias";

-- CreateIndex
CREATE UNIQUE INDEX "larp_alias_key" ON "larpit"."larp"("alias");
