// src/modules/events/processors/domain-events.processor.ts

import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { DomainEvent } from '@repo/db';
import { AppLoggerService } from 'src/common/interceptors/logger/app-logger.service';
import { PlanGenerationService } from 'src/plan/services/plan-generator.service';
import { PrismaService } from 'src/prisma/prisma.service';



@Injectable()
export class DomainEventsProcessor
  implements OnModuleInit
{
  private readonly POLLING_INTERVAL =
    5000;

  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly planGenerationService: PlanGenerationService,
  ) {}

  onModuleInit() {
    setInterval(async () => {
      await this.processUnprocessedEvents();
    }, this.POLLING_INTERVAL);
  }

  async processUnprocessedEvents() {
    // Prevent overlapping executions
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const events =
        await this.prisma.domainEvent.findMany({
          where: {
            processed: false,
          },

          orderBy: {
            createdAt: 'asc',
          },

          take: 20,
        });

      if (events.length === 0) {
        return;
      }

      this.logger.log(
        `Processing ${events.length} domain events`,
      );

      for (const event of events) {
        await this.processSingleEvent(event);
      }
    } catch (error) {
      this.logger.error(
        'Failed processing domain events',
        error.stack,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  private async processSingleEvent(
    event: DomainEvent,
  ) {
    try {
      this.logger.log(
        `Processing event ${event.eventType}`,
        'DomainEventsProcessor',
        {
          eventId: event.id,
          userId: event.userId,
        },
      );

      await this.routeEvent(event);

      await this.prisma.domainEvent.update({
        where: {
          id: event.id,
        },

        data: {
          processed: true,
        },
      });

      this.logger.log(
        `Event processed successfully`,
        'DomainEventsProcessor',
        {
          eventId: event.id,
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed processing event ${event.id}`,
        error.stack,
        {
          eventType: event.eventType,
          userId: event.userId,
        },
      );
    }
  }

  private async routeEvent(
    event: DomainEvent,
  ) {
    switch (event.eventType) {
      case 'onboarding.completed':
        await this.handleOnboardingCompleted(
          event,
        );
        break;

      default:
        this.logger.warn(
          `Unhandled event type: ${event.eventType}`,
          {
            eventId: event.id,
          },
        );
    }
  }

  private async handleOnboardingCompleted(
    event: DomainEvent,
  ) {
    if (!event.userId) {
      throw new Error(
        'Missing userId in onboarding.completed event',
      );
    }

    this.logger.log(
      `Handling onboarding completion for user ${event.userId}`,
    );

    await this.planGenerationService.generatePlan(
      event.userId,
    );
  }
}