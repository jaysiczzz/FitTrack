# FitTrack Client Cleanup Changelog

All code removals, refactors, extractions, and copy sanitizations performed during Phase 5 controlled execution are logged here per batch.

---

## [Batch 1] - 2026-10-12
### Removed
- `client/components/dashboard/AiInsightsCard.tsx` (UNU-001): Redundant 1-line re-export barrel file.
- `client/components/auth/GoalCard.tsx` (UNU-002): Unused early onboarding goal card component.
- `client/components/foodlog/QuickActionToolbar.tsx` (UNU-003): Unused food quick-action component.
- `client/components/profile/AthleteBadgesCard.tsx` (UNU-004): Unused profile milestone badges card.
- `client/components/profile/WeightProgressCard.tsx` (UNU-005): Unused 540-line weight progress chart component.
- `client/components/profile/SetTargetWeightModal.tsx` (UNU-006): Transitive dead modal (only imported by dead `WeightProgressCard`).
- `client/components/ui/BottomSheetHeader.tsx` (UNU-007): Unused drag handle header component.
- `client/components/ui/SectionHeader.tsx` (UNU-008): Unused section header component.
- `client/components/ui/index.ts` (UNU-009): Unused barrel file re-exporting UI components.

### Verification
- `npx tsc --noEmit`: Passed with 0 errors (matched baseline).
- Screen rendering: No imports existed; no screens impacted.

---

## [Batch 2] - 2026-10-12
### Removed
- `client/api/weight.ts` (UNU-010, UNU-011, UNU-012): Unused `getWeightLogsApi`, `deleteWeightLogApi`, `setTargetWeightApi`.
- `client/api/foodlog.ts` (UNU-013, UNU-014, UNU-015, UNU-017, UNU-018): Unused `completeDailyFoodLogApi`, `flushSyncFoodAndWater`, `createCustomFoodApi`, `deleteCustomFoodApi`, unexported `OPEN_FOOD_FACTS_CATEGORY_TERMS`.
- `client/api/workout.ts` (UNU-019, UNU-020): Unused `createCustomExerciseApi`, `deleteCustomExerciseApi`.
- `client/app/(screen)/profile.tsx` (UNU-021, UNU-022, UNU-023, UNU-024, UNU-025, UNU-034): Dead state `totalWorkoutsCount`, `totalMealsCount`, `hasHitMacro`, `loading`, `age`, unused `ActivityIndicator` import.
- `client/app/(screen)/dashboard.tsx` (UNU-026, UNU-032): Dead state `targetWorkoutsThisWeek`, unused `ActivityIndicator`, `Ionicons`, `isLandscape`.
- `client/app/(screen)/foodlog.tsx` (UNU-027, UNU-028, UNU-033): Dead local helpers `saveWater`, `refreshAIInsights`, unused `ActivityIndicator`, `MEAL_ICONS`, `useRouter`, `router`.
- `client/app/(screen)/workouts.tsx` (UNU-029, UNU-035): Dead local helper `refreshAIInsights`, unused `TouchableOpacity`, `Ionicons`, `ExerciseDetailsModal`, `ApiWorkoutExercise`, `useRouter`, `router`, `useThemeColors`, `colors`.
- `client/app/(auth)/index.tsx` (UNU-031): Unused `Text`, `Ionicons`, `useThemeColors`, `colors`.
- `client/components/ai/AiInsightsCard.tsx` (UNU-040): Unused `onRefresh` prop, unused `TouchableOpacity`, `ActivityIndicator`.
- `client/components/foodlog/FoodLibraryTab.tsx` (UNU-030, UNU-053): Unused `handleQuickLogStandard`, unused `MEAL_LABELS`, `MEAL_GLYPHS`, `useResponsive`.
- `client/components/dashboard/DailyCheckInCard.tsx` (UNU-045): Unused `Platform` import.
- `client/components/dashboard/DailyGoalsCard.tsx` (UNU-046): Unused `useThemeColors` import.
- `client/components/dashboard/MacroProgressCard.tsx` (UNU-047): Unused `Platform`, `useThemeColors` imports.
- `client/components/foodlog/MacroSummaryCard.tsx` (UNU-054): Unused `useThemeColors` import.
- `client/components/settings/PrivacyPolicyModal.tsx` (UNU-061): Unused `Ionicons`, `useThemeColors` imports.
- `client/components/workouts/AssignRoutineModal.tsx` (UNU-067): Unused `SurfaceCard` import.
- `client/components/workouts/WorkoutHistoryTab.tsx` (UNU-072): Unused `ActivityIndicator` import.
- `client/data/commonExercises.ts` (UNU-075): Unused `getDifficultyPreset` import.
- `client/utils/notificationService.ts` (UNU-077): Unused `ApiNotificationSettings` import.

