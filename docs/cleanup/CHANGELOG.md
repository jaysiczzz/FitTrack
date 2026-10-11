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
