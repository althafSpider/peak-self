import { Injectable } from '@nestjs/common';
import { UserOnboarding } from '@repo/db';

@Injectable()
export class PlanPromptService {
  build(onboarding: UserOnboarding): string {
    return `
You are a self-improvement coach.

Generate a habit improvement plan.

User Goal:
${onboarding.primaryGoal}

Experience Level:
${onboarding.experienceLevel}

Time Commitment:
${onboarding.timeCommitmentMinutes} minutes daily

Blockers:
${onboarding.blockers.join(', ')}

Return JSON only.
`;
  }
}