/*
  Warnings:

  - Added the required column `current_step` to the `user_onboarding` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('WELCOME', 'GOALS', 'EXPERIENCE', 'TIME_COMMITMENT', 'BLOCKERS', 'GENERATING_PLAN', 'COMPLETED');

-- AlterTable
ALTER TABLE "user_onboarding" DROP COLUMN "current_step",
ADD COLUMN     "current_step" "OnboardingStep" NOT NULL;
