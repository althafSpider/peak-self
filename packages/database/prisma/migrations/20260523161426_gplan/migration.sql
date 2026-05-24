-- CreateEnum
CREATE TYPE "GeneratedPlanStatus" AS ENUM ('PENDING', 'GENERATING', 'GENERATED', 'FINALIZED', 'FAILED');

-- CreateTable
CREATE TABLE "generated_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "GeneratedPlanStatus" NOT NULL DEFAULT 'PENDING',
    "prompt_version" TEXT,
    "ai_model" TEXT,
    "raw_prompt" TEXT,
    "raw_response" JSONB,
    "generated_at" TIMESTAMP(3),
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_habits" (
    "id" TEXT NOT NULL,
    "generated_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" "HabitFrequency" NOT NULL,
    "target_count" INTEGER NOT NULL DEFAULT 1,
    "suggested_order" INTEGER NOT NULL DEFAULT 0,
    "accepted" BOOLEAN,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "generated_plan_id" TEXT,
    "current_phase_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_plans_user_id_idx" ON "generated_plans"("user_id");

-- CreateIndex
CREATE INDEX "generated_plans_status_idx" ON "generated_plans"("status");

-- CreateIndex
CREATE INDEX "generated_habits_generated_plan_id_idx" ON "generated_habits"("generated_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_plans_user_id_key" ON "user_plans"("user_id");

-- CreateIndex
CREATE INDEX "user_plans_user_id_idx" ON "user_plans"("user_id");

-- AddForeignKey
ALTER TABLE "generated_plans" ADD CONSTRAINT "generated_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_habits" ADD CONSTRAINT "generated_habits_generated_plan_id_fkey" FOREIGN KEY ("generated_plan_id") REFERENCES "generated_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_current_phase_id_fkey" FOREIGN KEY ("current_phase_id") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_generated_plan_id_fkey" FOREIGN KEY ("generated_plan_id") REFERENCES "generated_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
