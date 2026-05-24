-- DropIndex
DROP INDEX "user_plans_user_id_key";

-- AlterTable
ALTER TABLE "generated_habits" ADD COLUMN     "reasoning" TEXT,
ADD COLUMN     "skill_id" TEXT;

-- AlterTable
ALTER TABLE "generated_plans" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "habits" ADD COLUMN     "source_generated_habit_id" TEXT;

-- CreateTable
CREATE TABLE "generated_goals" (
    "id" TEXT NOT NULL,
    "generated_plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "GoalCategory" NOT NULL,
    "target_date" TIMESTAMP(3),
    "accepted" BOOLEAN,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_phases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "scheduled_for" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_goals_generated_plan_id_idx" ON "generated_goals"("generated_plan_id");

-- CreateIndex
CREATE INDEX "user_phases_user_id_idx" ON "user_phases"("user_id");

-- CreateIndex
CREATE INDEX "user_phases_phase_id_idx" ON "user_phases"("phase_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_idx" ON "notifications"("user_id", "read");

-- CreateIndex
CREATE INDEX "domain_events_processed_idx" ON "domain_events"("processed");

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_source_generated_habit_id_fkey" FOREIGN KEY ("source_generated_habit_id") REFERENCES "generated_habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_habits" ADD CONSTRAINT "generated_habits_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_goals" ADD CONSTRAINT "generated_goals_generated_plan_id_fkey" FOREIGN KEY ("generated_plan_id") REFERENCES "generated_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_phases" ADD CONSTRAINT "user_phases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_phases" ADD CONSTRAINT "user_phases_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
