/*
  Warnings:

  - A unique constraint covering the columns `[user_id,skill_id]` on the table `user_skills` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user_skills_user_id_skill_id_key" ON "user_skills"("user_id", "skill_id");
