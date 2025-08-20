-- AlterTable
ALTER TABLE "larpit"."moderation_request" ADD COLUMN     "add_links" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "remove_links" JSONB NOT NULL DEFAULT '[]';
