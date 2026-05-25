import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { OpenRouter } from '@openrouter/sdk';

import { AIGeneratedPlan } from '../types/ai-generated-plan.type';

@Injectable()
export class AIPlanService {
  private readonly client: OpenRouter;

  constructor() {
    this.client = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });
  }

  async generatePlan(
    prompt: string,
  ): Promise<AIGeneratedPlan> {
    
    try {
      const completion =
        await this.client.chat.send({
          chatRequest: {
              model: 'openrouter/free',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          },
        });

      const content =
        completion.choices?.[0]?.message
          ?.content;

      if (!content) {
        throw new Error(
          'Empty AI response',
        );
      }

      const parsed =
        JSON.parse(content) as AIGeneratedPlan;

      this.validatePlan(parsed);

      return parsed;
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to generate AI plan',
      );
    }
  }
 async generateQuestions(
    prompt: string,
  ) {
    try {
      const completion =
        await this.client.chat.send({
          chatRequest: {
            model:
              'google/gemini-2.5-flash-preview',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
          },
        });

      const content =
        completion.choices?.[0]?.message
          ?.content;

      if (!content) {
        throw new Error(
          'Empty AI response',
        );
      }

      return JSON.parse(content);
    } catch (error) {
      console.error(error);

      throw new InternalServerErrorException(
        'Failed to generate AI questions',
      );
    }
  }
  private validatePlan(
    plan: AIGeneratedPlan,
  ) {
    if (!plan.summary) {
      throw new Error(
        'Invalid AI response: missing summary',
      );
    }

    if (
      !Array.isArray(plan.habits)
    ) {
      throw new Error(
        'Invalid AI response: habits must be array',
      );
    }

    for (const habit of plan.habits) {
      if (!habit.title) {
        throw new Error(
          'Habit title missing',
        );
      }

      if (!habit.frequency) {
        throw new Error(
          'Habit frequency missing',
        );
      }
    }
  }
}