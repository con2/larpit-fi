/*
  Warnings:

  - The primary key for the `related_user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `related_user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "related_user" DROP CONSTRAINT "related_user_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "related_user_pkey" PRIMARY KEY ("larp_id", "user_id", "role");
