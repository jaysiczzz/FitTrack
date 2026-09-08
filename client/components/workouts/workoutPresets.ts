export interface DifficultyPreset {
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  recommendedSets: number;
  recommendedReps: number;
  recommendedDuration?: number;
  recommendedRest: number;
  recommendedTempo?: string;
  cue: string;
  defaultSets: { weight?: number; reps?: number; bodyweight?: boolean }[];
}

export const getDifficultyPreset = (
  exercise: any,
  tier: 'beginner' | 'intermediate' | 'advanced'
): DifficultyPreset => {
  const existingPresets = exercise?.difficultyPresets || {};
  if (
    existingPresets[tier] &&
    Array.isArray(existingPresets[tier].defaultSets) &&
    existingPresets[tier].defaultSets.length > 0
  ) {
    return existingPresets[tier];
  }

  const baseSets = exercise?.defaultSets || [];
  const firstSetWeight = baseSets[0]?.weight ? Number(baseSets[0].weight) : 40;
  const isBW = Boolean(baseSets[0]?.bodyweight);

  if (tier === 'beginner') {
    const begWeight = Math.max(5, Math.round((firstSetWeight * 0.6) / 2.5) * 2.5);
    return {
      difficulty: 'Beginner',
      recommendedSets: 3,
      recommendedReps: 12,
      recommendedRest: 60,
      recommendedTempo: '3-1-1-0',
      cue: '🟢 Beginner Focus: Safe light weight, controlled form & full range of motion.',
      defaultSets: [
        { weight: isBW ? undefined : begWeight, reps: 12, bodyweight: isBW },
        { weight: isBW ? undefined : begWeight, reps: 12, bodyweight: isBW },
        { weight: isBW ? undefined : begWeight, reps: 12, bodyweight: isBW },
      ],
    };
  }

  if (tier === 'advanced') {
    const advWeight = Math.round((firstSetWeight * 1.35) / 2.5) * 2.5;
    return {
      difficulty: 'Advanced',
      recommendedSets: 4,
      recommendedReps: 6,
      recommendedRest: 120,
      recommendedTempo: '2-0-1-0',
      cue: '🔴 Advanced Focus: Heavy progressive overload for maximum power & density.',
      defaultSets: [
        { weight: isBW ? undefined : advWeight, reps: 6, bodyweight: isBW },
        { weight: isBW ? undefined : Math.round((advWeight * 1.05) / 2.5) * 2.5, reps: 6, bodyweight: isBW },
        { weight: isBW ? undefined : Math.round((advWeight * 1.10) / 2.5) * 2.5, reps: 5, bodyweight: isBW },
        { weight: isBW ? undefined : Math.round((advWeight * 1.15) / 2.5) * 2.5, reps: 4, bodyweight: isBW },
      ],
    };
  }

  const intWeight = firstSetWeight;
  return {
    difficulty: 'Intermediate',
    recommendedSets: 3,
    recommendedReps: 10,
    recommendedRest: 90,
    recommendedTempo: '2-0-1-0',
    cue: '🟡 Intermediate Focus: Standard working load for steady hypertrophy and stamina.',
    defaultSets: [
      { weight: isBW ? undefined : intWeight, reps: 10, bodyweight: isBW },
      { weight: isBW ? undefined : Math.round((intWeight * 1.08) / 2.5) * 2.5, reps: 10, bodyweight: isBW },
      { weight: isBW ? undefined : Math.round((intWeight * 1.15) / 2.5) * 2.5, reps: 8, bodyweight: isBW },
    ],
  };
};
