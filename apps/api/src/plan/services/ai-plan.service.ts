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
            model:'openrouter/free',
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
private validatePlan(plan: AIGeneratedPlan): void {
  if (!plan.summary) {
    throw new Error('Invalid AI response: missing summary');
  }

  if (!plan.behaviouralInsights) {
    throw new Error('Invalid AI response: missing behaviouralInsights');
  }

  if (
    !plan.behaviouralInsights.coreBlocker ||
    !plan.behaviouralInsights.keyStrength ||
    !plan.behaviouralInsights.recommendedApproach
  ) {
    throw new Error('Invalid AI response: incomplete behaviouralInsights');
  }

  if (!Array.isArray(plan.skills) || plan.skills.length === 0) {
    throw new Error('Invalid AI response: skills must be a non-empty array');
  }

  for (const skill of plan.skills) {
    if (!skill.code) throw new Error('Invalid AI response: skill missing code');
    if (!skill.reasoning) throw new Error('Invalid AI response: skill missing reasoning');
  }

  if (!Array.isArray(plan.phases) || plan.phases.length === 0) {
    throw new Error('Invalid AI response: phases must be a non-empty array');
  }

  for (const phase of plan.phases) {
    if (!phase.name) throw new Error('Phase missing name');
    if (!phase.description) throw new Error('Phase missing description');
    if (typeof phase.phaseOrder !== 'number') throw new Error('Phase missing phaseOrder');
    if (typeof phase.durationWeeks !== 'number') throw new Error('Phase missing durationWeeks');
    if (!Array.isArray(phase.focusSkillCodes) || phase.focusSkillCodes.length === 0) {
      throw new Error(`Phase "${phase.name}": focusSkillCodes must be a non-empty array`);
    }
    if (!Array.isArray(phase.habits) || phase.habits.length === 0) {
      throw new Error(`Phase "${phase.name}": habits must be a non-empty array`);
    }

    for (const habit of phase.habits) {
      if (!habit.title) throw new Error(`Phase "${phase.name}": habit missing title`);
      if (!habit.frequency) throw new Error(`Phase "${phase.name}": habit missing frequency`);
      if (!habit.reasoning) throw new Error(`Phase "${phase.name}": habit missing reasoning`);
      if (!habit.skillCode) throw new Error(`Phase "${phase.name}": habit missing skillCode`);
      if (typeof habit.targetCount !== 'number') throw new Error(`Phase "${phase.name}": habit missing targetCount`);
      if (typeof habit.estimatedMinutesPerSession !== 'number') {
        throw new Error(`Phase "${phase.name}": habit missing estimatedMinutesPerSession`);
      }
    }
  }

  const phaseOrders = plan.phases.map((p) => p.phaseOrder);
  if (new Set(phaseOrders).size !== phaseOrders.length) {
    throw new Error('Invalid AI response: duplicate phaseOrder values');
  }

  if (!Array.isArray(plan.goals) || plan.goals.length === 0) {
    throw new Error('Invalid AI response: goals must be a non-empty array');
  }

  for (const goal of plan.goals) {
    if (!goal.title) throw new Error('Goal missing title');
    if (!goal.description) throw new Error('Goal missing description');
    if (!goal.category) throw new Error('Goal missing category');
    if (!goal.successMetric) throw new Error('Goal missing successMetric');
    if (!Array.isArray(goal.linkedSkillCodes) || goal.linkedSkillCodes.length === 0) {
      throw new Error(`Goal "${goal.title}": linkedSkillCodes must be a non-empty array`);
    }
    if (goal.targetDate && isNaN(Date.parse(goal.targetDate))) {
      throw new Error(`Goal "${goal.title}": targetDate is not a valid ISO 8601 date`);
    }
  }
}
}