# Cleanup & Hygiene Audit Progress Tracker

- **Target**: `client/` folder of FitTrack
- **Branch**: `feat/audited-app-improvements`
- **Current Status**: Phase 5 Execution - Batch 3 Completed (Batches 1, 2, 3 Done)

## Completed Phases
- [x] **Phase 1: Discovery & Baseline**
  - Inventory written to `docs/cleanup/01-inventory.md`
  - Baseline: `tsc --noEmit` (0 errors), `eslint` (not installed / 0 errors)
- [x] **Phase 2: Unused Findings**
  - Unused files & code written to `docs/cleanup/02-unused-files-and-code.md` (UNU-001 to UNU-080)
  - Unused styles & assets written to `docs/cleanup/03-unused-styles-assets.md` (AST-001, UNU-STY-001, UNU-STY-002)
  - Dependencies & config written to `docs/cleanup/04-dependencies-and-config.md` (DEP-001, DEP-002, UNU-CFG-001)
- [x] **Phase 3: Redundancy Findings**
  - Redundancy report written to `docs/cleanup/05-redundancy.md` (RED-001 to RED-012)
  - 12 duplicate groups analyzed with members, differences, single source of truth, and callers to update
- [x] **Phase 3B: Hardcoded & Static Data**
  - Hardcoded and static data report written to `docs/cleanup/05b-hardcoded-static-data.md` (HRD-001 to HRD-017)
  - Screen-by-screen breakdown documented (6 Real Data, 6 Mix)
- [x] **Phase 3C: Backend & Developer Jargon in UI**
  - UI copy and error leak report written to `docs/cleanup/05c-ui-jargon.md` (JRG-001 to JRG-016)
  - Central error mapper status, gateway jargon, and screen-by-screen breakdown documented
- [x] **Phase 4: Removal & Remediation Plan**
  - Remediation plan written to `docs/cleanup/06-removal-plan.md`
  - 131 findings grouped into 7 safe, isolated batches with rollback commands and verification steps
- [x] **Phase 5 Execution - Batch 1 (Unused Leaf Components & Dead Barrels)**: Committed `b073dd4`
- [x] **Phase 5 Execution - Batch 2 (Unused Functions, Dead State, Unused Imports)**: Committed `3b44e69`
- [x] **Phase 5 Execution - Batch 3 (Redundant Code Consolidation)**: Committed `de6424f`
- [x] **Phase 5 Execution - Batch 4 (Unused Styles, Theme Tokens & Dead Assets)**: Committed `097feaa`
- [x] **Phase 5 Execution - Batch 5 (Unused Dependencies & App Config Cleanup)**: Committed `3e7519a`
- [x] **Phase 5 Execution - Batch 6 (Hardcoded & Static Data Extraction)**: HRD-001 through HRD-017

## Phases In Progress
- [ ] **Phase 5 Execution - Batch 7 (UI Jargon Cleanup & Central Error Sanitizer)**

## Pending Phases
- [ ] **Final: Summary Report** (`99-report.md`)

## Last File Reviewed
- Completed UI jargon and error leak audit across all screens, modals, and API handlers (`client/api/client.ts`, `client/app/_layout.tsx`, `client/components/subscription/SubscriptionModal.tsx`, `client/components/settings/PrivacyPolicyModal.tsx`). Total findings recorded so far: 131.