### Verification
- `npx tsc --noEmit`: Passed with **0 errors** (matched baseline).
- Screen rendering: Unused imports/functions/state removed; active UI and behaviors preserved.

---

## [Batch 3] - 2026-10-12
### Refactored & Consolidated
- `client/utils/formatters.ts` (RED-001, RED-005, RED-010): Centralized `getTodayDateString`, `formatDateHeading`, canonical `formatGoalLabel`, and `calculateBmi`.
- `client/components/foodlog/foodLogTypes.ts` (RED-001): Re-exported `getTodayDateString` and `formatDateHeading` from `@/utils/formatters` avoiding code duplication while maintaining backwards-compatible imports.
- `client/components/workouts/workoutTypes.ts` (RED-001, RED-002): Re-exported date formatters; removed redundant/dead `calculateWorkoutStreak` function (superseded by `client/utils/streakUtils.ts`).
- `client/utils/passwordValidation.ts` (RED-004): Exported canonical `EMAIL_REGEX`.
- `client/components/auth/LoginForm.tsx` & `RegisterForm.tsx` (RED-004): Replaced duplicated inline email regexes with imported `EMAIL_REGEX`.
- `client/components/admin/AdminUsersTab.tsx` (RED-005): Replaced duplicate inline `formatGoal` with canonical `formatGoalLabel`.
- `client/components/foodlog/MealCategoryCard.tsx` (RED-006): Replaced duplicate `MEAL_CATEGORY_ICONS` map with canonical `MEAL_GLYPHS` from `foodLogTypes.ts`.
- `client/components/workouts/CreateRoutineModal.tsx`, `SplitPresetModal.tsx`, `AssignRoutineModal.tsx` (RED-008): Replaced duplicated custom touchable close buttons with shared `<ModalCloseButton />`.
- `client/components/auth/OnboardingMetricsStep.tsx` & `OnboardingPlanStep.tsx` (RED-009, RED-010): Consolidated Mifflin-St Jeor BMR/TDEE math and macronutrient splitting to canonical `calculatePersonalizedTargets`; consolidated BMI calculation to `calculateBmi`.
- `client/app/(screen)/profile.tsx` (RED-010): Consolidated inline BMI calculation and classification to `calculateBmi`.
- `client/components/workouts/ExerciseVideoModal.tsx` (RED-011): Standardized URL opening from React Native `Linking` to `expo-linking`.
- `client/app/(screen)/dashboard.tsx` (RED-012): Replaced raw `AsyncStorage.getItem('user')` call with typed, error-handled `authStorage.getUser()`.

### Verification
- `npx tsc --noEmit`: Passed with **0 errors** (matched baseline).
- Screen rendering: Date headings, goal formatting, onboarding targets, BMI vitals, and modal close buttons operating uniformly.

---

## [Batch 4] - 2026-10-12
### Removed & Refactored
- `client/assets/icon.svg` (AST-001): Deleted unused vector icon asset (`app.json` strictly bundles `./assets/icon.png`).
- `client/constants/colors.ts` (UNU-STY-001): Pruned unreferenced `COLORS.secondary` color tokens (`blue`, `purple`, `orange`, `mint`).
- `client/components/ui/FilterChip.tsx` (UNU-STY-002): Applied previously unapplied `roundedClass` variable to container `className` so the `rounded` prop (`full` vs `xl`) functions properly.

### Verification
- `npx tsc --noEmit`: Passed with **0 errors** (matched baseline).
- Asset bundles: `app.json` verified to reference only `icon.png` and `adaptive-icon.png`.


