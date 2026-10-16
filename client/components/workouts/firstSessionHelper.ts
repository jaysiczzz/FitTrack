import { STARTER_PLANS, StarterPlan, Goal } from './starterPlans';

export interface FirstSessionState {
  isFirstSession: boolean;
  starterPlan: StarterPlan | null;
}

export function getFirstSessionState(
  completedSessionsCount: number | null | undefined,
  goal?: Goal | string | null
): FirstSessionState {
  // Only true when count is definitively known and exactly 0
  const isFirstSession = completedSessionsCount === 0;
  if (!isFirstSession) {
    return {
      isFirstSession: false,
      starterPlan: null,
    };
  }

  const normalizedGoal: Goal = goal === 'WEIGHT_LOSS' ? 'WEIGHT_LOSS' : 'MUSCLE_GAIN';
  return {
    isFirstSession: true,
    starterPlan: STARTER_PLANS[normalizedGoal],
  };
}
