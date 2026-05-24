-- CreateTable
CREATE TABLE "ai_questions" (
    "id" TEXT NOT NULL,
    "generated_plan_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_answers" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_questions" ADD CONSTRAINT "ai_questions_generated_plan_id_fkey" FOREIGN KEY ("generated_plan_id") REFERENCES "generated_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_answers" ADD CONSTRAINT "ai_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "ai_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_answers" ADD CONSTRAINT "ai_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
