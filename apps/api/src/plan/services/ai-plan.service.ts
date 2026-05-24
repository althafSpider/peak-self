import { Injectable } from '@nestjs/common';
import { AIGeneratedPlan } from '../types/ai-generated-plan.type';

@Injectable()
export class AIPlanService {
  async generatePlan(
    prompt: string,
  ): Promise<AIGeneratedPlan> {

    // MOCK RESPONSE FOR NOW

    return {
      summary:
        'Starter productivity improvement plan',

      habits: [
        {
          title: 'Morning Deep Work',
          description:
            'Focus without distractions for 45 minutes',
          frequency: 'DAILY',
          targetCount: 1,
        },
        {
          title: 'Evening Reflection',
          description:
            'Reflect on the day for 10 minutes',
          frequency: 'DAILY',
          targetCount: 1,
        },
      ],
    };
  }
}