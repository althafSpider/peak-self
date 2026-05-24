import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { AppLoggerModule } from '../common/interceptors/logger/logger.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [AppLoggerModule, EventsModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
