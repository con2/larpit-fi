-- CreateEnum
CREATE TYPE "LocalSignupStatus" AS ENUM ('DISABLED', 'PUBLIC', 'CODE_REQUIRED');

-- CreateEnum
CREATE TYPE "RelatedUserVisibility" AS ENUM ('PARTICIPANTS', 'GM', 'ONLY_ME');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RelatedUserRole" ADD VALUE 'LOCAL_SIGNUP_YES';
ALTER TYPE "RelatedUserRole" ADD VALUE 'LOCAL_SIGNUP_MAYBE';
ALTER TYPE "RelatedUserRole" ADD VALUE 'LOCAL_SIGNUP_NO';

-- AlterTable
ALTER TABLE "larp" ADD COLUMN     "local_signup_code" TEXT,
ADD COLUMN     "local_signup_status" "LocalSignupStatus" NOT NULL DEFAULT 'DISABLED',
ADD COLUMN     "related_user_visibility" "RelatedUserVisibility" NOT NULL DEFAULT 'GM';

-- AlterTable
ALTER TABLE "related_user" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "visibility" "RelatedUserVisibility" NOT NULL DEFAULT 'ONLY_ME';

-- DropEnum
DROP TYPE "Visibility";

-- CreateTable
CREATE TABLE "unauthenticated_signup" (
    "id" UUID NOT NULL,
    "larp_id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "signup_status" "RelatedUserRole" NOT NULL,
    "visibility" "RelatedUserVisibility" NOT NULL,
    "verification_code" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unauthenticated_signup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unauthenticated_signup_verification_code_key" ON "unauthenticated_signup"("verification_code");

-- AddForeignKey
ALTER TABLE "unauthenticated_signup" ADD CONSTRAINT "unauthenticated_signup_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Check constraints (enforcing subset of enum values at DB level)
ALTER TABLE "unauthenticated_signup"
  ADD CONSTRAINT "unauthenticated_signup_signup_status_check"
    CHECK (signup_status in ('LOCAL_SIGNUP_YES', 'LOCAL_SIGNUP_MAYBE', 'LOCAL_SIGNUP_NO'));

ALTER TABLE "unauthenticated_signup"
  ADD CONSTRAINT "unauthenticated_signup_visibility_check"
    CHECK (visibility in ('PARTICIPANTS', 'GM'));

-- Partial unique indexes: at most one verified and one pending row per (larp, email)
CREATE UNIQUE INDEX "unauthenticated_signup_larp_email_verified_uidx"
  ON "unauthenticated_signup"("larp_id", "email")
  WHERE "verified_at" IS NOT NULL;

CREATE UNIQUE INDEX "unauthenticated_signup_larp_email_pending_uidx"
  ON "unauthenticated_signup"("larp_id", "email")
  WHERE "verified_at" IS NULL;
