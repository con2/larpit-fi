-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'ACCOUNT_REMOVAL');

-- AlterTable
ALTER TABLE "verification_token" ADD COLUMN     "type" "TokenType" NOT NULL DEFAULT 'EMAIL_VERIFICATION';
