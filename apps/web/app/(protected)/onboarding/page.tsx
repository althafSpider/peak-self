"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRightIcon } from "lucide-react";

import { HyperText } from "@/components/ui/hyper-text";
import { Button } from "@/components/ui/button";

import Goals from "@/components/onboarding/Goals";
import Experince from "@/components/onboarding/Experince";
import TimeCommitment from "@/components/onboarding/TimeCommitment";
import Blockers from "@/components/onboarding/Blockers";
import CompleteOnboarding from "@/components/onboarding/CompleteOnboarding";
import SubmitAnswers from "@/components/onboarding/SubmitAnswers";
import { OnboardingStep, useOnboardingStore } from "@/features/store/onboarding.store";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { Typography } from "@/components/ui/typography";



const OnboardingPage = () => {
  const currentStep = useOnboardingStore(
    (state) => state.currentStep,
  );

  const nextStep = useOnboardingStore(
    (state) => state.nextStep,
  );

  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Welcome */}
        {currentStep === OnboardingStep.WELCOME && (
          <>
            <HyperText>
              Start your onboarding
            </HyperText>

            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
              }}
              className="mt-6 space-y-6"
            >
              <Typography variant="paragraph-lg" className="text-muted-foreground">
                An exciting journey awaits
                you. Let's build your
                personalized growth plan.
              </Typography>
              <Button
                variant="secondary"
                size="lg"
                icon={<ArrowRightIcon />}
                iconPosition="end"
                animateSize
                onClick={nextStep}
              >
                Get Started
              </Button>
            </motion.div>
          </>
        )}

        {/* Goals */}
        {currentStep ===
          OnboardingStep.GOALS && <Goals />}

        {/* Experience */}
        {currentStep ===
          OnboardingStep.EXPERIENCE && (
          <Experince />
        )}

        {/* Time Commitment */}
        {currentStep ===
          OnboardingStep.TIME_COMMITMENT && (
          <TimeCommitment />
        )}

        {/* Blockers */}
        {currentStep ===
          OnboardingStep.BLOCKERS && (
          <Blockers />
        )}

        {/* Complete Onboarding */}
        {currentStep ===
          OnboardingStep.COMPLETE && (
          <CompleteOnboarding />
        )}

        {/* AI Questions */}
        {currentStep ===
          OnboardingStep.AI_QUESTIONS && (
          <SubmitAnswers />
        )}
      </div>
      <OnboardingProgress />
    </div>
  );
};

export default OnboardingPage;