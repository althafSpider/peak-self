// import { OnboardingStep } from '@peak-self/domain';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ONBOARDING_TRANSITIONS } from './constants/onboarding-transitions';
import { AppLoggerService } from '../common/interceptors/logger/app-logger.service';
import { OnboardingStatus, OnboardingStep } from '@repo/db';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateGoalsDto } from './dto/update-goals.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { UpdateTimeCommitmentDto } from './dto/update-time-commitment.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @Inject(AppLoggerService) private readonly logger: AppLoggerService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}
  private assertCurrentStep(actual: OnboardingStep, expected: OnboardingStep) {
    if (actual !== expected) {
      this.logger.warn('Invalid onboarding step access', {
        actual,
        expected,
      });

      throw new BadRequestException(
        `Expected onboarding step ${expected}, got ${actual}`,
      );
    }
  }
  private async getCurrentOnboarding(userId: string) {
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

      await tx.domainEvent.create({
        data: {
          userId,
          eventType: 'onboarding.started',
          entityType: 'user_onboarding',
          entityId: createdOnboarding.id,
          payload: {
            step: OnboardingStep.WELCOME,
          },
        },
      });

      return createdOnboarding;
    });

    this.logger.log(`Onboarding started successfully for user ${userId}`);

    return onboarding;
  }

  async updateGoals(userId: string, dto: UpdateGoalsDto) {
    const onboarding = await this.getCurrentOnboarding(userId)

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

      await tx.domainEvent.create({
        data: {
          userId,
          eventType: 'onboarding.goals_completed',
          entityType: 'user_onboarding',
          entityId: updated.id,
          payload: {
            primaryGoal: dto.primaryGoal,
            nextStep: OnboardingStep.EXPERIENCE,
          },
        },
      });

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
      await tx.domainEvent.create({
        data: {
          userId,
          eventType: 'onboarding.experience_completed',
          entityType: 'user_onboarding',
          entityId: updated.id,
          payload: {
            experienceLevel: dto.experienceLevel,
            nextStep: OnboardingStep.TIME_COMMITMENT,
          },
        },
      });
      return updated;
    });
    return updatedOnboarding.currentStep;
  }

  async updateTimeCommitment(userId: string, dto: UpdateTimeCommitmentDto) {
    const onboarding = await this.getCurrentOnboarding(userId);
    this.assertCurrentStep(onboarding.currentStep, OnboardingStep.TIME_COMMITMENT);
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
      await tx.domainEvent.create({
        data: {
          userId,
          eventType: 'onboarding.time_commitment_completed',
          entityType: 'user_onboarding',
          entityId: updated.id,
          payload: {
            timeCommitmentMinutes: dto.timeCommitmentMinutes,
            nextStep: OnboardingStep.BLOCKERS,
          },
        },
      });
      return updated;
    });
    return updatedOnboarding.currentStep;
  }

  async updateBlockers(userId: string, blockers: string[]) {
    const onboarding = await this.getCurrentOnboarding(userId);
    this.assertCurrentStep(onboarding.currentStep, OnboardingStep.BLOCKERS);
    if (onboarding.blockers) {
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
          currentStep: OnboardingStep.GENERATING_PLAN,
        },
      });
      await tx.domainEvent.create({
        data: {
          userId,
          eventType: 'onboarding.blockers_completed',
          entityType: 'user_onboarding',
          entityId: updated.id,
          payload: {
            blockers,
            nextStep: OnboardingStep.GENERATING_PLAN,
          },
        },
      });
      return updated;
    });
    return updatedOnboarding.currentStep;
  }

 async completeOnboarding(userId: string) {
  this.logger.log(
    `Completing onboarding for user ${userId}`,
  );

  const onboarding = await this.getCurrentOnboarding(userId);

  // Validate workflow state
  this.assertCurrentStep(
    onboarding.currentStep,
    OnboardingStep.GENERATING_PLAN,
  );

  // Prevent duplicate completion
  if (onboarding.completedAt) {
    this.logger.warn(
      `Onboarding already completed for user ${userId}`,
    );

    return {
      currentStep:
        onboarding.currentStep,
    };
  }

  const completedOnboarding =
    await this.prisma.$transaction(
      async (tx) => {
        // Complete onboarding
        const updated =
          await tx.userOnboarding.update({
            where: { userId },
            data: {
              currentStep:
                OnboardingStep.COMPLETED,

              completedAt: new Date(),
            },
          });

        // Update profile state
        await tx.userProfile.update({
          where: { userId },
          data: {
            onboardingStatus:
              OnboardingStatus.COMPLETED,
          },
        });

        // Emit domain event
        await tx.domainEvent.create({
          data: {
            userId,
            eventType:
              'onboarding.completed',
            entityType:
              'user_onboarding',
            entityId: updated.id,
            payload: {
              completedAt:
                new Date().toISOString(),
            },
          },
        });

        return updated;
      },
    );

  this.logger.log(
    `Onboarding completed successfully for user ${userId}`,
    'OnboardingService',
    {
      userId,
    },
  );

  return {
    currentStep:
      completedOnboarding.currentStep,

    completedAt:
      completedOnboarding.completedAt,
  };
}
}
