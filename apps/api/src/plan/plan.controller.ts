import { Controller } from '@nestjs/common';
import { PlanGenerationService } from './services/plan-generator.service';

@Controller('plan')
export class PlanController {
  constructor(private readonly planService: PlanGenerationService) {}
}
