import {
  Body,
  Controller,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateGoalsDto } from './dto/update-goals.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { UpdateTimeCommitmentDto } from './dto/update-time-commitment.dto';
import { UpdateBlockersDto } from './dto/update-blockers.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('onboarding')
export class OnboardingController {
  constructor(
    @Inject(OnboardingService) private readonly onboardingService: OnboardingService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('start')
  startOnboarding(@CurrentUser('userId') userId: string) {
    return this.onboardingService.startOnboarding(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('goals')
  updateGoals(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateGoalsDto,
  ) {
    return this.onboardingService.updateGoals(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('experience')
  updateExperience(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.onboardingService.updateExperience(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('time-commitment')
  updateTimeCommitment(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateTimeCommitmentDto,
  ) {
    return this.onboardingService.updateTimeCommitment(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('blockers')
  updateBlockers(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateBlockersDto,
  ) {
    return this.onboardingService.updateBlockers(userId, dto.blockers);
  }

  @UseGuards(JwtAuthGuard)
  @Post('complete')
  completeOnboarding(@CurrentUser('userId') userId: string) {
    return this.onboardingService.completeOnboarding(userId);
  }
  @UseGuards(JwtAuthGuard)
  @Post('me')
  getProgress(@CurrentUser('userId') userId: string) {
    return this.onboardingService.getCurrentOnboarding(userId);
  }
}
