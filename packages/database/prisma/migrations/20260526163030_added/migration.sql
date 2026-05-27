-- AlterTable
ALTER TABLE "generated_plans" ADD COLUMN     "last_error" TEXT,
ADD COLUMN     "last_failed_at" TIMESTAMP(3),
ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;
