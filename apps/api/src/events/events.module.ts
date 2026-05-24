import { Module } from '@nestjs/common';
import { DomainEventsService } from './services/domain-events.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppLoggerModule } from 'src/common/interceptors/logger/logger.module';
import { DomainEventsProcessor } from './processors/domain-events.processor';
import { PlanModule } from 'src/plan/plan.module';

@Module({
  imports: [PrismaModule, AppLoggerModule, PlanModule],
  providers: [DomainEventsService, DomainEventsProcessor],
  exports: [DomainEventsService],
})
export class EventsModule {}
