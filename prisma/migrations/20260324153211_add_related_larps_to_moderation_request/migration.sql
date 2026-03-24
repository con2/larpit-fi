-- AlterTable
ALTER TABLE "moderation_request" ADD COLUMN     "add_related_larps" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "remove_related_larps" JSONB NOT NULL DEFAULT '[]';
