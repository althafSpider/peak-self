/*
  Warnings:

  - Added the required column `generated_plan_id` to the `ai_questions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ai_questions" ADD COLUMN     "generated_plan_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "ai_questions" ADD CONSTRAINT "ai_questions_generated_plan_id_fkey" FOREIGN KEY ("generated_plan_id") REFERENCES "generated_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
