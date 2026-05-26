import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { GeneratedPlanStatus, OnboardingStep } from '@repo/db';

import { PrismaService } from 'src/prisma/prisma.service';
import { AppLoggerService } from 'src/common/interceptors/logger/app-logger.service';
import { SubmitAIAnswersDto } from '../dto/submit-answer.dto';
import { DOMAIN_EVENTS } from 'src/events/constants/domain-events.constant';

@Injectable()
export class AIAnswerService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,

    @Inject(AppLoggerService)
    private readonly logger: AppLoggerService,
  ) {}

  async submitAnswers(userId: string, dto: SubmitAIAnswersDto) {
    this.logger.log(`Submitting AI answers for user ${userId}`);

    // 1. Validate onboarding
    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding not found');
    }

    if (onboarding.currentStep !== OnboardingStep.COMPLETED) {
      throw new BadRequestException('AI question step is not active');
    }

    // 2. Fetch generated questions + plan
    const generatedPlan = await this.prisma.generatedPlan.findFirst({
      where: { userId },
      include: {
        aiquestions: true,
      },
    });
    this.logger.log(`Found generated plan for user ${userId}`, JSON.stringify(generatedPlan, null, 2));
    if (!generatedPlan || !generatedPlan.aiquestions.length) {
      throw new BadRequestException('No AI questions found for this user');
    }

    const validQuestionIds = new Set(
      generatedPlan.aiquestions.map((q) => q.id),
    );

    // 3. Validate submitted answers
    for (const item of dto.answers) {
      if (!validQuestionIds.has(item.questionId)) {
        throw new BadRequestException(
          `Invalid question id: ${item.questionId}`,
        );
      }
    }

    // 4. Save answers in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete old answers if resubmission is allowed
      await tx.aIAnswer.deleteMany({
        where: {
          question: {
            generatedPlanId: generatedPlan.id,
          },
        },
      });

      // Create new answers
      await tx.aIAnswer.createMany({
        data: dto.answers.map((answer) => ({
          questionId: answer.questionId,
          userId,
          answer: answer.answer,
        })),
      });

      await tx.generatedPlan.update({
        where: { id: generatedPlan.id },
        data: {
          status: GeneratedPlanStatus.ANSWERS_SUBMITTED,
        },
      });
      await tx.domainEvent.create({
        data: {
          userId,
          eventType: DOMAIN_EVENTS.AI_QUESTIONS_ANSWERED,
          entityType: 'ai_questions',
          entityId: generatedPlan.id,
          payload: {
            answers: dto.answers.map((answer) => ({
              questionId: answer.questionId,
              answer: answer.answer,
            })),
          },
        },
      });
    });


    this.logger.log(
      `Successfully saved ${dto.answers.length} AI answers for user ${userId}`,
    );

    return {
      success: true,
      message: 'AI answers submitted successfully',
    };
  }
}
