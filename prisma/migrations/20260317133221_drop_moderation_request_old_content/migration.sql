/*
  Warnings:

  - You are about to drop the column `old_content` on the `moderation_request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "moderation_request" DROP COLUMN "old_content";
