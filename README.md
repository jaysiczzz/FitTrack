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
  <b>FitTrack</b> is a cross-platform mobile fitness companion that combines workout tracking, nutritional meal logging, and real-time AI-powered fitness insights powered by <b>Google Gemini AI</b>.
</p>

</div>

---

## 🌟 Key Features

### 🏋️‍♂️ Smart Workout Management
- **Interactive Workout Sessions**: Log real-time sets, reps, and weights with instant bodyweight toggles and completion checkboxes.
- **Comprehensive Exercise Catalog**: Rich library of 50+ exercises categorized by muscle groups, equipment requirements, and difficulty levels.
- **Detailed Exercise Guides**: View instructions, form tips, breathing techniques, common mistakes, and video/GIF demonstrations.
- **Workout History**: Review past workout durations, total calories burned, and detailed exercise breakdowns.
- **Admin Exercise Management**: Role-based access allowing admins to create, edit, or delete exercises in the shared library directly from the mobile app.

### 🥗 Nutrition & Meal Logging
- **Daily Macro & Calorie Tracking**: Monitor protein, carbs, fats, and daily calorie targets with visual progress indicators.
- **AI Meal Analysis**: Describe your meals in plain text or analyze nutritional breakdowns with estimated calories and macros via Google Gemini AI.

### 🤖 AI Fitness Coach (Google Gemini)
- **Personalized Workout Recommendations**: Custom workout routines tailored to user goals (Muscle Gain vs. Weight Loss), equipment, and fitness level.
- **Intelligent Fitness Insights**: AI-generated suggestions based on weekly activity and logged workouts.

### 📊 User Profile & Analytics
- **Personalized Onboarding**: 2-step setup calculating body metrics (BMI), height, weight, and fitness targets.
- **Dark & Light Mode**: Seamless UI styling powered by Tailwind CSS / NativeWind.
- **Secure Authentication**: JWT-based session management and encrypted password storage.

---

## 🏗️ Tech Stack & Architecture

```
FitTrack/
├── client/                 # Mobile Application (React Native / Expo)
│   ├── api/                # API client & services (Auth, Workout, User, AI)
│   ├── app/                # Expo Router screen navigation & layouts
│   │   ├── (auth)/         # Login, Register, & Onboarding screens
│   │   └── (screen)/       # Dashboard, Workouts, Food Log, Profile, Settings
│   ├── components/         # Reusable UI components & modals
│   ├── config.ts           # Dynamic API host resolution
│   └── tailwind.config.js  # Styling & theme system
│
└── server/                 # Backend API (Express.js & TypeScript)
    ├── prisma/             # Prisma schema & database migrations
    └── src/
        ├── controllers/    # Request handlers (Auth, Workout, User, AI)
        ├── middleware/     # JWT Auth & Error Handling middleware
        ├── models/         # Database queries & exercise seed catalog
        ├── routes/         # REST API route endpoints
        └── services/       # Google Gemini AI integration
```

### Stack Details
- **Mobile Frontend**: React Native 0.86, Expo SDK 57, Expo Router, NativeWind (Tailwind CSS), React Native Reanimated.
- **Backend API**: Node.js, Express.js 5, TypeScript.
- **Database & ORM**: PostgreSQL (hosted on [Neon](https://neon.tech)), Prisma ORM.
- **AI Engine**: Google Gemini API (`@google/genai`).
- **Cloud Hosting**: [Render](https://render.com) (Web Service).
- **Build & Distribution**: Expo Application Services (EAS Build).

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- [Expo Go app](https://expo.dev/go) on your mobile device (or Android Studio for emulator testing)

---

### 1. Clone Repository
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

3. Create a `.env` file inside `server/`:
   ```env
   DATABASE_URL="your_neon_postgresql_pooler_url"
   DIRECT_URL="your_neon_postgresql_direct_url"
   JWT_SECRET="your_secure_jwt_secret"
   GEMINI_API_KEY="your_google_gemini_api_key"
   PORT=3000
   ```

4. Generate Prisma Client & push database schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will start on `http://localhost:3000` and automatically verify/seed the exercise catalog.*

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

3. Create a `.env` file inside `client/`:
   ```env
   # For local testing on Wi-Fi:
   EXPO_PUBLIC_API_URL=http://<YOUR_COMPUTER_LOCAL_IP>:3000

   # Or for production cloud backend:
   # EXPO_PUBLIC_API_URL=https://your-fittrack-api.onrender.com
   ```

4. Start the Expo development server:
   ```bash
   npx expo start -c
   ```

5. Scan the QR code with **Expo Go** (Android) or the **Camera app** (iOS).

---

## 📱 Building the Standalone Android APK

To generate an installable `.apk` file using Expo EAS Build:

1. Install EAS CLI globally:
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

4. Once the build completes, download and install the generated `.apk` file directly on your Android device.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login user & return JWT token | ❌ |
| `GET` | `/api/user/profile` | Get current user's profile | ✅ |
| `PUT` | `/api/user/profile` | Update user measurements & goals | ✅ |
| `GET` | `/api/workouts/exercises` | List all library exercises (with filters) | ✅ |
| `POST` | `/api/workouts/exercises` | Create a new library exercise *(Admin only)* | ✅ (Admin) |
| `GET` | `/api/workouts/history` | Get user's workout session history | ✅ |
| `POST` | `/api/workouts/sessions` | Create/log a completed workout session | ✅ |
| `POST` | `/api/ai/analyze-meal` | Analyze meal text/nutrition with Gemini AI | ✅ |
| `POST` | `/api/ai/generate-workout` | Generate custom workout routine with Gemini AI | ✅ |
| `POST` | `/api/ai/insights` | Get personalized AI fitness advice | ✅ |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

<div align="center">
  <sub>Built with ❤️ by the FitTrack Team</sub>
</div>