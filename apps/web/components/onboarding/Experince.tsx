"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../ui/button";
import { useOnboardingStore } from "@/features/store/onboarding.store";
import { Typography } from "../ui/typography";
import { Field, FieldDescription } from "@/components/ui/field";
import { OriginButton } from "../ui/origin-button";
import { OnboardingApi } from "@/lib/endpoints/Onboarding";
import { toast } from "sonner";
import { buttonVariants, containerVariants, errorVariants, inputVariants, itemVariants } from "@/features/onboarding/animateVariants";
import { ExperienceLevel } from "@/features/onboarding/enums";
import { Select, SelectOption } from "../ui/r-select";

interface ExperienceFormData {
  experienceLevel: ExperienceLevel;
}

// Map ExperienceLevel to select options with proper icons
const getOptions = (): SelectOption[] => [
  { 
    value: ExperienceLevel.BEGINNER, 
    label: "Beginner", 
  },
  { 
    value: ExperienceLevel.INTERMEDIATE, 
    label: "Intermediate", 
  },
  { 
    value: ExperienceLevel.ADVANCED, 
    label: "Advanced", 
  },
];

const Experience = () => {
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const previousStep = useOnboardingStore((state) => state.previousStep);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    trigger,
    setValue,
    watch,
  } = useForm<ExperienceFormData>({
    defaultValues: {
      experienceLevel: ExperienceLevel.BEGINNER,
    },
    mode: "onChange",
  });

  // Watch the experience level value
  const selectedExperienceLevel = watch("experienceLevel");
  
  // Local state for select component
  const [selectValue, setSelectValue] = useState<string | undefined>(
    ExperienceLevel.BEGINNER
  );

  // Sync select value with form
  useEffect(() => {
    if (selectValue && Object.values(ExperienceLevel).includes(selectValue as ExperienceLevel)) {
      setValue("experienceLevel", selectValue as ExperienceLevel);
      trigger("experienceLevel");
    }
  }, [selectValue, setValue, trigger]);

  const onSubmit = async (data: ExperienceFormData) => {
    try {
      await OnboardingApi.addExperience({ experienceLevel: data.experienceLevel });
      nextStep();
    } catch (error: any) {
      console.log(error);
      toast.error(
        error.data?.message || "Something went wrong. Please try again later.",
      );
      // TODO - Change this later, if status is 409 redirect to completed page or main menu
      nextStep();
    }
  };

  const options = getOptions();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Typography variant="h3">Select Your Experience Level</Typography>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Typography variant="paragraph-lg" className="text-muted-foreground">
          Choose your current experience level to help us personalize your learning journey.
        </Typography>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <motion.div variants={itemVariants}>
          <Field>
            <motion.div variants={inputVariants}>
              <Select
                className="w-full max-w-sm"
                onChange={setSelectValue}
                options={options}
                placeholder="Select your experience level..."
                value={selectValue}
              />
            </motion.div>

            {/* Hidden input for react-hook-form registration */}
            <input
              type="hidden"
              {...register("experienceLevel", {
                required: "Please select your experience level",
                validate: (value) => {
                  if (!value || !Object.values(ExperienceLevel).includes(value)) {
                    return "Please select a valid experience level";
                  }
                  return true;
                }
              })}
            />

            <AnimatePresence mode="wait">
              {errors.experienceLevel && (
                <motion.div
                  key="error"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription className="text-red-500">
                    {errors.experienceLevel.message}
                  </FieldDescription>
                </motion.div>
              )}
              {!errors.experienceLevel && (
                <motion.div
                  key="description"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription>
                    This will help us tailor the experience to best support your skill level.
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
              disabled={isSubmitting || !isValid || !selectedExperienceLevel}
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

export default Experience;