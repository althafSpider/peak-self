import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { AIPlanService } from './ai-plan.service';
import { PlanPromptService } from './plan-prompt.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppLoggerService } from 'src/common/interceptors/logger/app-logger.service';
import { AIQuestion, GeneratedPlanStatus, OnboardingStep } from '@repo/db';

@Injectable()
export class PlanGenerationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AppLoggerService) private readonly logger: AppLoggerService,
    @Inject(AIPlanService) private readonly aiPlanService: AIPlanService,
    @Inject(PlanPromptService) private readonly promptService: PlanPromptService,
  ) { }

  async generatePlan(userId: string) {
    this.logger.log(`Generating AI plan for user ${userId}`);
    //  first find onboarding
    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
    });
    if (!onboarding) {
      throw new BadRequestException('Onboarding not found');
    }
    // validate onboarding completed
    if (onboarding.currentStep !== OnboardingStep.COMPLETED) {
      throw new BadRequestException('Onboarding not completed');
    }
    // create generation record
    const generatedPlan = await this.prisma.generatedPlan.create({
      data: {
        userId,
        status: GeneratedPlanStatus.PLAN_GENERATING,
      },
    });
    try {
      const prompt =  this.promptService.build(onboarding);
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
    if (onboarding.currentStep !== OnboardingStep.AI_QUESTION) {
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
      const aiQuestions = await this.aiPlanService.generateQuestions(prompt);
      await this.prisma.aIQuestion.createMany({
        data: aiQuestions.map((question:AIQuestion, index) => ({
          generatedPlanId: genratedQuestions.id,
          question: question.question,
          onboardingId: onboarding.id,
          questionType: "TEXT",
          order: index,
        })),
      });
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
