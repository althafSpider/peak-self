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
    //  first find onboarding
    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
      include:{
        aiQuestions:{
          include:{
            answers:true
          }
        }
      }
    });
    if (!onboarding) {
      throw new BadRequestException('Onboarding not found');
    }
    // validate onboarding completed
    if (onboarding.currentStep !== OnboardingStep.COMPLETED) {
      throw new BadRequestException('Onboarding not completed');
    }
    // create generation record
    const generatedPlan = await this.prisma.generatedPlan.update({
      where: { id: generatedPlanId },
      data: {
        userId,
        status: GeneratedPlanStatus.PLAN_GENERATING,
      },
    });
    try {
      const qaPairs = onboarding.aiQuestions
        ?.filter((q) => q.answers && q.answers.length > 0)
        .map((q) => ({
          question: q.question,
          answer: q.answers[0].answer,
          order: q.order,
        })) ?? [];
      const prompt = this.promptService.build(onboarding, qaPairs);
      const aiPlan = await this.aiPlanService.generatePlan(prompt);
      await this.prisma.generatedHabit.createMany({
        data: aiPlan.habits.map((habit, index) => ({
          generatedPlanId: generatedPlan.id,
          title: habit.title,
          description: habit.description,
          frequency: habit.frequency,
          targetCount: habit.targetCount,
          suggestedOrder: index,
        })),
      });
      //!!ToDO 1-gnerate goals phase and other datas also,currently we are only genraating gaols for the dummy purpose

      await this.prisma.generatedPlan.update({
        where: {
          id: generatedPlan.id,
        },
        data: {
          status: GeneratedPlanStatus.PLAN_GENERATED,
          generatedAt: new Date(),
          rawPrompt: prompt,
          rawResponse: JSON.stringify(aiPlan),
        },
      });

      this.logger.log(`Plan generated successfully for user ${userId}`);
      return generatedPlan.id;
    } catch (error) {
      await this.prisma.generatedPlan.update({
        where: {
          id: generatedPlan.id,
        },
        data: {
          status: GeneratedPlanStatus.PLAN_FAILED,
        },
      });

      this.logger.error(`Plan generation failed`, error.stack, {
        userId,
      });

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

    const genratedQuestions = await this.prisma.generatedPlan.create({
      data: {
        userId,
        status: GeneratedPlanStatus.QUESTIONS_GENERATING,
      },
    });
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
              generatedPlanId: genratedQuestions.id,
              onboardingId: onboarding.id,
              
              question: q.question,
              questionType: q.questionType ?? AIQuestionType.TEXT,
              order: q.order ?? index,
            }),
          ),
        });
        await tx.generatedPlan.update({
          where: { id: genratedQuestions.id },
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
            entityId: genratedQuestions.id,
            payload: {
              onboardingId: onboarding.id,
              questionsCount: aiQuestions.length,
            },
          },
        });
      });
      return genrateQuestion
    } catch (error) {
      this.logger.error(`Questions generation failed`, error.stack, {
        userId,
      });
      await this.prisma.generatedPlan.update({
        where: {
          id: genratedQuestions.id,
        },
        data: {
          status: GeneratedPlanStatus.QUESTIONS_FAILED,
        },
      });
    }
  }
}
