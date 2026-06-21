-- DropForeignKey
ALTER TABLE "moderation_request" DROP CONSTRAINT "moderation_request_resolved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "moderation_request" DROP CONSTRAINT "moderation_request_submitter_id_fkey";

-- AddForeignKey
ALTER TABLE "moderation_request" ADD CONSTRAINT "moderation_request_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_request" ADD CONSTRAINT "moderation_request_submitter_id_fkey" FOREIGN KEY ("submitter_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
