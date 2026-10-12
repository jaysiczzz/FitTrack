# Phase 3C: Backend & Developer Jargon in UI Report

- **Target**: `client/` folder of FitTrack
- **Branch**: `feat/audited-app-improvements`
- **Scope**: Screen copy, toasts, alerts, modals, placeholders, empty states, and raw error pass-throughs.
- **Code Changes**: None (Audit Phase 3C changes no code).

---

## 1. Executive Summary & Architecture Status

### Central Error Mapper Architecture
- **Current Status**: **None exists**.
- **Mechanism**: The API layer (`client/api/client.ts`) constructs raw `Error` objects containing backend origin URLs (e.g., `Unable to connect to server at https://fittrack-9vh0.onrender.com...`) or raw HTTP status codes (e.g., `Request failed with status 500`).
- **Pass-Through Problem**: Over 17 modal and screen catch blocks use pattern `err?.message || fallback`. Because `err.message` evaluates truthy, the developer/network error string bypasses user-friendly fallbacks and displays directly in `<NotificationToast>`, `<ModalErrorBanner>`, or inline form text.
- **Navigation Headers**: Root stack layout (`client/app/(screen)/_layout.tsx` and `client/app/(tabs)/_layout.tsx`) sets `headerShown: false`, preventing default Expo Router path names (e.g., `(tabs)`, `[id]`) from leaking into mobile headers.

---

## 2. Screen-by-Screen UI Copy Breakdown

| Screen / Flow | Status | Analysis & Leaks |
| :--- | :--- | :--- |
| **Auth Flow** (`(auth)/index.tsx`, `verify.tsx`, `onboarding.tsx`) | **Mix** | Clean input labels, but field error state receives raw API URL/status code on network or server 500 errors. |
| **Dashboard** (`(tabs)/dashboard.tsx`) | **User-Friendly** | Warm copy, well-named metrics ("Daily Goals", "Streak", "Quick Water Log"). No raw jargon. |
| **Workouts** (`(tabs)/workouts.tsx`, tabs & cards) | **User-Friendly** | Standard fitness vocabulary (BPM, sets, reps, anatomy). Minor loader phrasing in `TodayWorkoutTab` and `ExerciseVisual`. |
| **Food Log** (`(tabs)/foodlog.tsx`, tabs & modals) | **User-Friendly** | Standard nutrition terms (kcal, macros). Minor "Searching food database..." text and `AiScanModal` error pass-through. |
| **Profile** (`(tabs)/profile.tsx`, sub-cards) | **User-Friendly** | Clean stats and unit formatting. Modal error banners receive raw `err?.message`. |
| **AI Coach** (`(screen)/ai-coach.tsx`) | **Mix** | Polished conversational chat, but uses developer loader `"Loading coach conversation..."`. Maps quota codes properly. |
| **Settings** (`(screen)/settings.tsx`) | **Mix** | Clean preference switches. Notification verification uses developer toasts `"Test Notification Sent"` / `"Test Failed"`. |
| **Subscription & E-Wallet** (`SubscriptionModal`, `EWalletModal`) | **Jargon Leaks** | Exposes gateway internals: `"Stripe Live API"` and `"Card (Stripe)"` in payment option lists and security descriptions. |
| **Legal Modals** (`PrivacyPolicyModal.tsx`) | **Jargon Leaks** | Exposes technical architecture: `"bcrypt hashing"`, `"short-lived JWT access tokens"`, `"rotating refresh tokens"`, `"SecureStore"`. |
| **Admin Panel** (`(screen)/admin.tsx`, `components/admin/`) | **Technical** | Gated by `user?.role?.toUpperCase() === 'ADMIN'`. Uses database terminology, server costs, and SCREAMING_CASE badges. |

---

## 3. Findings Catalog: Developer Jargon & Raw Text Leaks

