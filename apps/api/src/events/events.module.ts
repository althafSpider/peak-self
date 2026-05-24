import { Module } from '@nestjs/common';
import { DomainEventsService } from './services/domain-events.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DomainEventsService],
  exports: [DomainEventsService],
})
export class EventsModule {}
