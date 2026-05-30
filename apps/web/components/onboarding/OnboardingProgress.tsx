// components/onboarding/OnboardingProgress.tsx

"use client";

import { OnboardingStep, useOnboardingStore } from "@/features/store/onboarding.store";



const steps = [
  OnboardingStep.WELCOME,
  OnboardingStep.GOALS,
  OnboardingStep.EXPERIENCE,
  OnboardingStep.TIME_COMMITMENT,
  OnboardingStep.BLOCKERS,
  OnboardingStep.COMPLETE,
  OnboardingStep.AI_QUESTIONS,
];

export default function OnboardingProgress() {
  const currentStep = useOnboardingStore(
    (state) => state.currentStep,
  );

  const currentIndex = steps.indexOf(currentStep);

  const progress =
    ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed bottom-8 left-1/2 w-[400px] -translate-x-1/2">
      <div className="mb-2 flex justify-between text-sm text-muted-foreground">
        <span>
          Step {currentIndex + 1} of {steps.length}
        </span>

        <span>{Math.round(progress)}%</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
    </div>
  );
}