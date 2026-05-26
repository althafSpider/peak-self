// types/ai-generated-plan.type.ts

import { GoalCategory, HabitFrequency } from "@repo/db";


export interface AIGeneratedHabit {
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetCount: number;
}

export interface AIGeneratedPlan {
  summary: string;

  behaviouralInsights: {
    coreBlocker: string;
    keyStrength: string;
    recommendedApproach: string;
  };

  skills: {
    code: string;
    reasoning: string;
  }[];

  phases: {
    name: string;
    description: string;
    phaseOrder: number;
    durationWeeks: number;
    focusSkillCodes: string[];
    habits: {
      title: string;
      description: string;
      reasoning: string;
      frequency: HabitFrequency;
      targetCount: number;
      estimatedMinutesPerSession: number;
      skillCode: string;
    }[];
  }[];

  goals: {
    title: string;
    description: string;
    category: GoalCategory;
    targetDate: string;
    linkedSkillCodes: string[];
    successMetric: string;
  }[];
}