| ID | Type | File and line | What | Evidence | Confidence | Action | Risk | Effort | Category | Where shown | Current text or source | Suggested user-facing text |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **JRG-001** | Raw URL | `client/api/client.ts:265` | Leaks backend Render URL on network failure | `throw new Error(\`Unable to connect to server at \${API_URL}...\`)` | High | Reword | Low | Small | Raw Error | Global error toasts / banners | `"Unable to connect to server at https://..."` | `"Unable to connect. Please check your internet connection and try again."` |
| **JRG-002** | Raw URL | `client/api/client.ts:262` | Leaks backend Render URL on connection timeout | `throw new Error(\`Request to \${API_URL} timed out...\`)` | High | Reword | Low | Small | Raw Error | Global error toasts / banners | `"Request to https://... timed out."` | `"The connection timed out. Please check your network and try again."` |
| **JRG-003** | Status Code | `client/api/client.ts:289` | Leaks raw HTTP status codes on server errors | `const errorMessage = ... \|\| \`Request failed with status \${response.status}\`` | High | Map / Reword | Low | Small | HTTP / Protocol | Global toasts / banners on 5xx | `"Request failed with status 500"` | `"Our servers are experiencing issues. Please try again shortly."` |
| **JRG-004** | Stack Trace | `client/app/_layout.tsx:42` | Root ErrorBoundary displays raw JS runtime error | `{error?.message \|\| 'An unexpected issue occurred...'}` | High | Gate / Reword | Low | Small | Raw Error | Full-screen crash fallback | `error?.message` (e.g. `"Cannot read properties of undefined"`) | `__DEV__ ? error?.message : 'An unexpected error occurred. Please restart the app.'` |
| **JRG-005** | Tech Terms | `client/components/settings/PrivacyPolicyModal.tsx:39` | Implementation stack details in Privacy Policy | `"bcrypt hashing and short-lived JWT access tokens with rotating refresh tokens... SecureStore"` | High | Reword | Low | Small | Architecture Jargon | Privacy policy modal | `"bcrypt hashing and short-lived JWT access tokens... SecureStore"` | `"industry-standard encryption and secure token authentication on encrypted storage."` |
| **JRG-006** | Gateway | `client/components/subscription/SubscriptionModal.tsx:780, 838` | Internal gateway name in checkout screen | `L780: 'Stripe Live API'`, `L838: Directly verified via Stripe Live API` | High | Reword | Low | Small | Gateway Jargon | Subscription modal card checkout | `"Directly verified via Stripe Live API."` | `"Directly verified via secure card checkout."` |
| **JRG-007** | Gateway | `client/components/subscription/EWalletModal.tsx:345, 395` | Gateway terminology in wallet top-up | `L345: Card (Stripe)`, `L395: 'Stripe Live API'` | High | Reword | Low | Small | Gateway Jargon | E-Wallet modal top-up tab | `"Card (Stripe)"` / `'Stripe Live API'` | `"Credit / Debit Card"` / `'Secure Payment Gateway'` |
| **JRG-008** | Dev Wording | `client/app/(screen)/settings.tsx:229, 234` | "Test" phrasing in notification action feedback | `showSuccess('Test Notification Sent'...)`, `showError('Test Failed'...)` | Med | Reword | Low | Small | Dev Status | Settings notification feedback | `"Test Notification Sent"` / `"Test Failed"` | `"Sample Reminder Sent"` / `"Could not send sample reminder"` |
| **JRG-009** | Dev Wording | `client/app/(screen)/ai-coach.tsx:525` | Developer phrasing in chat history loading | `<Text ...>Loading coach conversation...</Text>` | Med | Reword | Low | Small | Loading Placeholder | AI Coach message history loader | `"Loading coach conversation..."` | `"Getting your conversation ready..."` |
| **JRG-010** | Protocol Term | `client/components/foodlog/FoodLibraryTab.tsx:578` | Database terminology in search loader | `<Text ...>Searching food database...</Text>` | Med | Reword | Low | Small | Protocol Terms | Food Library search loading | `"Searching food database..."` | `"Searching foods..."` |
| **JRG-011** | Dev Wording | `client/components/foodlog/FoodLibraryTab.tsx:560, 688` | Developer phrasing on pagination scroll | `Loading more combos...`, `Loading more foods...` | Low | Reword | Low | Small | Loading Placeholder | Food Library scroll bottom | `"Loading more foods..."` | Activity spinner or `"Loading more..."` |
| **JRG-012** | Dev Wording | `client/components/workouts/ExerciseVisual.tsx:401` | Technical wording in animation loader | `<Text ...>Loading motion demonstration...</Text>` | Low | Reword | Low | Small | Loading Placeholder | Exercise card visual placeholder | `"Loading motion demonstration..."` | `"Loading exercise preview..."` |
| **JRG-013** | Dev Wording | `client/components/community/CommunityStoriesCard.tsx:178` | Developer phrasing in community stories loader | `<Text ...>Loading community stories...</Text>` | Low | Reword | Low | Small | Loading Placeholder | Dashboard community card loader | `"Loading community stories..."` | Skeleton cards or `"Loading stories..."` |
| **JRG-014** | Dev Wording | `client/components/workouts/TodayWorkoutTab.tsx:358` | Developer phrasing in workout loader | `<Text ...>Loading Today's Workout...</Text>` | Low | Reword | Low | Small | Loading Placeholder | Today's Workout tab loader | `"Loading Today's Workout..."` | Skeleton card or `"Preparing your workout..."` |
| **JRG-015** | Error Leak | Global across 17+ screens/modals (see §4) | Unsanitized `err?.message` pass-through | `showError(..., err?.message \|\| fallback)` | High | Centralize | Med | Medium | Raw Error Pass-Through | Error toasts, banners, form inputs | Raw backend errors, URL leaks, HTTP codes | Route through `getFriendlyErrorMessage(err, fallback)` |
| **JRG-016** | DB Terms | `client/components/admin/AdminExercisesTab.tsx:504`, `AdminFinanceTab.tsx:256, 547`, `AdminUsersTab.tsx:142` | Database & server terminology in admin view | `"database"`, `"Server cost"`, `"removed from database"` | Verify manually | Retain/Polish | Low | Small | Admin Terminology | Admin dashboard tabs | `"database"`, `"Server cost reimbursement"` | Acceptable for admins; optionally polish to user-facing terms. Gate: `role === 'ADMIN'`. |

