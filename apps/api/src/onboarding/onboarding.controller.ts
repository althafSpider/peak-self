import { Controller, Post } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}
  
  @Post('start')
  startOnboarding() {
    return this.onboardingService.startOnboarding('userId');
  }
  @Post('goals')
  updateGoals() {
    return this.onboardingService.updateGoals('userId', 'primaryGoal');
  }
  @Post('experience')
  updateExperience() {
    return this.onboardingService.updateExperience('userId', 'experienceLevel');
  }
  
}
