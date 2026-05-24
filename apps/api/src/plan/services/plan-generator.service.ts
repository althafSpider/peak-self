import { BadRequestException, Injectable } from '@nestjs/common';

import { AIPlanService } from './ai-plan.service';
import { PlanPromptService } from './plan-prompt.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppLoggerService } from 'src/common/interceptors/logger/app-logger.service';
import { GeneratedPlanStatus, OnboardingStep } from '@repo/db';

@Injectable()
export class PlanGenerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly aiPlanService: AIPlanService,
    private readonly promptService: PlanPromptService,
  ) {}

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
        status: GeneratedPlanStatus.GENERATING,
      },
    });
    try {
      const prompt = this.promptService.build(onboarding);
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
          status: GeneratedPlanStatus.GENERATED,
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
          status: GeneratedPlanStatus.FAILED,
        },
      });

      this.logger.error(`Plan generation failed`, error.stack, {
        userId,
      });

      throw error;
    }
  }
}
