-- CreateEnum
CREATE TYPE "larpit"."LarpLinkType" AS ENUM ('HOMEPAGE', 'PHOTOS', 'SOCIAL_MEDIA');

-- CreateTable
CREATE TABLE "larpit"."account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
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
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "session_token" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."user" (
    "id" TEXT NOT NULL,
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
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."larp" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "language" TEXT NOT NULL,
    "location_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),

    CONSTRAINT "larp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "larpit"."alias" (
    "alias" TEXT NOT NULL,
    "larp_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alias_pkey" PRIMARY KEY ("alias")
);

-- CreateTable
CREATE TABLE "larpit"."larp_link" (
    "id" TEXT NOT NULL,
    "larp_id" TEXT NOT NULL,
    "type" "larpit"."LarpLinkType" NOT NULL DEFAULT 'HOMEPAGE',
    "href" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "larp_link_pkey" PRIMARY KEY ("id")
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

-- AddForeignKey
ALTER TABLE "larpit"."account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "larpit"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."alias" ADD CONSTRAINT "alias_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "larpit"."larp_link" ADD CONSTRAINT "larp_link_larp_id_fkey" FOREIGN KEY ("larp_id") REFERENCES "larpit"."larp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
