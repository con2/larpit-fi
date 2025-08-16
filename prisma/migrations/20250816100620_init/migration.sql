-- CreateEnum
CREATE TYPE "larpit"."LarpType" AS ENUM ('ONE_SHOT', 'CAMPAIGN_LARP', 'CAMPAIGN', 'MULTIPLE_RUNS', 'OTHER_EVENT_SERIES', 'OTHER_EVENT');

-- CreateEnum
CREATE TYPE "larpit"."Language" AS ENUM ('fi', 'en', 'sv', 'OTHER');

-- CreateEnum
CREATE TYPE "larpit"."RelatedLarpType" AS ENUM ('SEQUEL', 'SPINOFF', 'IN_CAMPAIGN', 'IN_SERIES', 'RUN_OF', 'RERUN_OF', 'PLAYED_AT');

-- CreateEnum
CREATE TYPE "larpit"."RelatedUserRole" AS ENUM ('EDITOR', 'CREATED_BY', 'GAME_MASTER', 'ORGANIZER', 'VOLUNTEER', 'PLAYER', 'FAVORITE');

-- CreateEnum
CREATE TYPE "larpit"."LarpLinkType" AS ENUM ('HOMEPAGE', 'PHOTOS', 'SOCIAL_MEDIA', 'PLAYER_GUIDE');

-- CreateEnum
CREATE TYPE "larpit"."SubmitterRole" AS ENUM ('NONE', 'GAME_MASTER', 'VOLUNTEER', 'PLAYER');

-- CreateEnum
CREATE TYPE "larpit"."EditStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "larpit"."EditType" AS ENUM ('CREATE', 'UPDATE');

-- CreateTable
CREATE TABLE "larpit"."user" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."account" (
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("provider","provider_account_id")
);

-- CreateTable
CREATE TABLE "larpit"."session" (
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "larpit"."verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "larpit"."authenticator" (
    "credential_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "credential_public_key" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credential_device_type" TEXT NOT NULL,
    "credential_backed_up" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "authenticator_pkey" PRIMARY KEY ("user_id","credential_id")
);

-- CreateTable
CREATE TABLE "larpit"."larp" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "larpit"."LarpType" NOT NULL DEFAULT 'ONE_SHOT',
    "language" "larpit"."Language" NOT NULL,
    "tagline" TEXT,
    "alias" TEXT,
    "location_text" TEXT,
    "fluff_text" TEXT,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "signup_starts_at" TIMESTAMP(3),
    "signup_ends_at" TIMESTAMP(3),

    CONSTRAINT "larp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."related_larp" (
    "left_id" UUID NOT NULL,
    "right_id" UUID NOT NULL,
    "type" "larpit"."RelatedLarpType" NOT NULL,

    CONSTRAINT "related_larp_pkey" PRIMARY KEY ("left_id","right_id")
);

-- CreateTable
CREATE TABLE "larpit"."related_user" (
    "id" UUID NOT NULL,
    "larp_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "larpit"."RelatedUserRole" NOT NULL,

    CONSTRAINT "related_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."larp_link" (
    "id" UUID NOT NULL,
    "larp_id" UUID NOT NULL,
    "type" "larpit"."LarpLinkType" NOT NULL DEFAULT 'HOMEPAGE',
    "href" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "larp_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."edit_larp_request" (
    "id" UUID NOT NULL,
    "larp_id" UUID,
    "type" "larpit"."EditType" NOT NULL,
    "status" "larpit"."EditStatus" NOT NULL,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "submitter_name" TEXT NOT NULL,
    "submitter_email" TEXT NOT NULL,
    "submitter_id" UUID,
    "submitter_role" "larpit"."SubmitterRole" NOT NULL DEFAULT 'NONE',
    "verification_code" UUID,
    "verified_at" TIMESTAMP(3),
    "old_content" JSONB NOT NULL DEFAULT '{}',
    "new_content" JSONB NOT NULL DEFAULT '{}',
    "message" TEXT,

    CONSTRAINT "edit_larp_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "larpit"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_session_token_key" ON "larpit"."session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "authenticator_credential_id_key" ON "larpit"."authenticator"("credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "larp_alias_key" ON "larpit"."larp"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "edit_larp_request_verification_code_key" ON "larpit"."edit_larp_request"("verification_code");

-- AddForeignKey
ALTER TABLE "larpit"."account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."authenticator" ADD CONSTRAINT "authenticator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."related_larp" ADD CONSTRAINT "related_larp_left_id_fkey" FOREIGN KEY ("left_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."related_larp" ADD CONSTRAINT "related_larp_right_id_fkey" FOREIGN KEY ("right_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."related_user" ADD CONSTRAINT "related_user_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."related_user" ADD CONSTRAINT "related_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."larp_link" ADD CONSTRAINT "larp_link_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
