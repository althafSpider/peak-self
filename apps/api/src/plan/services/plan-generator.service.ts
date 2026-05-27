import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { AIPlanService } from './ai-plan.service';
import { PlanPromptService } from './plan-prompt.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppLoggerService } from 'src/common/interceptors/logger/app-logger.service';
import {
  AIQuestion,
  AIQuestionType,
  GeneratedPlanStatus,
  OnboardingStep,
} from '@repo/db';
import { DOMAIN_EVENTS } from 'src/events/constants/domain-events.constant';

@Injectable()
export class PlanGenerationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AppLoggerService) private readonly logger: AppLoggerService,
    @Inject(AIPlanService) private readonly aiPlanService: AIPlanService,
    @Inject(PlanPromptService)
    private readonly promptService: PlanPromptService,
  ) {}

  async generatePlan(userId: string, generatedPlanId: string) {
    this.logger.log(`Generating AI plan for user ${userId}`);

    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      include: {
        aiQuestions: {
          include: { answers: true },
        },
      },
    });

    if (!onboarding) throw new BadRequestException('Onboarding not found');
    if (onboarding.currentStep !== OnboardingStep.COMPLETED) {
      throw new BadRequestException('Onboarding not completed');
    }

    await this.prisma.generatedPlan.update({
      where: { id: generatedPlanId },
      data: { status: GeneratedPlanStatus.PLAN_GENERATING },
    });

    try {
      const qaPairs =
        onboarding.aiQuestions
          ?.filter((q) => q.answers?.length > 0)
          .map((q) => ({
            question: q.question,
            answer: q.answers[0].answer,
            order: q.order,
          })) ?? [];

      const prompt = this.promptService.build(onboarding, qaPairs);
      const aiPlan = await this.aiPlanService.generatePlan(prompt);

      // Resolve or upsert skills referenced in the plan
      const allSkillCodes = [
        ...new Set([
          ...aiPlan.skills.map((s) => s.code),
          ...aiPlan.phases.flatMap((p) => [
            ...p.focusSkillCodes,
            ...p.habits.map((h) => h.skillCode).filter(Boolean),
          ]),
          ...aiPlan.goals.flatMap((g) => g.linkedSkillCodes ?? []),
        ]),
      ];

      const skills = await Promise.all(
        allSkillCodes.map((code) =>
          this.prisma.skill.upsert({
            where: { code },
            update: {},
            create: {
              code,
              name: code
                .split('_')
                .map((w) => w[0] + w.slice(1).toLowerCase())
                .join(' '),
            },
          }),
        ),
      );
      const skillByCode = Object.fromEntries(skills.map((s) => [s.code, s]));

      // Upsert UserSkills for all referenced skill codes
      await Promise.all(
        skills.map((skill) =>
          this.prisma.userSkill.upsert({
            where: {
              // add @@unique([userId, skillId]) to schema if not present
              userId_skillId: { userId, skillId: skill.id },
            },
            update: {},
            create: { userId, skillId: skill.id, score: 0, level: 1 },
          }),
        ),
      );

      // Persist phases, their skills, and habits
      for (const phaseData of aiPlan.phases) {
        const phase = await this.prisma.phase.upsert({
          where: { phaseOrder: phaseData.phaseOrder },
          update: {
            name: phaseData.name,
            description: phaseData.description,
            durationWeeks: phaseData.durationWeeks,
          },
          create: {
            name: phaseData.name,
            description: phaseData.description,
            phaseOrder: phaseData.phaseOrder,
            durationWeeks: phaseData.durationWeeks,
          },
        });

        // Link phase → skills
        await Promise.all(
          phaseData.focusSkillCodes.map((code) => {
            const skill = skillByCode[code];
            if (!skill) return;
            return this.prisma.phaseSkill.upsert({
              where: {
                phaseId_skillId: { phaseId: phase.id, skillId: skill.id },
              },
              update: {},
              create: { phaseId: phase.id, skillId: skill.id },
            });
          }),
        );

        // Create generated habits for this phase
        await this.prisma.generatedHabit.createMany({
          data: phaseData.habits.map((habit, index) => ({
            generatedPlanId,
            skillId: habit.skillCode
              ? skillByCode[habit.skillCode]?.id
              : undefined,
            title: habit.title,
            description: habit.description,
            reasoning: habit.reasoning,
            frequency: habit.frequency,
            targetCount: habit.targetCount,
            suggestedOrder: index,
          })),
        });
      }

      // Persist generated goals
      await this.prisma.generatedGoal.createMany({
        data: aiPlan.goals.map((goal) => ({
          generatedPlanId,
          title: goal.title,
          description: goal.description,
          category: goal.category,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
        })),
      });

      await this.prisma.generatedPlan.update({
        where: { id: generatedPlanId },
        data: {
          status: GeneratedPlanStatus.PLAN_GENERATED,
          generatedAt: new Date(),
          rawPrompt: prompt,
          rawResponse: JSON.stringify(aiPlan),
        },
      });

      this.logger.log(`Plan generated successfully for user ${userId}`);
      return generatedPlanId;
    } catch (error) {
      await this.prisma.generatedPlan.update({
        where: { id: generatedPlanId },
        data: {
          status: GeneratedPlanStatus.PLAN_FAILED,
          retryCount: { increment: 1 },
          lastFailedAt: new Date(),
          lastError:
            error instanceof Error
              ? JSON.stringify({
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                })
              : 'Unknown error',
        },
      });

      this.logger.error('Plan generation failed', error.stack, { userId });
      throw error;
    }
  }

  async generateQuestions(userId: string) {
    this.logger.log(`Generating AI questions for user ${userId}`);
    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
    });
    if (!onboarding) {
      throw new BadRequestException('Onboarding not found');
    }
    if (onboarding.currentStep !== OnboardingStep.COMPLETED) {
      throw new BadRequestException('Ai Questions generation not completed');
    }
    let generatedPlan = await this.prisma.generatedPlan.findFirst({
      where: {
        userId,
        isActive: true,
        status: { not: GeneratedPlanStatus.PENDING },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Create ONLY if none exists
    if (!generatedPlan) {
      generatedPlan = await this.prisma.generatedPlan.create({
        data: {
          userId,
          status: GeneratedPlanStatus.QUESTIONS_GENERATING,
          version: 1,
          isActive: true,
        },
      });
    } else {
      // Reuse existing plan lifecycle
      await this.prisma.generatedPlan.update({
        where: {
          id: generatedPlan.id,
        },
        data: {
          status: GeneratedPlanStatus.QUESTIONS_GENERATING,
        },
      });
      // Delete old failed questions before regenerating
      await this.prisma.aIQuestion.deleteMany({
        where: {
          generatedPlanId: generatedPlan.id,
        },
      });
    }
    try {
      const prompt = this.promptService.buildQuestionsPrompt(onboarding);
      const response = await this.aiPlanService.generateQuestions(prompt);

      const aiQuestions = response.questions || [];
      if (!Array.isArray(aiQuestions)) {
        throw new Error('Invalid AI questions response');
      }
      const genrateQuestion = await this.prisma.$transaction(async (tx) => {
        await tx.aIQuestion.createMany({
          data: aiQuestions?.map(
            (
              q: {
                question: string;
                questionType?: AIQuestionType;
                order?: number;
              },
              index: number,
            ) => ({
              generatedPlanId: generatedPlan.id,
              onboardingId: onboarding.id,

              question: q.question,
              questionType: q.questionType ?? AIQuestionType.TEXT,
              order: q.order ?? index,
            }),
          ),
        });
        await tx.generatedPlan.update({
          where: { id: generatedPlan.id },
          data: {
            status: GeneratedPlanStatus.QUESTIONS_READY,
            rawPrompt: prompt,
            rawResponse: JSON.stringify(response),
          },
        });
        await tx.domainEvent.create({
          data: {
            userId,
            eventType: DOMAIN_EVENTS.AI_QUESTIONS_GENERATED,
            entityType: 'ai_questions',
            entityId: generatedPlan.id,
            payload: {
              onboardingId: onboarding.id,
              questionsCount: aiQuestions.length,
            },
          },
        });
      });
      return genrateQuestion;
    } catch (error) {
      this.logger.error(`Questions generation failed`, error.stack, {
        userId,
      });
      await this.prisma.generatedPlan.update({
        where: {
          id: generatedPlan.id,
        },
        data: {
          status: GeneratedPlanStatus.QUESTIONS_FAILED,
          retryCount: { increment: 1 },
          lastFailedAt: new Date(),
          lastError:
            error instanceof Error
              ? JSON.stringify({
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                })
              : 'Unknown error',
        },
      });
    }
  }
}
