import { OnboardingStep } from '@peak-self/domain';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ONBOARDING_TRANSITIONS } from './constants/onboarding-transitions';
import { AppLoggerService } from 'src/common/interceptors/logger/app-logger.service.ts';
import { prisma } from '@repo/db';

@Injectable()
export class OnboardingService {
  constructor(private readonly logger: AppLoggerService) {}

  async startOnboarding(userId: string) {
    this.logger.log(`Starting onboarding for user ${userId}`);

    const existingUser = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        
      },
    });
    if (!existingUser) throw new BadRequestException(`User ${userId} not found`);
  }

  async getCurrentOnboarding(userId: string) {}

  async updateGoals(userId: string, primaryGoal: string) {}

  async updateExperience(userId: string, experienceLevel: string) {}

  async updateTimeCommitment(userId: string, minutes: number) {}

  async updateBlockers(userId: string, blockers: string[]) {}

  async completeOnboarding(userId: string) {}

  private validateTransition(current: OnboardingStep, next: OnboardingStep) {
    const allowed = ONBOARDING_TRANSITIONS[current] as OnboardingStep[];

    if (!allowed?.includes(next)) {
      throw new BadRequestException(
        `Invalid onboarding transition from ${current} to ${next}`,
      );
    }
  }
}
