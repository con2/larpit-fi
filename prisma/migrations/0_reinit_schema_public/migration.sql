-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('NOT_VERIFIED', 'VERIFIED', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "LarpType" AS ENUM ('ONE_SHOT', 'CAMPAIGN_LARP', 'CAMPAIGN', 'MULTIPLE_RUNS', 'OTHER_EVENT_SERIES', 'OTHER_EVENT');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('fi', 'en', 'sv', 'OTHER');

-- CreateEnum
CREATE TYPE "Openness" AS ENUM ('OPEN', 'TARGETED', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "RelatedLarpType" AS ENUM ('SEQUEL', 'SPINOFF', 'IN_CAMPAIGN', 'IN_SERIES', 'RUN_OF', 'RERUN_OF', 'PLAYED_AT');

-- CreateEnum
CREATE TYPE "RelatedUserRole" AS ENUM ('EDITOR', 'CREATED_BY', 'GAME_MASTER', 'TEAM_MEMBER', 'VOLUNTEER', 'PLAYER', 'FAVORITE');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'GAME_MASTER', 'PRIVATE');

-- CreateEnum
CREATE TYPE "LarpLinkType" AS ENUM ('HOMEPAGE', 'PHOTOS', 'SOCIAL_MEDIA', 'PLAYER_GUIDE');

-- CreateEnum
CREATE TYPE "SubmitterRole" AS ENUM ('NONE', 'GAME_MASTER', 'TEAM_MEMBER', 'VOLUNTEER', 'PLAYER');

-- CreateEnum
CREATE TYPE "EditStatus" AS ENUM ('PENDING_VERIFICATION', 'VERIFIED', 'AUTO_APPROVED', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EditAction" AS ENUM ('CREATE', 'UPDATE', 'CLAIM');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "title_fi" TEXT,
    "title_en" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'NOT_VERIFIED',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
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
CREATE TABLE "session" (
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_token_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "authenticator" (
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
CREATE TABLE "country" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name_fi" TEXT,
    "name_sv" TEXT,
    "name_en" TEXT,

    CONSTRAINT "country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipality" (
    "id" TEXT NOT NULL,
    "name_fi" TEXT,
    "name_sv" TEXT,
    "name_other" TEXT,
    "name_other_language_code" TEXT,
    "country_code" TEXT NOT NULL DEFAULT 'wd:Q33',
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larp" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LarpType" NOT NULL DEFAULT 'ONE_SHOT',
    "language" "Language" NOT NULL,
    "tagline" TEXT,
    "alias" TEXT,
    "location_text" TEXT,
    "municipality_id" TEXT,
    "num_player_characters" INTEGER,
    "num_total_participants" INTEGER,
    "fluff_text" TEXT,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "signup_starts_at" TIMESTAMP(3),
    "signup_ends_at" TIMESTAMP(3),
    "openness" "Openness",

    CONSTRAINT "larp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "related_larp" (
    "left_id" UUID NOT NULL,
    "right_id" UUID NOT NULL,
    "type" "RelatedLarpType" NOT NULL,

    CONSTRAINT "related_larp_pkey" PRIMARY KEY ("left_id","right_id")
);

-- CreateTable
CREATE TABLE "related_user" (
    "larp_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "RelatedUserRole" NOT NULL,

    CONSTRAINT "related_user_pkey" PRIMARY KEY ("larp_id","user_id","role")
);

-- CreateTable
CREATE TABLE "larp_link" (
    "id" UUID NOT NULL,
    "larp_id" UUID NOT NULL,
    "type" "LarpLinkType" NOT NULL DEFAULT 'HOMEPAGE',
    "href" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "larp_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_request" (
    "id" UUID NOT NULL,
    "larp_id" UUID,
    "action" "EditAction" NOT NULL,
    "status" "EditStatus" NOT NULL,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "resolved_message" TEXT,
    "submitter_name" TEXT NOT NULL,
    "submitter_email" TEXT NOT NULL,
    "submitter_id" UUID,
    "submitter_role" "SubmitterRole" NOT NULL DEFAULT 'NONE',
    "verification_code" UUID,
    "verified_at" TIMESTAMP(3),
    "old_content" JSONB NOT NULL DEFAULT '{}',
    "new_content" JSONB NOT NULL DEFAULT '{}',
    "remove_links" JSONB NOT NULL DEFAULT '[]',
    "add_links" JSONB NOT NULL DEFAULT '[]',
    "message" TEXT,

    CONSTRAINT "moderation_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page" (
    "slug" TEXT NOT NULL DEFAULT 'front-page',
    "language" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_pkey" PRIMARY KEY ("slug","language")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_session_token_key" ON "session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "authenticator_credential_id_key" ON "authenticator"("credential_id");

-- CreateIndex
CREATE UNIQUE INDEX "country_code_key" ON "country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "larp_alias_key" ON "larp"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_request_verification_code_key" ON "moderation_request"("verification_code");

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "municipality" ADD CONSTRAINT "municipality_country_code_fkey" FOREIGN KEY ("country_code") REFERENCES "country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larp" ADD CONSTRAINT "larp_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipality"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_larp" ADD CONSTRAINT "related_larp_left_id_fkey" FOREIGN KEY ("left_id") REFERENCES "larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_larp" ADD CONSTRAINT "related_larp_right_id_fkey" FOREIGN KEY ("right_id") REFERENCES "larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_user" ADD CONSTRAINT "related_user_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "related_user" ADD CONSTRAINT "related_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larp_link" ADD CONSTRAINT "larp_link_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_request" ADD CONSTRAINT "moderation_request_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_request" ADD CONSTRAINT "moderation_request_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_request" ADD CONSTRAINT "moderation_request_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

