import React from 'react'
import { Button } from '../ui/button'
import { useOnboardingStore } from '@/features/store/onboarding.store'

const TimeCommitment = () => {
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const previousStep = useOnboardingStore((state) => state.previousStep);
  return (
    <div>
      time
      <p>Commitment paragraph</p>
     <div className="flex gap-4">
           <Button onClick={nextStep} size={"lg"} animateSize>Continue</Button>
           <Button onClick={previousStep} variant={"secondary"}>Back</Button>
         </div>

      </div>

  )
}

export default TimeCommitment
