# Food Log & Detail Sheets Redesign Plan

## 1. Overview & Objectives
Declutter and restructure the **Nutrition / Food Log** screen (`/foodlog`) and both of its detail sheets:
1. **Meal Detail Sheet** (`MealComboDetailsModal.tsx`): Opened from meal cards in Library.
2. **Food Detail Sheet** (`FoodDetailsInspectorModal.tsx`): Opened from food cards in Library.

The redesign eliminates visual clutter, removes redundant controls, and ensures **100% fluid responsiveness** across viewports from 320px compact phones to 1440px desktop displays, landscape orientations, 568px short heights, and 200% system font scaling.

---

## 2. File Inventory & Entry Points

### A. Primary Screen & Tab Components
- [`client/app/(screen)/foodlog.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/app/(screen)/foodlog.tsx): Root route screen, header, main tabs switch (`today`, `library`, `history`).
- [`client/components/foodlog/FoodLibraryTab.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/FoodLibraryTab.tsx): The catalog view containing sub-controls, meal combos, search list, recents, and sheet mountings.
- [`client/components/foodlog/FoodLogTabs.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/FoodLogTabs.tsx): Primary 3-segment switcher (`Today's Log`, `Library`, `History`).

### B. Detail Sheets / Modals
- [`client/components/foodlog/MealComboDetailsModal.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/MealComboDetailsModal.tsx): Meal combo detail sheet with portion multipliers, macro breakdown, recipe ingredients, and logging action.
  - **Entry Point**: `FoodLibraryTab.tsx` line 537 (tapping "Recipe & Scale" button or tapping meal card body).
- [`client/components/foodlog/FoodDetailsInspectorModal.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/FoodDetailsInspectorModal.tsx): Food staple detail sheet with gram/serving tuner, % Daily Value nutrition facts label, and allergen data.
  - **Entry Point 1**: `FoodLibraryTab.tsx` line 647 (tapping food card header/info).
  - **Entry Point 2**: `FoodLibraryTab.tsx` line 745 (tapping "Nutrition Facts & Scale" button).

### C. Shared UI & Layout Components
- [`client/components/ui/FilterChip.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/ui/FilterChip.tsx): Category and filter chips.
- [`client/components/ui/FloatingAiCoachButton.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/ui/FloatingAiCoachButton.tsx): Floating sparkle button anchored on bottom-right.
- [`client/components/ui/ModalCloseButton.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/ui/ModalCloseButton.tsx): Circular close button for sheets.
- [`client/components/foodlog/MealCategoryCard.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/MealCategoryCard.tsx): Today's logged meal category card.
- [`client/components/foodlog/MacroSummaryCard.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/MacroSummaryCard.tsx): Daily calorie & macro target budget card.

### D. Data & Helper Modules
- [`client/components/foodlog/foodLogTypes.ts`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/foodLogTypes.ts): Meal types, icons, labels, badges.
- [`client/data/mealCombos.ts`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/data/mealCombos.ts): Curated balanced meal combo catalog.
- [`client/data/commonFoods.ts`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/data/commonFoods.ts): Common staples, macro scaling calculations.
- [`client/hooks/useResponsive.ts`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/hooks/useResponsive.ts): Responsive breakpoint hook (`useWindowDimensions`).

### E. New Extracted Micro-Components
- [`client/components/foodlog/MealSelectorPill.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/MealSelectorPill.tsx): Compact, accessible pill dropdown (`🍽️ Dinner ▾`) that opens a quick selector modal.
- [`client/components/foodlog/CollapsibleSection.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/CollapsibleSection.tsx): Reusable accessible accordion for sheet secondary content.
- [`client/components/foodlog/ResponsiveMacroRow.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/ResponsiveMacroRow.tsx): 4-column auto-wrapping macro metric row with font scaling.

---

## 3. Decisions on Open Choices

| Decision Item | Chosen Approach | Rationale & User Benefit |
| :--- | :--- | :--- |
| **Source Choice** *(Meals vs Foods vs Recents)* | **Integrated Leading Filter Chips** (`[Meals]` · `[Foods]` · `[Recents]`) in the single horizontal chip row. | Eliminates the entire second layer of tabs (saving 48px vertical height). No redundant sub-tabs above the search bar. The search bar immediately searches whichever source is active. |
| **Meal Selector** *(Replacing 4 big buttons + label + badge)* | **Compact `MealSelectorPill` (`[🍽️ Dinner ▾]`)** docked inline on the search row. | Replaces 4 large icon buttons (60px high) + uppercase label + separate badge with a single 44px-high pill that auto-defaults to current time-of-day meal (`getSmartMealType()`). Works seamlessly even on 320px screens. |
| **Floating AI Button** | **Hide floating overlay on `/foodlog`**, and add header access (`[✨ AI Coach]` button next to `[📅 Calendar]`). | A floating button over a dense catalog list constantly obscures right-aligned Quick Add buttons and card edges. Moving it to the header ensures 100% obstruction-free scrolling and sheet opening. |
| **Responsive Approach** | **`useResponsive` (with `useWindowDimensions`) + NativeWind utilities (`sm:`, `md:`, `lg:`)**. | React Native web + iOS + Android need continuous updates on window resize and orientation change without stale cached dimensions. `Dimensions.get` is completely avoided. |
| **Macro Visuals** | **Keep numerical Macro Row, remove decorative colored bar on main cards**. Keep bar + numbers on detail sheets; remove redundant percent badges (`P:30%`, etc.). | Athletes track numerical grams (`45g P · 38g C · 12g F`). A colored bar without numbers requires cognitive guesswork. On cards, numerical columns provide instant data. |
| **Scroll Hint on Chip Row** | **Right-edge gradient fade mask indicator**. | Prevents users from thinking the chip list is cut off or truncated. |

---

## 4. UI Layout Sketches Across Screen Sizes

### A. Main Food Log Screen (Library View)

#### Compact Phone (320px – 359px, e.g. iPhone SE 1st gen)
```text
+------------------------------------------+
| Nutrition                     [📅] [✨]  | <- Compact header (title + icon buttons)
| [ Today's Log ] [ Library* ] [ History ] | <- Main 3-segment tabs (flex-1)
| [🔍 Search...          ] [🍽️ Din ▾]     | <- Row 2: Search field + compact meal pill
| [Meals*] [Foods] [Recents] [High Prot] > | <- Row 3: Chip row with right fade
+------------------------------------------+
| [CARD 1: Anabolic PB Oats]        [Add]  | <- Card: 2-line title, 1 badge (Verified)
| 450 kcal | 42g P | 48g C | 12g F         | <- 4 equal flexible macro columns
+------------------------------------------+
| [CARD 2: Grilled Chicken Bowl]    [Add]  |
| 520 kcal | 50g P | 45g C | 14g F         |
+------------------------------------------+
```

#### Standard Phone (360px – 430px, e.g. iPhone 14/15/16, Pixel 8)
```text
+--------------------------------------------------+
| Nutrition                             [📅 Cal] [✨] |
| [ Today's Log ]  [   Library*   ]  [   History   ] |
| [ 🔍 Search meals or foods...    ] [🍽️ Dinner ▾]  |
| [🍽️ Meals*] [🥗 Foods] [⏱️ Recents] [🔥 High Prot] > |
+--------------------------------------------------+
| Anabolic Peanut Butter Proats       [Verified]   |
| 450 kcal  ·  1 bowl (350g)                [Add]  |
| [ 450 kcal ] [ 42g Prot ] [ 48g Carb ] [ 12g Fat]|
+--------------------------------------------------+
| Grilled Chicken & Sweet Potato Bowl [Verified]   |
| 520 kcal  ·  1 bowl (420g)                [Add]  |
| [ 520 kcal ] [ 50g Prot ] [ 45g Carb ] [ 14g Fat]|
+--------------------------------------------------+
```

#### Tablet & Desktop Web (768px – 1440px)
```text
+-----------------------------------------------------------------------+
|                       Centered Container (max-w-4xl)                  |
| Nutrition                             [📅 Activity Calendar] [✨ Coach] |
| [      Today's Log      ] [       Library*       ] [     History    ] |
| [ 🔍 Search all curated meals and verified foods... ]  [🍽️ Dinner ▾] |
| [🍽️ Meals*]  [🥗 Foods]  [⏱️ Recents]  [🔥 High Protein]  [✂️ Fat Loss]  |
|                                                                       |
| +--------------------------------+  +-------------------------------+ |
| | Anabolic PB Proats  [Verified] |  | Chicken Bowl       [Verified] | |
| | 450 kcal · 1 bowl        [Add] |  | 520 kcal · 1 bowl       [Add] | |
| | 450 kcal | 42g P | 48g C | 12gF|  | 520 kcal | 50g P | 45g C| 14gF| |
| +--------------------------------+  +-------------------------------+ |
| +--------------------------------+  +-------------------------------+ |
| | Steak & Jasmine Rice[Verified] |  | Salmon & Quinoa    [Verified] | |
| | 610 kcal · 1 plate       [Add] |  | 540 kcal · 1 bowl       [Add] | |
| | 610 kcal | 48g P | 52g C | 22gF|  | 540 kcal | 44g P | 40g C| 20gF| |
| +--------------------------------+  +-------------------------------+ |
+-----------------------------------------------------------------------+
```

---

### B. Meal Detail Sheet (`MealComboDetailsModal`)

```text
+--------------------------------------------------+
| Anabolic Peanut Butter Proats                [✕] | <- Compact header, 2-line title, always visible close
| ⏱️ 5 min prep · High Protein                      |
+--------------------------------------------------+
| Tagline & description (2 lines max, "More...")   |
|                                                  |
| PORTION: [ 0.75x ] [ 1.0x* ] [ 1.25x ] [ 1.5x ]  | <- 4 equal flexible segments
|                                                  |
| 450 kcal                                         | <- Big calorie callout
| [======= Protein =======][=== Carbs ===][== Fat =] <- Colored proportion bar
| 42g Protein  ·  48g Carbs  ·  12g Fats  ·  6g Fib| <- 4 clean columns
|                                                  |
| LOGGING TO: [🍽️ Dinner ▾]                         | <- Reused compact meal pill
|                                                  |
| ▶ Ingredients (5)                          [ ▾ ] | <- Collapsible (collapsed by default)
|   • Rolled Oats · 80g           300 kcal · 10g P |
|   • Whey Protein Isolate · 35g  130 kcal · 30g P |
|   • Peanut Butter · 15g          95 kcal · 4g P  |
|                                                  |
| ▶ Chef & Prep Tips                         [ ▾ ] | <- Collapsible
+--------------------------------------------------+
| [           Log Meal · 450 kcal                ] | <- Pinned bottom action button with safe-area inset
+--------------------------------------------------+
```

---

### C. Food Detail Sheet (`FoodDetailsInspectorModal`)

```text
+--------------------------------------------------+
| Grilled Chicken Breast                       [✕] | <- Compact header
| Tyson · Poultry & Meat · [Verified] [Nutri-Score A]
+--------------------------------------------------+
| PORTION SIZE                                     |
| [ 150              ] [ Grams (g) | Servings ]    | <- Numeric input + 44px toggle
| [ 50g ]  [ 100g ]  [ 150g* ]  [ 200g ]  [ 250g ] | <- 44px touch targets
|                                                  |
| LIVE MACRO SUMMARY                               |
| 248 kcal · 46.5g Protein · 0g Carbs · 5.4g Fat   | <- Real-time live update
|                                                  |
| LOGGING TO: [🍽️ Dinner ▾]                         | <- Reused compact meal pill
|                                                  |
| ▶ Nutrition Facts                          [ ▾ ] | <- Collapsible (collapsed by default)
|   Serving: 150g                                  |
|   % Daily Value*                                 |
|   Total Fat 5.4g                            7%   |
|   Cholesterol 128mg                        43%   |
|   Sodium 111mg                              5%   |
|   Protein 46.5g                            93%   |
|                                                  |
| ▶ Ingredients & Allergens                  [ ▾ ] | <- Collapsible (collapsed by default)
|   Allergens: None reported                       |
|   Ingredients: Boneless skinless chicken breast  |
+--------------------------------------------------+
| [         Add to Dinner · 248 kcal             ] | <- Pinned bottom action button (no 2-line wrap)
+--------------------------------------------------+
```

---

## 5. Changes by Phase & File List

### Phase 2: Main Screen Controls
- **Modify**: [`client/app/(screen)/foodlog.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/app/(screen)/foodlog.tsx)
  - Streamline header: keep title, calendar button, add AI Coach quick-entry button, remove wordy subtitle.
  - Set main tabs to flexible equal segments that never truncate.
  - Constrain content to responsive max-width on tablet/desktop.
- **Modify**: [`client/components/foodlog/FoodLibraryTab.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/FoodLibraryTab.tsx)
  - Remove the second layer of tabs.
  - Mount row 2: Search input + `MealSelectorPill`.
  - Mount row 3: Leading source filter chips (`[Meals]`, `[Foods]`, `[Recents]`) + contextual filter chips.
  - Add gradient/fade scroll hint to chip row.
  - Remove all redundant decorative icons and helper texts ("1-Tap Macro Logging", "Tap for Nutrition Facts").
- **Add**: [`client/components/foodlog/MealSelectorPill.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/MealSelectorPill.tsx)
  - Compact, accessible pill dropdown (`🍽️ Dinner ▾`) that opens a quick selector modal.

### Phase 3: Cards & Responsive Grid
- **Modify**: [`client/components/foodlog/FoodLibraryTab.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/FoodLibraryTab.tsx)
  - Simplify meal cards: 2-line title, 1 badge (Verified), compact 4-column macro numbers row (`ResponsiveMacroRow`), single "Add" button with separate small serving text.
  - Remove colored macro bar from main cards (keep numbers).
  - Simplify food cards: remove extra badges, 2-line name, 4-column macro row, clean "Add" button.
  - Wrap cards in responsive grid layout (1 column on phones, 2 columns on tablets/landscape, 3 columns on wide screens).
- **Add**: [`client/components/foodlog/ResponsiveMacroRow.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/ResponsiveMacroRow.tsx)
  - Shared 4-column flexible metric component with `adjustsFontSizeToFit` and 2x2 wrapping on compact screens.

### Phase 4: Meal Detail Sheet
- **Modify**: [`client/components/foodlog/MealComboDetailsModal.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/MealComboDetailsModal.tsx)
  - Compact header with 2-line title and always-visible close button.
  - Merge info card into a single concise block.
  - 4 equal flexible portion segments (`0.75x`, `1.0x`, `1.25x`, `1.5x`).
  - Keep big calories and colored bar + 4-column numbers; remove duplicate percent badges and repeated calories.
  - Replace 4 large meal buttons with `MealSelectorPill`.
  - Wrap ingredients in `CollapsibleSection` (collapsed by default), formatted as clean divided rows.
  - Pinned single-line action button with safe-area padding.
- **Add**: [`client/components/foodlog/CollapsibleSection.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/CollapsibleSection.tsx)
  - Smooth, accessible collapsible accordion component.

### Phase 5: Food Detail Sheet
- **Modify**: [`client/components/foodlog/FoodDetailsInspectorModal.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/foodlog/FoodDetailsInspectorModal.tsx)
  - Compact header with 2-line title and max 2 badges.
  - Unified portion block with side-by-side numeric input and 44px Grams/Servings toggle.
  - Quick-amount chips with 44px touch targets.
  - Add real-time live macro summary row immediately below portion tuner.
  - Replace 4 large meal buttons with `MealSelectorPill`.
  - Wrap Nutrition Facts table into `CollapsibleSection` (collapsed by default), removing duplicated calories and macro split.
  - Wrap Ingredients & Allergens in `CollapsibleSection` (clear label).
  - Pinned single-line action button ("Add to Dinner · 248 kcal") with safe-area padding.

### Phase 6: Floating AI Button & Responsive Verification
- **Modify**: [`client/components/ui/FloatingAiCoachButton.tsx`](file:///C:/Users/bro/Documents/Programming/FitTrack/client/components/ui/FloatingAiCoachButton.tsx)
  - Hide floating button on `/foodlog` (since Food Log has header access + AI tools).
- **Verify**: Full test matrix (320px to 1440px, short 568px height, landscape, 200% font scaling, keyboard open).
- **Document**: Write verification results and before/after checklist to `docs/foodlog-redesign-report.md`.
