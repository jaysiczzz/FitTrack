# 🏋️‍♂️ FitTrack — AI-Powered Fitness & Nutrition Tracker

<div align="center">

[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NativeWind](https://img.shields.io/badge/TailwindCSS-NativeWind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://www.nativewind.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

<br/>

[![Download APK](https://img.shields.io/badge/Download-FitTrack_APK-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/jaysiczzz/FitTrack/releases/latest)

<p align="center">
  <b>FitTrack</b> is a high-performance, cross-platform mobile fitness companion that combines intelligent workout tracking, nutrition & hydration logging, and real-time AI fitness coaching powered by <b>Google Gemini AI</b>.
</p>

</div>

---

## 🌟 Key Features

### 🏋️‍♂️ Smart Workout Management
- **Interactive Workout Sessions**: Log real-time sets, reps, and weights with dual direct keyboard input and rapid `+`/`-` steppers with debounced cloud synchronization.
- **Personal Records (PR) Tracking**: Automatic all-time PR detection that displays motivational trophy badges (`🏆 PR: 80kg × 8 reps`) directly on exercise cards and features an All-Time Best PR showcase card.
- **Muscle Focus Breakdown**: Dynamic visual progress bars showing the muscle distribution (Chest, Back, Legs, Core, etc.) of today's routine.
- **3-Step Warm-Up & Mobility**: Built-in injury prevention warm-up routine with dynamic joint rotations, cat-cow flow, and warm-up pyramid sets.
- **Comprehensive Exercise Catalog**: Extensive library of 50+ exercises categorized by muscle group, equipment, and difficulty presets (Beginner, Intermediate, Advanced).
- **Detailed Exercise Guides**: View step-by-step instructions, form tips, breathing techniques, common mistakes, and video/GIF demonstrations.
- **Workout History**: Review completed workout sessions with exact timestamps, durations, calories burned, and exercise set histories.
- **Admin Exercise Management**: Role-based access control (RBAC) allowing admins to create, edit, or delete exercises in the shared library directly from the app.

### 🥗 Nutrition & Hydration Tracking
- **Daily Macro & Calorie Tracking**: Monitor protein, carbs, fats, and daily calorie targets with responsive progress indicators.
- **AI Meal Analysis & Image Scanner**: Describe your meal in natural language or scan food photos and nutrition labels with Google Gemini AI for instant macronutrient and calorie extraction.
- **Quick Water Logger**: Track hydration with rapid `+250ml` quick-add buttons and visual goal tracking against daily targets.
- **Offline-First Cloud Sync**: Resilient offline caching via AsyncStorage paired with debounced automatic background synchronization to PostgreSQL, eliminating data loss and hydration overwrites.
- **Day Log Completion**: Save and complete daily nutrition logs with automatic cloud persistence.

### 🤖 AI Fitness Coach (Google Gemini 2.0 Flash)
- **AI Workout Generator**: Generate custom tailored workout routines based on target muscle groups, available equipment, workout duration, and fitness goals.
- **AI Meal Suggestions**: Get personalized meal ideas tailored to target caloric ranges and dietary preferences.
- **Conversational AI Fitness Coach**: Interactive chat interface to ask questions about workout techniques, diet adjustments, recovery protocols, and routine optimization.
- **Intelligent Fitness Insights**: AI-generated suggestions based on recent activity and logged progress.

### 📈 Habit Streaks & Analytics
- **Consecutive Days Streak Calculation**: Accurate calendar day streak engine that counts consecutive workout days backwards from today with an active rollover grace period until midnight.
- **Weekly Workout Counter**: Real-time tracking of completed workouts against weekly fitness targets.
- **Estimated Active Minutes**: Dynamic calculation of daily active time derived from logged sets.
- **Daily Check-Ins**: Fast check-in tracking across Morning, Afternoon, and Night.

### 🎨 UI, UX & Security
- **Dark & Light Mode**: Premium dark slate (`#0B1120`, `#151E2E`) and vibrant emerald accent (`#10B981`) theme system built with NativeWind / Tailwind CSS.
- **Floating Bottom Navigation Bar**: Custom floating navigation dock with ergonomic safe area padding (`paddingBottom: 115`) preventing UI overlap.
- **Secure Authentication & Password Recovery**: JWT-based session management, bcrypt password hashing, and 6-digit email OTP verification for password resets.
- **In-App Support & Bug Reporting**: Built-in feedback submission system with automated ticket ID generation.

---

## 🏗️ Architecture & Project Structure

```
FitTrack/
├── client/                     # Mobile Frontend (React Native / Expo)
│   ├── api/                    # API client layer (auth, workout, foodlog, ai, user)
│   ├── app/                    # Expo Router screens & layouts
│   │   ├── (auth)/             # Login, Register, Forgot Password, Onboarding
│   │   └── (screen)/           # Dashboard, Workouts, Food Log, Profile, Settings
│   ├── components/             # Modular UI components
│   │   ├── ui/                 # SurfaceCard, ProgressBar, FloatingNavBar, ConfirmModal
│   │   └── workouts/           # ExerciseCard, TodayWorkoutTab, WorkoutLibraryTab, HistoryTab
│   ├── constants/              # Theme color definitions & design tokens
│   ├── context/                # AuthContext, ToastContext
│   ├── utils/                  # authStorage, date helpers
│   ├── config.ts               # Dynamic API host resolution (LAN & production)
│   └── tailwind.config.js      # Tailwind CSS configuration
│
└── server/                     # Backend API (Node.js, Express 5, TypeScript)
    ├── prisma/                 # Prisma schema & PostgreSQL migrations
    └── src/
        ├── config/             # Database connection & environment configuration
        ├── controllers/        # Request handlers (auth, workout, foodlog, ai, user)
        ├── middleware/         # Auth, BOLA ownership guards, rate-limiting, error handling
        ├── models/             # Database query layer & exercise seed catalog
        ├── routes/             # Express API route declarations
        ├── schemas/            # Zod validation schemas
        ├── services/           # Gemini AI service & Nodemailer email client
        └── utils/              # asyncHandler, token generation
```

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Mobile Framework** | [React Native 0.86](https://reactnative.dev/) with [Expo SDK 57](https://expo.dev/) (Expo Router) |
| **Styling** | [NativeWind v4](https://www.nativewind.dev/) (Tailwind CSS 3.4) & React Native Reanimated |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict typing across client and server) |
| **Backend Framework** | [Node.js](https://nodejs.org/) & [Express.js 5](https://expressjs.com/) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) (Serverless via [Neon](https://neon.tech)), [Prisma ORM](https://www.prisma.io/) |
| **AI Engine** | [Google Gemini 2.0 Flash](https://ai.google.dev/) (`@google/genai`) |
| **Security & Auth** | JWT (`jsonwebtoken`), `bcrypt`, `helmet`, `express-rate-limit`, Zod validation |
| **Email Services** | [Nodemailer](https://nodemailer.com/) (OTP Password Resets) |
| **Build & Distribution** | Expo Application Services ([EAS Build](https://expo.dev/eas)) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20 LTS recommended)
- [Git](https://git-scm.com/)
- [Expo Go app](https://expo.dev/go) on your physical device (or an Android / iOS simulator)

---

### 1. Clone the Repository
```bash
git clone https://github.com/jaysiczzz/FitTrack.git
cd FitTrack
```

---

### 2. Backend Setup (`server`)

1. Navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `server/`:
   ```env
   # PostgreSQL Connection (Neon Serverless or Local)
   DATABASE_URL="postgresql://user:password@ep-xyz-pooler.neon.tech/fittrack?sslmode=require"
   DIRECT_URL="postgresql://user:password@ep-xyz.neon.tech/fittrack?sslmode=require"

   # JWT Secret
   JWT_SECRET="your_strong_jwt_secret_key"

   # Google Gemini API
   GEMINI_API_KEY="your_google_gemini_api_key"

   # Server Port
   PORT=3000

   # Email Configuration for Password Reset OTPs (Optional for dev)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

4. Push database schema and generate Prisma Client:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will boot on `http://localhost:3000` and automatically verify and seed the exercise catalog.*

---

### 3. Mobile Frontend Setup (`client`)

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in `client/`:
   ```env
   # Local development (replace with your machine's LAN IP address):
   EXPO_PUBLIC_API_URL=http://192.168.1.XX:3000

   # Or production backend:
   # EXPO_PUBLIC_API_URL=https://your-fittrack-api.onrender.com
   ```

4. Start the Expo development server:
   ```bash
   npx expo start -c
   ```

5. Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

---

## 📱 Building the Standalone Android APK

You can build an installable `.apk` file using Expo EAS Build:

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```bash
   eas login
   ```

3. Build the preview APK:
   ```bash
   cd client
   eas build -p android --profile preview
   ```

4. Once the build finishes, download and install the APK on your Android device from the provided Expo build link.

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user account | ❌ |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | ❌ |
| `POST` | `/api/auth/refresh` | Refresh expired access token | ❌ |
| `POST` | `/api/auth/logout` | Invalidate current session | ❌ |
| `POST` | `/api/auth/check-email` | Verify email availability during registration | ❌ |
| `POST` | `/api/auth/change-password` | Change password for authenticated user | ✅ |
| `POST` | `/api/auth/forgot-password` | Request 6-digit password reset OTP via email | ❌ |
| `POST` | `/api/auth/reset-password` | Reset password using OTP code | ❌ |

### 👤 User Profile (`/api/user`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/user/profile` | Retrieve user profile, measurements, and goals | ✅ |
| `PUT` | `/api/user/profile` | Update profile metrics (weight, height, goals) | ✅ |

### 🏋️‍♂️ Workouts & Exercises (`/api/workouts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/workouts/library` | List all system library exercises (supports filters) | ✅ |
| `GET` | `/api/workouts/library/:id` | Get full instructions and details for an exercise | ✅ |
| `POST` | `/api/workouts/library` | Create a new library exercise *(Admin only)* | ✅ (Admin) |
| `PUT` | `/api/workouts/library/:id` | Update a library exercise *(Admin only)* | ✅ (Admin) |
| `DELETE` | `/api/workouts/library/:id` | Remove a library exercise *(Admin only)* | ✅ (Admin) |
| `POST` | `/api/workouts/custom` | Create a user-specific custom exercise | ✅ |
| `DELETE` | `/api/workouts/custom/:id` | Delete a user-specific custom exercise | ✅ |
| `GET` | `/api/workouts/today` | Fetch today's active workout session and exercises | ✅ |
| `POST` | `/api/workouts/today/add-exercise` | Add an exercise to today's active session | ✅ |
| `DELETE` | `/api/workouts/exercises/:exerciseId` | Remove an exercise from today's session | ✅ |
| `POST` | `/api/workouts/exercises/:exerciseId/sets` | Add a new set to an exercise | ✅ |
| `PATCH` | `/api/workouts/sets/:setId` | Update weight, reps, or done status of a set | ✅ |
| `PATCH` | `/api/workouts/sets/:setId/toggle` | Toggle completion checkbox for a set | ✅ |
| `DELETE` | `/api/workouts/sets/:setId` | Delete a set from an exercise | ✅ |
| `POST` | `/api/workouts/today/complete` | Finalize and complete today's workout session | ✅ |
| `GET` | `/api/workouts/history` | Retrieve all completed workout session logs | ✅ |
| `GET` | `/api/workouts/personal-records` | Retrieve calculated all-time personal records (PRs) | ✅ |

### 🥗 Food & Nutrition (`/api/food-log`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/food-log/search` | Search online food databases for nutritional data | ✅ |
| `POST` | `/api/food-log/custom` | Create a custom food item with custom macros | ✅ |
| `DELETE` | `/api/food-log/custom/:id` | Delete a custom food item | ✅ |
| `GET` | `/api/food-log/:date` | Get food and water log for a specific date (`YYYY-MM-DD`) | ✅ |
| `POST` | `/api/food-log/save-day` | Auto-sync and persist daily meals and water volume | ✅ |
| `GET` | `/api/food-log/history` | Get past food log history summaries | ✅ |
| `DELETE` | `/api/food-log/:date` | Delete logged meals for a specific date | ✅ |

### 🤖 AI Services (`/api/ai`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/ai/analyze-meal` | Analyze meal text or scanned nutrition label with Gemini | ✅ |
| `POST` | `/api/ai/generate-workout` | Generate personalized routine with Gemini AI | ✅ |
| `POST` | `/api/ai/suggest-meals` | Suggest meals based on calorie and macro goals | ✅ |
| `POST` | `/api/ai/chat` | Conversational fitness coaching with Gemini AI | ✅ |
| `GET` | `/api/ai/insights` | Retrieve weekly fitness insights and suggestions | ✅ |

### 💬 Support & Feedback (`/api/support`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/support/feedback` | Submit bug reports or user suggestions | Optional |

---

## 🔒 Security & Best Practices
- **Broken Object Level Authorization (BOLA) Protection**: Custom ownership validation middleware (`validateSetOwnership`, `validateWorkoutExerciseOwnership`) verifies that users can only modify sets and exercises belonging to their own workout sessions.
- **Identity-Aware AI Rate Limiting**: Per-user sliding-window rate limiters prevent API abuse on Gemini AI endpoints while preserving responsiveness.
- **Input Validation**: Strictly typed Zod validation schemas across all incoming request bodies and query parameters.
- **HTTP Security**: Express headers secured via `helmet` and CORS policies configured for mobile client consumption.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

<div align="center">
  <sub>Built with ❤️ by the FitTrack Team</sub>
</div>