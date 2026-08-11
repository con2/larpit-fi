-- AlterTable
ALTER TABLE "larp" ADD COLUMN "cancelled_at" TIMESTAMP(3);

-- Backdate existing cancellations so they are already outside the
-- front page's 30-day visibility window once this ships.
UPDATE "larp" SET "cancelled_at" = now() - interval '60 days' WHERE "is_cancelled" = true;

-- AlterTable
ALTER TABLE "larp" DROP COLUMN "is_cancelled";