---

## 4. Repeating Pattern Breakdown: Unsanitized `err?.message` Pass-Throughs (JRG-015)

The following 17 call sites bypass their fallback copy because `err.message` from `client.ts` is truthy:
1. `client/app/(auth)/index.tsx:59`: `setError(err.message || 'Login failed. Please try again.')`
2. `client/app/(auth)/verify.tsx:88`: `setError(err.message || 'Invalid or expired verification code.')`
3. `client/app/(auth)/verify.tsx:116`: `setError(err.message || 'Failed to resend code.')`
4. `client/app/(auth)/onboarding.tsx:144`: `setServerError(err.message || 'Registration failed.')`
5. `client/components/auth/RegisterForm.tsx:110`: `setEmailError(err.message || 'Account already exists.')`
6. `client/components/auth/ForgotPasswordModal.tsx:112, 156`: `fail(..., err?.message || ...)`
7. `client/components/subscription/SubscriptionModal.tsx:295, 312, 329`: `setSubError(err?.message || ...)`
8. `client/components/subscription/EWalletModal.tsx:201`: `setWalletError(err?.message || ...)`
9. `client/components/ai/AiWorkoutGeneratorModal.tsx:56`: `setGeneratorError(err?.message || ...)`
10. `client/components/ai/AiSuggestionModal.tsx:82`: `setSuggestionError(err?.message || ...)`
11. `client/components/foodlog/AiScanModal.tsx:282, 298`: `showError(..., errMsg)`
12. `client/app/(screen)/settings.tsx:266`: `showError('Action Failed', err?.message || 'Could not delete your account.')`
13. `client/components/profile/ChangeProfilePhotoModal.tsx:61, 84`: `showError(..., err?.message || ...)`
14. `client/components/profile/EditProfileModal.tsx:188`: `showError('Save Failed', err?.message || ...)`
15. `client/components/profile/LogWeightModal.tsx:119`: `showError('Save Failed', err?.message || ...)`
16. `client/components/profile/WeightProgressCard.tsx:125, 145, 176`: `showError('Error', err?.message || ...)`
17. `client/components/settings/ResetPasswordModal.tsx:96, 102`: `showError('Update Failed', errMsg)`
18. `client/components/community/TestimonialModal.tsx:405, 422`: `showError(..., err?.message || ...)`

---

## 5. Verification Checklist & Gate Validation

- [x] **Dev/Admin Gate Verification**: Admin terms in `AdminExercisesTab`, `AdminFinanceTab`, and `AdminUsersTab` were checked against `client/app/(screen)/admin.tsx:95` (`user?.role?.toUpperCase() === 'ADMIN'`). Marked as `Verify manually` (`JRG-016`) because developer/DB language in admin views does not reach standard users.
- [x] **Header Leak Check**: Verified that Expo Router stack headers are disabled (`headerShown: false`) across `app/_layout.tsx`, `app/(screen)/_layout.tsx`, and `app/(tabs)/_layout.tsx`. No internal route paths (e.g. `(tabs)`, `[id]`) leak to mobile headers.
- [x] **Standard Fitness Jargon Accepted**: Fitness domain terms (BPM, kcal, BMI, macros, sets, reps) are correctly used across the app and are NOT flagged as jargon.
- [x] **Root Error Boundary**: Root `ErrorBoundary` in `app/_layout.tsx` identified as leaking uncaught JS errors (`error.message`) in production builds.
