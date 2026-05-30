import React, { useState } from "react";
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
import { Check, Clock, Target, Users, Zap, Book, Brain, Loader, Shield, Plus, X, Edit3 } from "lucide-react";

interface BlockersFormData {
  blockers: string[];
  customBlockers: string[];
}

// Predefined blocker options
const blockerOptions = [
  { id: "time", label: "Not enough time", icon: Clock, description: "Struggling to find time to commit" },
  { id: "motivation", label: "Lack of motivation", icon: Zap, description: "Difficulty staying motivated" },
  { id: "direction", label: "No clear direction", icon: Target, description: "Unsure where to start or focus" },
  { id: "accountability", label: "Need accountability", icon: Users, description: "Would benefit from peer support" },
  { id: "overwhelm", label: "Information overload", icon: Loader, description: "Too many resources, feeling stuck" },
  { id: "confidence", label: "Lack of confidence", icon: Shield, description: "Imposter syndrome or self-doubt" },
  { id: "consistency", label: "Struggle with consistency", icon: Brain, description: "Difficulty maintaining regular progress" },
  { id: "resources", label: "Limited resources", icon: Book, description: "Lack of access to tools or materials" },
];

const Blockers = () => {
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const previousStep = useOnboardingStore((state) => state.previousStep);
  
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>([]);
  const [customBlockers, setCustomBlockers] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customBlockerValue, setCustomBlockerValue] = useState("");
  
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    trigger,
  } = useForm<BlockersFormData>({
    defaultValues: {
      blockers: [],
      customBlockers: [],
    },
    mode: "onChange",
  });

  const toggleBlocker = (blockerId: string) => {
    setSelectedBlockers(prev => {
      const newSelection = prev.includes(blockerId)
        ? prev.filter(id => id !== blockerId)
        : [...prev, blockerId];
      
      // Update form value correctly
      setValue("blockers", newSelection, { 
        shouldValidate: true,
        shouldDirty: true 
      });
      trigger("blockers");
      return newSelection;
    });
  };

  const addCustomBlocker = () => {
    if (customBlockerValue.trim() && !customBlockers.includes(customBlockerValue.trim())) {
      const newCustomBlockers = [...customBlockers, customBlockerValue.trim()];
      setCustomBlockers(newCustomBlockers);
      setValue("customBlockers", newCustomBlockers, {
        shouldValidate: true,
        shouldDirty: true
      });
      trigger("customBlockers");
      setCustomBlockerValue("");
      setShowCustomInput(false);
    }
  };

  const removeCustomBlocker = (blocker: string) => {
    const newCustomBlockers = customBlockers.filter(b => b !== blocker);
    setCustomBlockers(newCustomBlockers);
    setValue("customBlockers", newCustomBlockers, {
      shouldValidate: true,
      shouldDirty: true
    });
    trigger("customBlockers");
  };

  const onSubmit = async (data: BlockersFormData) => {
    // Combine predefined blockers and custom blockers
    const allBlockers = [...data.blockers, ...data.customBlockers];
    
    if (allBlockers.length === 0) {
      toast.error("Please select or add at least one blocker");
      return;
    }

    try {
      // Send combined blockers array to API
      await OnboardingApi.addBlockers({ blockers: allBlockers });
      nextStep();
    } catch (error: any) {
      console.log(error);
      toast.error(
        error.data?.message || "Something went wrong. Please try again later."
      );
      // !!TODO not a correct approach ,need to change at final
      nextStep();
    }
  };

  const blockerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98 }
  };

  const customBlockerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  };

  const totalSelectedBlockers = selectedBlockers.length + customBlockers.length;

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
          What's Blocking Your Progress?
        </Typography>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Typography variant="paragraph-lg" className="text-muted-foreground">
          Select any challenges you're currently facing. This helps us provide targeted support.
        </Typography>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div variants={itemVariants}>
          <Field>
            <div className="space-y-6">
              {/* Predefined Blockers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {blockerOptions.map((blocker, index) => {
                  const Icon = blocker.icon;
                  const isSelected = selectedBlockers.includes(blocker.id);
                  
                  return (
                    <motion.button
                      key={blocker.id}
                      type="button"
                      variants={blockerVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      whileTap="tap"
                      transition={{ delay: index * 0.05 }}
                      onClick={() => toggleBlocker(blocker.id)}
                      className={`
                        relative p-4 rounded-lg border-2 text-left transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/10 shadow-md' 
                          : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          p-2 rounded-lg transition-colors
                          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                        `}>
                          <Icon className="size-5" />
                        </div>
                        
                        <div className="flex-1">
                          <Typography variant="label-md" className="font-medium">
                            {blocker.label}
                          </Typography>
                          <Typography variant="paragraph-md" className="text-muted-foreground">
                            {blocker.description}
                          </Typography>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-primary"
                          >
                            <Check className="size-5" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Custom Blockers Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Typography variant="label-md" className="font-medium">
                    Custom Blockers
                  </Typography>
                  {!showCustomInput && (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCustomInput(true)}
                      className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                    >
                      <Plus className="size-4" />
                      Add custom blocker
                    </motion.button>
                  )}
                </div>

                {/* Custom Blocker Input */}
                <AnimatePresence>
                  {showCustomInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter your custom blocker..."
                          value={customBlockerValue}
                          onChange={(e) => setCustomBlockerValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomBlocker();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={addCustomBlocker}
                          disabled={!customBlockerValue.trim()}
                        >
                          Add
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowCustomInput(false);
                            setCustomBlockerValue("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Custom Blockers List */}
                {customBlockers.length > 0 && (
                  <motion.div 
                    className="flex flex-wrap gap-2 mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {customBlockers.map((blocker, index) => (
                      <motion.div
                        key={index}
                        variants={customBlockerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        custom={index}
                        className="flex items-center gap-2 px-3 py-2 bg-accent/50 rounded-lg border"
                      >
                        <Edit3 className="size-3 text-muted-foreground" />
                        <span className="text-sm">{blocker}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomBlocker(blocker)}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>

            <AnimatePresence mode="wait">
              {errors.blockers && (
                <motion.div
                  key="error"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription className="text-red-500 text-center">
                    {errors.blockers.message}
                  </FieldDescription>
                </motion.div>
              )}
              {!errors.blockers && totalSelectedBlockers > 0 && (
                <motion.div
                  key="selected-count"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription className="text-center text-primary">
                    You've selected {totalSelectedBlockers} blocker{totalSelectedBlockers !== 1 ? 's' : ''}
                  </FieldDescription>
                </motion.div>
              )}
              {!errors.blockers && totalSelectedBlockers === 0 && (
                <motion.div
                  key="description"
                  variants={errorVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <FieldDescription className="text-center">
                    Select predefined blockers or add your own custom ones
                  </FieldDescription>
                </motion.div>
              )}
            </AnimatePresence>
          </Field>
        </motion.div>

        <motion.div variants={itemVariants} className="flex gap-4 justify-between">
          <motion.div
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <Button onClick={previousStep} variant="secondary" type="button" size="lg">
              Back
            </Button>
          </motion.div>

          <motion.div
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <OriginButton
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || totalSelectedBlockers === 0}
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
                    Saving...
                  </motion.div>
                ) : (
                  <motion.div
                    key="continue"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center gap-2"
                  >
                    Complete
                    <Check className="size-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </OriginButton>
          </motion.div>
        </motion.div>
      </form>

  
    </motion.div>
  );
};

export default Blockers;