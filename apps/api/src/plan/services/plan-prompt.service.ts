import { Injectable } from '@nestjs/common';
import { AIAnswer, AIQuestion, UserOnboarding } from '@repo/db';

interface QAPair {
  question: string;
  answer: unknown;
  order: number;
}

@Injectable()
export class PlanPromptService {
build(onboarding: UserOnboarding & { aiQuestions: (AIQuestion & { answers: AIAnswer[] })[] }, qaPairs?: QAPair[]): string {
  const qaSection = qaPairs && qaPairs.length > 0
    ? `
FOLLOW-UP Q&A FROM USER:
${qaPairs
  .sort((a, b) => a.order - b.order)
  .map((qa, i) => `Q${i + 1}: ${qa.question}\nA${i + 1}: ${JSON.stringify(qa.answer)}`)
  .join('\n\n')}

Use the user's answers above to tailor the plan precisely to their unique situation, preferences, and constraints.
`
    : '';

  return `
You are a Behavioural Intelligence System (BIS). Your role is to analyse a user's psychological profile, goals, blockers, and lived experience, then generate a comprehensive, science-backed self-improvement plan.

The plan must cover habits, goals, skill development, and a phased progression roadmap — all tightly coupled to each other and to the user's specific context.

━━━━━━━━━━━━━━━━━━━━━━━━
USER PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━

Primary Goal: ${onboarding.primaryGoal}
Experience Level: ${onboarding.experienceLevel}
Available Time Per Day: ${onboarding.timeCommitmentMinutes} minutes
Current Blockers: ${onboarding.blockers.join(', ')}
${qaSection}
━━━━━━━━━━━━━━━━━━━━━━━━
BEHAVIOURAL ANALYSIS RULES
━━━━━━━━━━━━━━━━━━━━━━━━

- Every habit must directly address at least one blocker or Q&A insight
- Skills must map to concrete behavioural competencies the user needs to develop
- Goals must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Phases must represent a realistic progression arc (Foundation → Development → Mastery)
- Habits in later phases must build on habits from earlier phases
- Time commitment for all daily habits combined must not exceed ${onboarding.timeCommitmentMinutes} minutes
- All recommendations must match the user's experience level (${onboarding.experienceLevel})

━━━━━━━━━━━━━━━━━━━━━━━━
SKILL CODES (use these exact codes when referencing skills)
━━━━━━━━━━━━━━━━━━━━━━━━

SELF_DISCIPLINE, FOCUS, RESILIENCE, EMOTIONAL_REGULATION, TIME_MANAGEMENT,
MINDFULNESS, PHYSICAL_HEALTH, SLEEP_HYGIENE, SOCIAL_CONNECTION, LEARNING_AGILITY,
STRESS_MANAGEMENT, MOTIVATION, CONFIDENCE, COMMUNICATION, PRODUCTIVITY

━━━━━━━━━━━━━━━━━━━━━━━━
GOAL CATEGORIES (use exactly one of these)
━━━━━━━━━━━━━━━━━━━━━━━━

FITNESS, PRODUCTIVITY, FINANCE, LEARNING, MENTAL_HEALTH, SOCIAL, SPIRITUAL, CAREER, OTHER

━━━━━━━━━━━━━━━━━━━━━━━━
HABIT FREQUENCY OPTIONS
━━━━━━━━━━━━━━━━━━━━━━━━

DAILY, WEEKLY, MONTHLY

━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━

- Return ONLY valid JSON — no markdown, no backticks, no explanations
- All string values must be non-empty
- targetDate must be an ISO 8601 date string (e.g. "2025-12-31T00:00:00.000Z")
- phaseOrder must be unique integers starting from 1
- Habits in later phases reference earlier phase habits in their reasoning
- Generate 2–3 phases, 3–5 habits per phase, 2–3 goals, 3–5 skills

━━━━━━━━━━━━━━━━━━━━━━━━
JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━

{
  "summary": "A 2–3 sentence behavioural summary explaining why this plan is designed the way it is for this specific user.",

  "behaviouralInsights": {
    "coreBlocker": "The single most critical blocker identified from the user's data",
    "keyStrength": "The user's most leverageable existing strength",
    "recommendedApproach": "The overarching behavioural strategy (e.g. habit stacking, implementation intentions, temptation bundling)"
  },

  "skills": [
    {
      "code": "SKILL_CODE_FROM_LIST_ABOVE",
      "reasoning": "Why this skill is essential for this user's specific goal and blockers"
    }
  ],

  "phases": [
    {
      "name": "Phase name (e.g. Foundation)",
      "description": "What this phase builds and why it comes first",
      "phaseOrder": 1,
      "durationWeeks": 4,
      "focusSkillCodes": ["SKILL_CODE_1", "SKILL_CODE_2"],
      "habits": [
        {
          "title": "Habit title",
          "description": "What the user does and how",
          "reasoning": "Why this habit — explicitly reference the user's blockers and/or Q&A answers",
          "frequency": "DAILY",
          "targetCount": 1,
          "estimatedMinutesPerSession": 10,
          "skillCode": "SKILL_CODE"
        }
      ]
    }
  ],

  "goals": [
    {
      "title": "Goal title",
      "description": "Specific, measurable outcome",
      "category": "CATEGORY_FROM_LIST_ABOVE",
      "targetDate": "ISO8601_DATE",
      "linkedSkillCodes": ["SKILL_CODE"],
      "successMetric": "How the user will concretely know they achieved this goal"
    }
  ]
}
`.trim();
}
  buildQuestionsPrompt(onboarding: UserOnboarding): string {
    return `
You are an expert behavioral coach.

Generate 3 personalized follow-up questions.

USER DATA:

Primary Goal:
${onboarding.primaryGoal}

Experience:
${onboarding.experienceLevel}

Time Commitment:
${onboarding.timeCommitmentMinutes}

Blockers:
${onboarding.blockers.join(', ')}

RULES:

- Questions must help personalize habits
- Questions must be concise
- Return ONLY valid JSON
- No markdown
- Must be raw brutal questions that can get an general overview of user
FORMAT:

{
  "questions": [
    {
      "question": "What distracts you most during work?",
      "questionType": "TEXT",
      "order": 1
    }
  ]
}
`;
  }
}
