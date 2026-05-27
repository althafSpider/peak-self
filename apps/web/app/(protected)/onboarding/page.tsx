"use client"
import { useAuth } from '@/features/auth/context/auth-context';
import { OnboardingStatus } from '@/lib/enums/onboarding';
import React from 'react'

const page = () => {
  const { user } = useAuth()
  const onboardingStatus = user?.profile?.onboardingStatus
  if (onboardingStatus === OnboardingStatus.COMPLETED) {
    return <div>Onboarding completed</div>
  }
  return (
    <div>
      onboarding page
    </div>
  )
}

export default page
