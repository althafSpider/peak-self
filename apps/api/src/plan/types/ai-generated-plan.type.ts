// types/ai-generated-plan.type.ts

import { HabitFrequency } from "@repo/db";


export interface AIGeneratedHabit {
  title: string;
  description?: string;
  frequency: HabitFrequency;
  targetCount: number;
}

export interface AIGeneratedPlan {
  summary?: string;
  habits: AIGeneratedHabit[];
}