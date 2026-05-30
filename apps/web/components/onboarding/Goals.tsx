"use client";
import React from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { useOnboardingStore } from "@/features/store/onboarding.store";
import { Typography } from "../ui/typography";
import { Field, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OriginButton } from "../ui/origin-button";
import { OnboardingApi } from "@/lib/endpoints/Onboarding";
import { toast } from "sonner";
import { buttonVariants, containerVariants, errorVariants, inputVariants, itemVariants } from "@/features/onboarding/animateVariants";

interface GoalsFormData {
  primaryGoal: string;
}

const Goals = () => {
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const previousStep = useOnboardingStore((state) => state.previousStep);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    trigger,
  } = useForm<GoalsFormData>({
    defaultValues: {
      primaryGoal: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: GoalsFormData) => {
    try {
      await OnboardingApi.addGoal(data);

      nextStep();
    } catch (error: any) {
      console.log(error);
      toast.error(
        error.data.message || "Something went wrong. Please try again later.",
      );
      // !!TODO - Change this later,if status is 409 redirct to completed page or main menu and remove below function
      nextStep();
    }
  };

 

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Typography variant="h3">Enter Your Primary Goal</Typography>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Typography variant="paragraph-lg" className="text-muted-foreground">
          What is your primary goal for using this platform?
        </Typography>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <motion.div variants={itemVariants} whileHover="focus" animate="blur">
          <Field>
            <motion.div variants={inputVariants}>
              <Input
                id="primaryGoal"
                type="text"
                placeholder="e.g., Learn new skills, Network with professionals, Find job opportunities"
                {...register("primaryGoal", {
                  required: "Primary goal is required",
                  minLength: {
                    value: 5,
                    message: "Goal must be at least 5 characters",
                  },
                  maxLength: {
                    value: 100,
                    message: "Goal must not exceed 100 characters",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9\s\-',.!?]+$/,
                    message:
                      "Please enter a valid goal (letters, numbers, spaces, and basic punctuation only)",
                  },
                })}
                onChange={(e) => {
                  register("primaryGoal").onChange(e);
                  trigger("primaryGoal");
                }}
                className={
                  errors.primaryGoal ? "border-red-500 focus:ring-red-500" : ""
                }
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {errors.primaryGoal && (
                <motion.div
                  key="error"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription className="text-red-500">
                    {errors.primaryGoal.message}
                  </FieldDescription>
                </motion.div>
              )}
              {!errors.primaryGoal && (
                <motion.div
                  key="description"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription>
                    This will help us tailor the experience to best support you.
                  </FieldDescription>
                </motion.div>
              )}
            </AnimatePresence>
          </Field>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-4">
          <motion.div
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <OriginButton
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !isValid}
              className="relative overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Processing...
                  </motion.div>
                ) : (
                  <motion.div
                    key="continue"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    Continue
                  </motion.div>
                )}
              </AnimatePresence>
            </OriginButton>
          </motion.div>

          <motion.div
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <Button onClick={previousStep} variant="secondary" type="button">
              Back
            </Button>
          </motion.div>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default Goals;
