import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppLoggerService } from '../common/interceptors/logger/app-logger.service';
import { OnboardingStatus, OnboardingStep } from '@repo/db';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateGoalsDto } from './dto/update-goals.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { UpdateTimeCommitmentDto } from './dto/update-time-commitment.dto';
import { DOMAIN_EVENTS } from 'src/events/constants/domain-events.constant';
import { DomainEventsService } from 'src/events/services/domain-events.service';

@Injectable()
export class OnboardingService {
  constructor(
    @Inject(AppLoggerService) private readonly logger: AppLoggerService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DomainEventsService)
    private readonly domainEventsService: DomainEventsService,
  ) {}
  private assertCurrentStep(actual: OnboardingStep, expected: OnboardingStep) {
    if (actual !== expected) {
      this.logger.warn('Invalid onboarding step access', {
        actual,
        expected,
      });
      if (actual === OnboardingStep.COMPLETED)
        throw new ConflictException('Onboarding already completed');
      throw new BadRequestException(
        `Expected onboarding step ${expected}, got ${actual}`,
      );
    }
  }
   async getCurrentOnboarding(userId: string) {
    const onboarding = await this.prisma.userOnboarding.findUnique({
      where: { userId },
    });

    if (!onboarding) {
      throw new NotFoundException('Onboarding not found');
    }
    return onboarding;
  }

  async startOnboarding(userId: string) {
    this.logger.log(`Starting onboarding for user ${userId}`);

    const existingUser = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        onboarding: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    if (existingUser.profile?.onboardingStatus === OnboardingStatus.COMPLETED) {
      throw new BadRequestException('Onboarding already completed');
    }

    if (existingUser.onboarding) {
      this.logger.warn(`Onboarding already exists for user ${userId}`);

      return existingUser.onboarding;
    }

    const onboarding = await this.prisma.$transaction(async (tx) => {
      const createdOnboarding = await tx.userOnboarding.create({
        data: {
          userId,
          currentStep: OnboardingStep.GOALS,
        },
      });

      if (!existingUser.profile) {
        await tx.userProfile.create({
          data: {
            userId,
            onboardingStatus: OnboardingStatus.IN_PROGRESS,
          },
        });
      } else {
        await tx.userProfile.update({
          where: { userId },
          data: {
            onboardingStatus: OnboardingStatus.IN_PROGRESS,
          },
        });
      }

      await this.domainEventsService.publish({
        userId,
        eventType: DOMAIN_EVENTS.ONBOARDING_STARTED,
        entityType: 'user_onboarding',
        entityId: createdOnboarding.id,
        payload: {
          nextStep: OnboardingStep.GOALS,
        },
      }, tx);

      return createdOnboarding;
    });

    this.logger.log(`Onboarding started successfully for user ${userId}`);

    return onboarding;
  }

  async updateGoals(userId: string, dto: UpdateGoalsDto) {
    const onboarding = await this.getCurrentOnboarding(userId);
    this.assertCurrentStep(onboarding.currentStep, OnboardingStep.GOALS);

    // Optional idempotency protection
    if (onboarding.primaryGoal) {
      this.logger.warn(`Goals already submitted for user ${userId}`);

      return {
        currentStep: onboarding.currentStep,
      };
    }

    const updatedOnboarding = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.userOnboarding.update({
        where: { userId },
        data: {
          primaryGoal: dto.primaryGoal,

          currentStep: OnboardingStep.EXPERIENCE,
        },
      });

      await this.domainEventsService.publish({
        userId,
        eventType: DOMAIN_EVENTS.ONBOARDING_GOALS_COMPLETED,
        entityType: 'user_onboarding',
        entityId: updated.id,
        payload: {
          primaryGoal: dto.primaryGoal,
          nextStep: OnboardingStep.EXPERIENCE,
        },
      }, tx);

      return updated;
    });

    this.logger.log(`Goals completed for user ${userId}`, 'OnboardingService', {
      userId,
      nextStep: OnboardingStep.EXPERIENCE,
    });

    return {
      currentStep: updatedOnboarding.currentStep,
    };
  }

  async updateExperience(userId: string, dto: UpdateExperienceDto) {
    const onboarding = await this.getCurrentOnboarding(userId);
    this.assertCurrentStep(onboarding.currentStep, OnboardingStep.EXPERIENCE);
    if (onboarding.experienceLevel) {
      this.logger.warn(`Experience already submitted for user ${userId}`);

      return {
        currentStep: onboarding.currentStep,
      };
    }
    const updatedOnboarding = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.userOnboarding.update({
        where: { userId },
        data: {
          experienceLevel: dto.experienceLevel,
          currentStep: OnboardingStep.TIME_COMMITMENT,
        },
      });
      await this.domainEventsService.publish({
          userId,
          eventType: DOMAIN_EVENTS.ONBOARDING_EXPERIENCE_COMPLETED,
          entityType: 'user_onboarding',
          entityId: updated.id,
          payload: {
            experienceLevel: dto.experienceLevel,
            nextStep: OnboardingStep.TIME_COMMITMENT,
        },
      }, tx);
      return updated;
    });
    return updatedOnboarding.currentStep;
  }

  async updateTimeCommitment(userId: string, dto: UpdateTimeCommitmentDto) {
    const onboarding = await this.getCurrentOnboarding(userId);
    this.assertCurrentStep(
      onboarding.currentStep,
      OnboardingStep.TIME_COMMITMENT,
    );
    if (onboarding.timeCommitmentMinutes) {
      this.logger.warn(`Time commitment already submitted for user ${userId}`);

      return {
        currentStep: onboarding.currentStep,
      };
    }
    const updatedOnboarding = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.userOnboarding.update({
        where: { userId },
        data: {
          timeCommitmentMinutes: dto.timeCommitmentMinutes,
          currentStep: OnboardingStep.BLOCKERS,
        },
      });
      await this.domainEventsService.publish({
          userId,
          eventType: DOMAIN_EVENTS.ONBOARDING_TIME_COMMITMENT_COMPLETED,
          entityType: 'user_onboarding',
          entityId: updated.id,
          payload: {
            timeCommitmentMinutes: dto.timeCommitmentMinutes,
            nextStep: OnboardingStep.BLOCKERS,
        },
      }, tx);
      return updated;
    });
    return updatedOnboarding.currentStep;
  }
  async updateBlockers(userId: string, blockers: string[]) {
    const onboarding = await this.getCurrentOnboarding(userId);
    this.assertCurrentStep(onboarding.currentStep, OnboardingStep.BLOCKERS);
    if (onboarding.blockers?.length > 0) {
      this.logger.warn(`Blockers already submitted for user ${userId}`);

      return {
        currentStep: onboarding.currentStep,
      };
    }
    const updatedOnboarding = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.userOnboarding.update({
        where: { userId },
        data: {
          blockers,
          currentStep: OnboardingStep.AI_QUESTION,
        },
      });

      await this.domainEventsService.publish({
        userId,
        eventType: DOMAIN_EVENTS.ONBOARDING_BLOCKERS_COMPLETED,
        entityType: 'user_onboarding',
        entityId: updated.id,
        payload: {
          blockers,
          nextStep: OnboardingStep.AI_QUESTION,
        },
      }, tx);
      return updated;
    });
    return updatedOnboarding.currentStep;
  }

  async completeOnboarding(userId: string) {
    this.logger.log(`Completing onboarding for user ${userId}`);

    const onboarding = await this.getCurrentOnboarding(userId);

    // Validate workflow state
    this.assertCurrentStep(
      onboarding.currentStep,
      OnboardingStep.GENERATING_PLAN,
    );

    // Prevent duplicate completion
    if (onboarding.completedAt) {
      this.logger.warn(`Onboarding already completed for user ${userId}`);

      return {
        currentStep: onboarding.currentStep,
      };
    }

    const completedOnboarding = await this.prisma.$transaction(async (tx) => {
      // Complete onboarding
      const updated = await tx.userOnboarding.update({
        where: { userId },
        data: {
          currentStep: OnboardingStep.COMPLETED,

          completedAt: new Date(),
        },
      });

      // Update profile state
      await tx.userProfile.update({
        where: { userId },
        data: {
          onboardingStatus: OnboardingStatus.COMPLETED,
        },
      });

      // Emit domain event
      await this.domainEventsService.publish({
          userId,
          eventType: DOMAIN_EVENTS.ONBOARDING_COMPLETED,
          entityType: 'user_onboarding',
          entityId: updated.id,
          payload: {
            completedAt: new Date().toISOString(),
        },
      }, tx);

      return updated;
    });

    this.logger.log(
      `Onboarding completed successfully for user ${userId}`,
      'OnboardingService',
      {
        userId,
      },
    );

    return {
      currentStep: completedOnboarding.currentStep,

      completedAt: completedOnboarding.completedAt,
    };
  }
}
