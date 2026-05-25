/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ai_answers` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ai_questions` table. All the data in the column will be lost.
  - You are about to drop the column `generated_plan_id` on the `ai_questions` table. All the data in the column will be lost.
  - Changed the type of `answer` on the `ai_answers` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `onboarding_id` to the `ai_questions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AIQuestionType" AS ENUM ('TEXT', 'MULTIPLE_CHOICE', 'SCALE');

-- AlterEnum
ALTER TYPE "OnboardingStep" ADD VALUE 'AI_QUESTION';

-- DropForeignKey
ALTER TABLE "ai_questions" DROP CONSTRAINT "ai_questions_generated_plan_id_fkey";

-- AlterTable
ALTER TABLE "ai_answers" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "answer",
ADD COLUMN     "answer" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "ai_questions" DROP COLUMN "createdAt",
DROP COLUMN "generated_plan_id",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "onboarding_id" TEXT NOT NULL,
ADD COLUMN     "question_type" "AIQuestionType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "generated_plans" ADD COLUMN     "regeneration_reason" TEXT;

-- AlterTable
ALTER TABLE "user_onboarding" ADD COLUMN     "ai_questions_completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ai_questions_generated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ai_answers_user_id_idx" ON "ai_answers"("user_id");

-- CreateIndex
CREATE INDEX "ai_answers_question_id_idx" ON "ai_answers"("question_id");

-- CreateIndex
CREATE INDEX "ai_questions_onboarding_id_idx" ON "ai_questions"("onboarding_id");

-- AddForeignKey
ALTER TABLE "ai_questions" ADD CONSTRAINT "ai_questions_onboarding_id_fkey" FOREIGN KEY ("onboarding_id") REFERENCES "user_onboarding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
