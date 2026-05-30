import { create } from "zustand";

export enum OnboardingStep {
  WELCOME = "WELCOME",
  GOALS = "GOALS",
  EXPERIENCE = "EXPERIENCE",
  TIME_COMMITMENT = "TIME_COMMITMENT",
  BLOCKERS = "BLOCKERS",
  COMPLETE = "COMPLETE",
  AI_QUESTIONS = "AI_QUESTIONS",
}

interface OnboardingState {
  currentStep: OnboardingStep;

  primaryGoal: string;
  experienceLevel: string;
  timeCommitmentMinutes: number;
  blockers: string[];

  nextStep: () => void;
  previousStep: () => void;
  setGoal: (goal: string) => void;
  setExperience: (level: string) => void;
  setTimeCommitment: (minutes: number) => void;
  setBlockers: (blockers: string[]) => void;
  reset: () => void;
}

const steps = [
  OnboardingStep.WELCOME,
  OnboardingStep.GOALS,
  OnboardingStep.EXPERIENCE,
  OnboardingStep.TIME_COMMITMENT,
  OnboardingStep.BLOCKERS,
  OnboardingStep.COMPLETE,
  OnboardingStep.AI_QUESTIONS,
];

export const useOnboardingStore = create<OnboardingState>(
  (set, get) => ({
    currentStep: OnboardingStep.WELCOME,

    primaryGoal: "",
    experienceLevel: "",
    timeCommitmentMinutes: 30,
    blockers: [],

    nextStep: () => {
      const currentIndex = steps.indexOf(
        get().currentStep,
      );

      if (currentIndex < steps.length - 1) {
        set({
          currentStep:
            steps[currentIndex + 1],
        });
      }
    },

    previousStep: () => {
      const currentIndex = steps.indexOf(
        get().currentStep,
      );

      if (currentIndex > 0) {
        set({
          currentStep:
            steps[currentIndex - 1],
        });
      }
    },

    setGoal: (goal) =>
      set({
        primaryGoal: goal,
      }),

    setExperience: (level) =>
      set({
        experienceLevel: level,
      }),

    setTimeCommitment: (minutes) =>
      set({
        timeCommitmentMinutes: minutes,
      }),

    setBlockers: (blockers) =>
      set({
        blockers,
      }),

    reset: () =>
      set({
        currentStep: OnboardingStep.WELCOME,
        primaryGoal: "",
        experienceLevel: "",
        timeCommitmentMinutes: 30,
        blockers: [],
      }),
  }),
);