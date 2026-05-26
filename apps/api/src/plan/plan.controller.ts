import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { PlanGenerationService } from './services/plan-generator.service';
import { AIAnswerService } from './services/ai-answer.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { SubmitAIAnswersDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('plan')
export class PlanController {
  constructor( @Inject(AIAnswerService) private readonly aiAnswerService: AIAnswerService) {}
@UseGuards(JwtAuthGuard)
  @Post('submit-answers')
  submitAnswers(
    @CurrentUser('userId') userId: string,
    @Body() dto: SubmitAIAnswersDto,
  ) {
    return this.aiAnswerService.submitAnswers(userId, dto);
  }
}
