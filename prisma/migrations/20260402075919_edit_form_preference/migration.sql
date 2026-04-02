-- CreateEnum
CREATE TYPE "EditFormPreference" AS ENUM ('FULL', 'COMPACT');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "edit_form_preference" "EditFormPreference" NOT NULL DEFAULT 'FULL';
