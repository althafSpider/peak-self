import { Global, Module } from '@nestjs/common';
import { PlanController } from './plan.controller';
import { PlanGenerationService } from './services/plan-generator.service';
import { AIPlanService } from './services/ai-plan.service';
import { PlanPromptService } from './services/plan-prompt.service';
import { AppLoggerModule } from 'src/common/interceptors/logger/logger.module';

@Global()
@Module({
  imports: [AppLoggerModule],
  controllers: [PlanController],
  providers: [PlanGenerationService, AIPlanService, PlanPromptService],
  exports: [PlanGenerationService],
})
export class PlanModule {}
