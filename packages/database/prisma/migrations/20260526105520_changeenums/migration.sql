/*
  Warnings:

  - The values [ANSWERS_PENDING] on the enum `GeneratedPlanStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "GeneratedPlanStatus_new" AS ENUM ('PENDING', 'QUESTIONS_GENERATING', 'QUESTIONS_READY', 'ANSWERS_SUBMITTED', 'PLAN_GENERATING', 'PLAN_GENERATED', 'PLAN_FINALIZED', 'QUESTIONS_FAILED', 'PLAN_FAILED');
ALTER TABLE "public"."generated_plans" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "generated_plans" ALTER COLUMN "status" TYPE "GeneratedPlanStatus_new" USING ("status"::text::"GeneratedPlanStatus_new");
ALTER TYPE "GeneratedPlanStatus" RENAME TO "GeneratedPlanStatus_old";
ALTER TYPE "GeneratedPlanStatus_new" RENAME TO "GeneratedPlanStatus";
DROP TYPE "public"."GeneratedPlanStatus_old";
ALTER TABLE "generated_plans" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
