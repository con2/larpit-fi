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
CREATE TYPE "larpit"."EditStatus" AS ENUM ('NEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "larpit"."EditType" AS ENUM ('CREATE', 'UPDATE');

-- CreateTable
CREATE TABLE "larpit"."account" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider_type" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "access_token_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "session_token" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."user" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."verification_request" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_request_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "larpit"."RelatedLarp" (
    "left_id" UUID NOT NULL,
    "right_id" UUID NOT NULL,
    "type" "larpit"."RelatedLarpType" NOT NULL,

    CONSTRAINT "RelatedLarp_pkey" PRIMARY KEY ("left_id","right_id")
);

-- CreateTable
CREATE TABLE "larpit"."RelatedUser" (
    "id" UUID NOT NULL,
    "larp_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "larpit"."RelatedUserRole" NOT NULL,

    CONSTRAINT "RelatedUser_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "larpit"."EditLarpRequest" (
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
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "location_text" TEXT,
    "language" "larpit"."Language" NOT NULL,
    "fluff_text" TEXT,
    "description" TEXT,
    "message" TEXT,

    CONSTRAINT "EditLarpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_id_provider_account_id_key" ON "larpit"."account"("provider_id", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_session_token_key" ON "larpit"."session"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "session_access_token_key" ON "larpit"."session"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "larpit"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "verification_request_token_key" ON "larpit"."verification_request"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_request_identifier_token_key" ON "larpit"."verification_request"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "larp_alias_key" ON "larpit"."larp"("alias");

-- AddForeignKey
ALTER TABLE "larpit"."account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."RelatedLarp" ADD CONSTRAINT "RelatedLarp_left_id_fkey" FOREIGN KEY ("left_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."RelatedLarp" ADD CONSTRAINT "RelatedLarp_right_id_fkey" FOREIGN KEY ("right_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."RelatedUser" ADD CONSTRAINT "RelatedUser_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."RelatedUser" ADD CONSTRAINT "RelatedUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."larp_link" ADD CONSTRAINT "larp_link_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
