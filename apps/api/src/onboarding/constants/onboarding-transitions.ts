import { OnboardingStep } from "@peak-self/domain";

export const ONBOARDING_TRANSITIONS = {
  [OnboardingStep.WELCOME]: [
    OnboardingStep.GOALS,
  ],

  [OnboardingStep.GOALS]: [
    OnboardingStep.EXPERIENCE,
  ],

  [OnboardingStep.EXPERIENCE]: [
    OnboardingStep.TIME_COMMITMENT,
  ],

  [OnboardingStep.TIME_COMMITMENT]: [
    OnboardingStep.BLOCKERS,
  ],

  [OnboardingStep.BLOCKERS]: [
    OnboardingStep.GENERATING_PLAN,
  ],

  [OnboardingStep.GENERATING_PLAN]: [
    OnboardingStep.COMPLETED,
  ],

  [OnboardingStep.COMPLETED]: [],
};