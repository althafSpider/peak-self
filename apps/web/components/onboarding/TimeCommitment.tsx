import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { useOnboardingStore } from '@/features/store/onboarding.store';
import { WheelPicker, WheelPickerOption, WheelPickerWrapper } from '../ui/wheel-picker';
import { Typography } from '../ui/typography';
import { Field, FieldDescription } from '@/components/ui/field';
import { OriginButton } from '../ui/origin-button';
import { OnboardingApi } from '@/lib/endpoints/Onboarding';
import { toast } from 'sonner';
import { buttonVariants, containerVariants, errorVariants, itemVariants } from '@/features/onboarding/animateVariants';
import { Clock } from 'lucide-react';
import { MobiusLoopIcon } from '../ui/mobius-loop-icon';

interface TimeCommitmentFormData {
  timeCommitment: number; // Total minutes to be sent to API
}

// Create hour options (1-6 hours max)
const createHourOptions = (maxHours: number = 5): WheelPickerOption<number>[] => {
  return Array.from({ length: maxHours }, (_, i) => {
    const value = i + 1;
    return {
      label: value === 1 ? `${value} hour` : `${value} hours`,
      value: value,
    };
  });
};

// Create minute options (only 00, 15, 30, 45)
const createMinuteOptions = (): WheelPickerOption<number>[] => {
  const minuteValues = [0, 15, 30, 45];
  return minuteValues.map((value) => ({
    label: value.toString().padStart(2, "0"),
    value: value,
  }));
};

const hourOptions = createHourOptions(5); // Max 6 hours
const minuteOptions = createMinuteOptions();

const TimeCommitment = () => {
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const previousStep = useOnboardingStore((state) => state.previousStep);
  
  const [selectedHours, setSelectedHours] = useState<number>(1);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(0);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setValue,
    trigger,
    watch,
  } = useForm<TimeCommitmentFormData>({
    defaultValues: {
      timeCommitment: 60, // 1 hour = 60 minutes
    },
    mode: "onChange",
  });

  const watchedTimeCommitment = watch("timeCommitment");

  // Validation rules
  const validateTimeCommitment = (value: number) => {
    if (!value || value === 0) {
      return "Please select a time commitment";
    }
    if (value < 15) {
      return "Minimum time commitment is 15 minutes";
    }
    if (value > 300) {
      return "You don't need to put much time for self improvement, enjoy your day!";
    }
    if (value % 15 !== 0) {
      return "Time commitment must be in increments of 15 minutes";
    }
    return true;
  };

  // Calculate total minutes and update form when wheel picker values change
  useEffect(() => {
    const totalMinutes = (selectedHours * 60) + selectedMinutes;
    setValue("timeCommitment", totalMinutes, { 
      shouldValidate: true,
      shouldDirty: true 
    });
    trigger("timeCommitment");
  }, [selectedHours, selectedMinutes, setValue, trigger]);

  const onSubmit = async (data: TimeCommitmentFormData) => {
    try {
      // Send total minutes to API — DTO expects { timeCommitmentMinutes: number }
      await OnboardingApi.addTimeCommitment({ timeCommitmentMinutes: Number(data.timeCommitment) });
      nextStep();
    } catch (error: any) {
      console.log(error);
      toast.error(
        error.data?.message || "Something went wrong. Please try again later."
      );
      // !!TODO not a correct approach ,need to change at final
      nextStep(); // Move to the next step even if there's an error
    }
  };

  // Format total time for display
  const getTotalTimeDisplay = () => {
    const totalMins = (selectedHours * 60) + selectedMinutes;
    if (totalMins >= 60) {
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      if (mins === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
    }
    return `${totalMins} minute${totalMins !== 1 ? 's' : ''}`;
  };

  // Handle hour change
  const handleHourChange = (value: number) => {
    setSelectedHours(value);
  };

  // Handle minute change
  const handleMinuteChange = (value: number) => {
    setSelectedMinutes(value);
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
        <Typography variant="h3">
          Your Time Commitment
        </Typography>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Typography variant="paragraph-lg" className="text-muted-foreground">
          How much time can you dedicate per week? (Maximum 6 hours)
        </Typography>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div variants={itemVariants}>
          <Field>
            <div className="flex flex-col items-center space-y-4 w-56">
              <div className="flex gap-4 justify-center w-full">
                <WheelPickerWrapper>
                  <WheelPicker 
                    options={hourOptions} 
                    defaultValue={selectedHours}
                    onValueChange={handleHourChange}
                  />
                </WheelPickerWrapper>
                
                <WheelPickerWrapper>
                  <WheelPicker 
                    options={minuteOptions} 
                    defaultValue={selectedMinutes}
                    onValueChange={handleMinuteChange}
                  />
                </WheelPickerWrapper>
              </div>

              {/* Display selected time */}
              <motion.div 
                className="flex items-center gap-2 mt-4 p-3 bg-accent/50 rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Clock className="size-4 text-primary" />
                <Typography variant="label-lg" className="font-medium">
                  Selected: {getTotalTimeDisplay()} ({selectedHours * 60 + selectedMinutes} minutes)
                </Typography>
              </motion.div>
            </div>

            <AnimatePresence mode="wait">
              {errors.timeCommitment && (
                <motion.div
                  key="error"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription className="text-red-500 text-center">
                    {errors.timeCommitment.message}
                  </FieldDescription>
                </motion.div>
              )}
              {!errors.timeCommitment && (
                <motion.div
                  key="description"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription className="text-center">
                    Select the hours and minutes you can commit weekly
                  </FieldDescription>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Hidden input to register the field with react-hook-form validation */}
            <input
              type="hidden"
              {...register("timeCommitment", {
                validate: validateTimeCommitment
              })}
            />
          </Field>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-4 justify-center">
          <motion.div
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <OriginButton
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || !watchedTimeCommitment || !!errors.timeCommitment}
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
                    Saving... <MobiusLoopIcon animate />
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
export default TimeCommitment;