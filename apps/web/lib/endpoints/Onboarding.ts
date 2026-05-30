import { get, post, del } from "@/lib/api-client";
export const OnboardingApi = {
    getOnboardingData:()=> get('onboarding/data'),
    startOnboarding:()=> post('onboarding/start'),
    addGoal:(data:any)=> post('onboarding/goals',data),
    addExperience:(data:any)=> post('onboarding/experience',data),
    addTimeCommitment:(data:any)=> post('onboarding/time-commitment',data),
    addBlockers:(data:any)=> post('onboarding/blockers',data),
    completeOnboarding:()=> post('onboarding/complete'),
}