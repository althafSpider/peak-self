import { Injectable } from '@nestjs/common';
import { UserOnboarding } from '@repo/db';

@Injectable()
export class PlanPromptService {
  build(onboarding: UserOnboarding): string {
    return `
You are an expert self-improvement system.

Your task is to generate a personalized habit improvement plan.

USER DATA:

Primary Goal:
${onboarding.primaryGoal}

Experience Level:
${onboarding.experienceLevel}

Available Time Per Day:
${onboarding.timeCommitmentMinutes} minutes

Current Blockers:
${onboarding.blockers.join(', ')}

RULES:

- Return ONLY valid JSON
- No markdown
- No explanations
- Generate between 3 and 5 habits
- Habits must be realistic
- Habits must fit within the user's time commitment

JSON FORMAT:

{
  "summary": "short summary",
  "habits": [
    {
      "title": "Habit title",
      "description": "Habit description",
      "frequency": "DAILY",
      "targetCount": 1
    }
  ]
}
`;
  }
}
