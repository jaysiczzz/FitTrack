# 🎯 FitTrack App - Complete Visual Guide

## App Architecture

```
┌─────────────────────────────────────────────┐
│         FitTrack App Entry Point             │
│              app/index.tsx                   │
│     (Redirects to (auth) on startup)        │
└────────────────────┬────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │  Authentication Flow       │
        │     app/(auth)/            │
        ├────────────────────────────┤
        │ • Login/Register           │
        │   (app/(auth)/index.tsx)   │
        │                            │
        │ • Onboarding              │
        │   (app/(auth)/onboarding) │
        └────────────┬───────────────┘
                     │ After Auth Complete
                     ▼
        ┌────────────────────────────────────┐
        │    Main App with Tab Navigation    │
        │         app/(app)/_layout.tsx      │
        ├────────────────────────────────────┤
        │                                    │
        │  ┌──────────┬────────────┬───────┐ │
        │  │  Home   │  Scanner   │Profile│ │
        │  │  🏠     │   📱       │  👤   │ │
        │  └──────────┴────────────┴───────┘ │
        │                                    │
        │  ┌─────────────────────────────┐  │
        │  │     Currently Selected      │  │
        │  │  Content Area (Scrollable)  │  │
        │  └─────────────────────────────┘  │
        │                                    │
        │  ┌─────────────────────────────┐  │
        │  │   Bottom Tab Bar (Fixed)    │  │
        │  └─────────────────────────────┘  │
        │                                    │
        └────────────────────────────────────┘
```

## Screen Details

### 1️⃣ Home Screen (app/(app)/home.tsx)
```
┌─────────────────────────────────┐
│  FitTrack              ☰         │  ← Header
├─────────────────────────────────┤
│                                 │
│  Welcome Back!                  │  ← Title
│  Track your nutrition journey   │  ← Subtitle
│                                 │
│  Today's Stats                  │  ← Section
│  ┌───────────┬─────────────┐   │
│  │ Calories  │   Water     │   │
│  │ 2,450/2,500 │ 6/8 cups  │   │
│  └───────────┴─────────────┘   │
│                                 │
│  Macronutrients                 │  ← Section
│  ┌─────┬─────┬─────┐           │
│  │Prot │Carbs│ Fat │           │
│  │128g │312g │75g  │           │
│  └─────┴─────┴─────┘           │
│                                 │
│  Quick Actions                  │  ← Section
│  ┌──────────────────────────┐  │
│  │ 📊 View Analytics        │  │
│  └──────────────────────────┘  │
│  ┌──────────────────────────┐  │
│  │ 🎯 Set Goals             │  │
│  └──────────────────────────┘  │
│                                 │
└─────────────────────────────────┘
```

### 2️⃣ Food Scanner Screen (app/(app)/foodscanner.tsx)
```
┌─────────────────────────────────┐
│  FitTrack              ☰         │  ← Header
├─────────────────────────────────┤
│                                 │
│  Food Scanner                   │  ← Title
│  Scan barcode or search...      │  ← Subtitle
│                                 │
│  [Barcode] [Meal Search]        │  ← Tabs
│                                 │
│      ╔════════════╗    ⚡        │  ← Camera frame & flash
│      ║     📷     ║             │
│      ║────────────║             │
│      ╚════════════╝             │
│   Point camera at barcode       │
│                                 │
│  [Search food or barcode...  ]  │  ← Search input
│                                 │
│  Recent Scans                   │  ← Section
│  [Clear all]                    │
│  ┌────────────────────────────┐ │
│  │ 🥚 Boiled Eggs (x2) 155 kcal│ │
│  │    5h ago                  │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 🍌 Banana          105 kcal│ │
│  │    7h ago                  │ │
│  └────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [+ Log Scanned Food]            │  ← Action button
└─────────────────────────────────┘
```

### 3️⃣ Profile Screen (app/(app)/profile.tsx)
```
┌─────────────────────────────────┐
│  FitTrack              ☰         │  ← Header
├─────────────────────────────────┤
│                                 │
│          [👤]                   │  ← Avatar
│        John Doe                 │
│     john@example.com            │
│                                 │
│  Your Stats                     │  ← Section
│  ┌──────────┬──────────┐        │
│  │ Height   │ Weight   │        │
│  │ 180 cm   │ 75 kg    │        │
│  └──────────┴──────────┘        │
│  ┌──────────┬──────────┐        │
│  │  Age     │  Goal    │        │
│  │  28      │ Fitness  │        │
│  └──────────┴──────────┘        │
│                                 │
│  Settings                       │  ← Section
│  ┌────────────────────────────┐ │
│  │ 🔔 Notifications        › │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 🎯 Goals                 › │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ 🔒 Privacy               › │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ ℹ️ About                  › │ │
│  └────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [Logout]                        │  ← Logout button
└─────────────────────────────────┘
```

## Navigation Paths

### After User Registers:
```
Login/Register Page
        ↓ (Click Submit)
  Onboarding Page
        ↓ (Complete onboarding)
    Home Tab ← Default entry to app
```

### After User Logs In:
```
Login/Register Page
        ↓ (Click Submit with existing account)
    Home Tab ← Directly to main app
```

### Moving Between Screens:
```
Home Tab ← → Scanner Tab ← → Profile Tab
   🏠        (Tab Bar)      👤
             📱

Can swipe or tap tabs to navigate
```

## File Locations Quick Reference

```
client/
├── app/
│   ├── _layout.tsx                    ← Root layout
│   ├── index.tsx                      ← Entry point
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                  ← Login/Register
│   │   └── onboarding.tsx             ← Onboarding
│   │
│   └── (app)/                         ← ✨ Main app with tabs
│       ├── _layout.tsx                ← Tab navigator
│       ├── home.tsx                   ← Home/Dashboard
│       ├── foodscanner.tsx            ← Food Scanner
│       └── profile.tsx                ← User Profile
│
├── hooks/
│   └── useFoodScanner.ts              ← State management
│
├── constants/
│   └── colors.ts                      ← Design system
│
└── components/
    ├── auth/                          ← Auth forms
    └── ui/                            ← UI components
```

## Tab Navigation Setup

```typescript
// In app/(app)/_layout.tsx
<Tabs>
  <Tabs.Screen 
    name="home"
    options={{ 
      tabBarIcon: () => <Text>🏠</Text>
    }}
  />
  <Tabs.Screen 
    name="foodscanner"
    options={{ 
      tabBarIcon: () => <Text>📱</Text>
    }}
  />
  <Tabs.Screen 
    name="profile"
    options={{ 
      tabBarIcon: () => <Text>👤</Text>
    }}
  />
</Tabs>
```

## Testing Checklist

- [ ] App starts and shows auth screen
- [ ] Can register and go to onboarding
- [ ] Onboarding redirects to Home tab
- [ ] Can navigate between all 3 tabs
- [ ] Home tab shows stats and actions
- [ ] Scanner tab shows barcode UI and search
- [ ] Can search and filter scans
- [ ] Profile tab shows user info
- [ ] Logout button redirects to auth
- [ ] All buttons are clickable

## Color Scheme Used

| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark Navy | #0B0F1A |
| Surface | Lighter Navy | #111726 |
| Accent | Cyan | #00E5A0 |
| Text | White | #FFFFFF |
| Text Muted | Gray | #8A93A6 |
| Borders | Dark | #2A3346 |

---

Your app is now fully integrated and ready to use! 🚀
