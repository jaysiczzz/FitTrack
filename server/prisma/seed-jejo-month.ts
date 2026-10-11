import 'dotenv/config'
import { prisma } from '../src/config/db'
import { Goal } from '@prisma/client'

const TARGET_USER_EMAIL = 'jejo@gmail.com'

// Helper to format date YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function main() {
  console.log(`Starting 30-day realistic fitness & nutrition seeding for ${TARGET_USER_EMAIL}...`)

  const user = await prisma.user.findUnique({
    where: { email: TARGET_USER_EMAIL },
  })

  if (!user) {
    throw new Error(`User with email ${TARGET_USER_EMAIL} not found!`)
  }

  const userId = user.id
  console.log(`Found target user ${user.firstName} ${user.lastName} (ID: ${userId})`)

  // 1. Update User Profile with calibrated muscle-gain body metrics
  await prisma.user.update({
    where: { id: userId },
    data: {
      height: 178,
      weight: 68.3, // Gained from 65.5kg over the month
      targetWeight: 72.0,
      age: 26,
      goal: Goal.MUSCLE_GAIN,
    },
  })
  console.log('✓ Updated user profile metrics (178cm, 68.3kg, target: 72.0kg, goal: MUSCLE_GAIN)')

  // 1b. Ensure active FitTrack Pro Monthly subscription
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier: 'PRO_MONTHLY',
      status: 'ACTIVE',
      currency: 'PHP',
      amount: 499,
      interval: 'month',
      currentPeriodStart: new Date('2026-09-09T00:00:00Z'),
      currentPeriodEnd: new Date('2026-11-09T00:00:00Z'),
    },
    update: {
      tier: 'PRO_MONTHLY',
      status: 'ACTIVE',
      currentPeriodStart: new Date('2026-09-09T00:00:00Z'),
      currentPeriodEnd: new Date('2026-11-09T00:00:00Z'),
    },
  })
  console.log('✓ Configured active FitTrack Pro subscription (PRO_MONTHLY)')

  // 2. Fetch exercise library for linking
  const exercises = await prisma.exercise.findMany({
    select: { id: true, name: true, category: true, muscleGroup: true },
  })
  const exerciseMap = new Map<string, string>()
  exercises.forEach((e) => {
    exerciseMap.set(e.name.toLowerCase().trim(), e.id)
  })

  const getExerciseId = (name: string): string | null => {
    const key = name.toLowerCase().trim()
    for (const [k, v] of exerciseMap.entries()) {
      if (k === key || k.includes(key) || key.includes(k)) {
        return v
      }
    }
    return null
  }

  // 3. Clear existing user activity data to ensure a clean, cohesive month
  console.log('Clearing previous test activity data for user...')
  await prisma.exerciseSet.deleteMany({
    where: { workoutExercise: { workoutSession: { userId } } },
  })
  await prisma.workoutExercise.deleteMany({
    where: { workoutSession: { userId } },
  })
  await prisma.workoutSession.deleteMany({ where: { userId } })
  await prisma.foodLogMeal.deleteMany({
    where: { dailyFoodLog: { userId } },
  })
  await prisma.dailyFoodLog.deleteMany({ where: { userId } })
  await prisma.dailyCheckIn.deleteMany({ where: { userId } })
  await prisma.weightLog.deleteMany({ where: { userId } })
  console.log('✓ Previous activity data cleared')

  // Define 32 dates from 2026-09-10 to 2026-10-11 (including today)
  const dates: string[] = []
  const startDate = new Date(2026, 8, 10) // 2026-09-10
  const endDate = new Date(2026, 9, 11)   // 2026-10-11 (Today)
  const current = new Date(startDate)

  while (current <= endDate) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }
  console.log(`Generated ${dates.length} date entries from ${dates[0]} to ${dates[dates.length - 1]}`)

  // 4. Upsert WorkoutPlan (Weekly Split & Templates with default templates included)
  const defaultRoutineTemplates = [
    {
      id: 'template-push-1',
      title: 'Push Day (Chest, Shoulders & Triceps)',
      name: 'Push Day (Chest, Shoulders & Triceps)',
      category: 'Hypertrophy',
      targetMuscleGroup: 'Chest & Shoulders',
      estimatedDurationMinutes: 45,
      exercises: [
        { name: 'Bench Press', sets: 3, reps: 10 },
        { name: 'Overhead Shoulder Press', sets: 3, reps: 8 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
        { name: 'Push-ups', sets: 3, reps: 15 },
      ],
    },
    {
      id: 'template-pull-1',
      title: 'Pull Day (Back, Biceps & Lats)',
      name: 'Pull Day (Back, Biceps & Lats)',
      category: 'Hypertrophy',
      targetMuscleGroup: 'Back & Biceps',
      estimatedDurationMinutes: 45,
      exercises: [
        { name: 'Pull-ups', sets: 3, reps: 10 },
        { name: 'Bent-Over Barbell Row', sets: 3, reps: 8 },
        { name: 'Barbell Bicep Curl', sets: 3, reps: 10 },
        { name: 'Lat Pulldown', sets: 3, reps: 10 },
      ],
    },
    {
      id: 'template-legs-1',
      title: 'Leg Day & Core (Quads, Glutes & Abs)',
      name: 'Leg Day & Core (Quads, Glutes & Abs)',
      category: 'Strength',
      targetMuscleGroup: 'Legs & Core',
      estimatedDurationMinutes: 50,
      exercises: [
        { name: 'Barbell Squat', sets: 3, reps: 10 },
        { name: 'Romanian Deadlift', sets: 3, reps: 10 },
        { name: 'Walking Dumbbell Lunges', sets: 3, reps: 12 },
        { name: 'Plank', sets: 3, reps: 60 },
      ],
    },
    {
      id: 'template-upper-1',
      title: 'Upper Body Power Split',
      name: 'Upper Body Power Split',
      category: 'Strength',
      targetMuscleGroup: 'Upper Body',
      estimatedDurationMinutes: 40,
      exercises: [
        { name: 'Bench Press', sets: 3, reps: 8 },
        { name: 'Bent-Over Barbell Row', sets: 3, reps: 8 },
      ],
    },
    {
      id: 'template-fullbody-1',
      title: 'Full Body Conditioning & Core',
      name: 'Full Body Conditioning & Core',
      category: 'Conditioning',
      targetMuscleGroup: 'Full Body',
      estimatedDurationMinutes: 35,
      exercises: [
        { name: 'Dumbbell Goblet Squat', sets: 3, reps: 12 },
      ],
    },
  ]

  const customRoutineTemplates = [
    {
      id: 'template-push-hypertrophy',
      title: 'Push Day - Chest, Shoulders & Triceps',
      name: 'Push Day - Chest, Shoulders & Triceps',
      category: 'Strength',
      difficulty: 'Intermediate',
      estimatedMinutes: 52,
      targetMuscles: ['Chest', 'Shoulders', 'Triceps'],
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 8 },
        { name: 'Incline Barbell Bench Press', sets: 3, reps: 10 },
        { name: 'Cable Lateral Raises', sets: 3, reps: 12 },
        { name: 'EZ-Bar Skull Crushers', sets: 3, reps: 10 },
      ],
    },
    {
      id: 'template-pull-strength',
      title: 'Pull Day - Back & Biceps',
      name: 'Pull Day - Back & Biceps',
      category: 'Strength',
      difficulty: 'Intermediate',
      estimatedMinutes: 55,
      targetMuscles: ['Back', 'Biceps', 'Forearms'],
      exercises: [
        { name: 'Conventional Barbell Deadlift', sets: 4, reps: 6 },
        { name: 'Lat Pulldown', sets: 3, reps: 10 },
        { name: 'Seated Cable Row', sets: 3, reps: 10 },
        { name: 'Barbell Bicep Curl', sets: 3, reps: 10 },
      ],
    },
    {
      id: 'template-legs-power',
      title: 'Leg Day - Quads, Hamstrings & Calves',
      name: 'Leg Day - Quads, Hamstrings & Calves',
      category: 'Strength',
      difficulty: 'Intermediate',
      estimatedMinutes: 58,
      targetMuscles: ['Legs', 'Glutes', 'Calves'],
      exercises: [
        { name: 'Barbell Squat', sets: 4, reps: 8 },
        { name: 'Romanian Deadlift', sets: 3, reps: 10 },
        { name: 'Bulgarian Split Squat', sets: 3, reps: 10 },
        { name: 'Standing Calf Raises', sets: 4, reps: 15 },
      ],
    },
    {
      id: 'template-upper-hypertrophy',
      title: 'Upper Body Hypertrophy & Arms',
      name: 'Upper Body Hypertrophy & Arms',
      category: 'Strength',
      difficulty: 'Intermediate',
      estimatedMinutes: 50,
      targetMuscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
      exercises: [
        { name: 'Flat Dumbbell Bench Press', sets: 3, reps: 10 },
        { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: 10 },
        { name: 'Dumbbell Hammer Curls', sets: 3, reps: 12 },
        { name: 'Cable Face Pulls', sets: 3, reps: 15 },
      ],
    },
  ]

  const routineTemplates = [...defaultRoutineTemplates, ...customRoutineTemplates]

  const weeklySplit = {
    mon: 'template-push-hypertrophy',
    tue: 'template-pull-strength',
    wed: null, // Rest & Active Recovery
    thu: 'template-legs-power',
    fri: 'template-upper-hypertrophy',
    sat: null, // Rest & Mobility
    sun: null, // Rest & Meal Prep
  }

  const monthlySchedule: Record<string, any> = {}
  dates.forEach((dStr) => {
    const d = new Date(`${dStr}T12:00:00Z`)
    const dayOfWeek = d.getUTCDay() // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    if (dayOfWeek === 1) {
      monthlySchedule[dStr] = { routineId: 'template-push-hypertrophy', isRestDay: false }
    } else if (dayOfWeek === 2) {
      monthlySchedule[dStr] = { routineId: 'template-pull-strength', isRestDay: false }
    } else if (dayOfWeek === 4) {
      monthlySchedule[dStr] = { routineId: 'template-legs-power', isRestDay: false }
    } else if (dayOfWeek === 5) {
      monthlySchedule[dStr] = { routineId: 'template-upper-hypertrophy', isRestDay: false }
    } else {
      monthlySchedule[dStr] = { routineId: null, isRestDay: true }
    }
  })

  await prisma.workoutPlan.upsert({
    where: { userId },
    create: {
      userId,
      weeklySplit,
      routineTemplates,
      monthlySchedule,
      monthlyTargetDays: 18,
      currentMesocycleWeek: 4,
    },
    update: {
      weeklySplit,
      routineTemplates,
      monthlySchedule,
      monthlyTargetDays: 18,
      currentMesocycleWeek: 4,
    },
  })
  console.log('✓ Configured user WorkoutPlan (4-day split, 4 routine templates, monthly calendar schedule)')

  // 5. Seed Weight Logs across the 32 days (6 realistic periodic weigh-ins)
  const weightLogsData = [
    { date: dates[0], weight: 66.2, notes: 'Starting lean bulk baseline weigh-in after morning fast' },
    { date: dates[6], weight: 66.5, notes: 'End of week 1. Good appetite, hydration feeling solid.' },
    { date: dates[13], weight: 66.9, notes: 'Week 2 check-in. Compound lifts feeling noticeably stronger.' },
    { date: dates[20], weight: 67.3, notes: 'End of week 3 weigh-in. Bodyweight up +1.1kg cleanly.' },
    { date: dates[27], weight: 67.8, notes: 'Week 4 milestone. Energy levels consistent throughout workouts.' },
    { date: dates[dates.length - 1], weight: 68.3, notes: 'Today morning weigh-in. +2.1kg total progress over the month!' },
  ]

  for (const w of weightLogsData) {
    await prisma.weightLog.create({
      data: {
        userId,
        date: w.date,
        weight: w.weight,
        notes: w.notes,
        createdAt: new Date(`${w.date}T07:30:00Z`),
      },
    })
  }
  console.log(`✓ Seeded ${weightLogsData.length} periodic WeightLog records (from 66.2kg to 68.3kg)`)

  // 6. Seed Daily Readiness Check-Ins (31 consecutive days)
  const checkInProfiles: Record<number, { moodId: string; moodLabel: string; coachTip: string; quote: string; quoteAuthor: string }> = {
    1: {
      moodId: 'strong',
      moodLabel: 'Strong',
      coachTip: 'Push Day Focus: Warm up your rotator cuffs thoroughly before heavy benching.',
      quote: 'The last three or four reps is what makes the muscle grow.',
      quoteAuthor: 'Arnold Schwarzenegger',
    },
    2: {
      moodId: 'fire',
      moodLabel: 'Energized',
      coachTip: 'Pull Day Focus: Initiate deadlifts and rows from the lats rather than arms.',
      quote: 'Everybody wants to be a bodybuilder, but nobody wants to lift no heavy-ass weights.',
      quoteAuthor: 'Ronnie Coleman',
    },
    3: {
      moodId: 'rest',
      moodLabel: 'Recovery',
      coachTip: 'Active Recovery: Drink at least 2.5L water and take a 20-minute brisk walk.',
      quote: 'Rest and self-care are so important. When you take time to replenish your spirit, it allows you to serve others from the overflow.',
      quoteAuthor: 'Eleanor Brown',
    },
    4: {
      moodId: 'strong',
      moodLabel: 'Strong',
      coachTip: 'Leg Day Focus: Drive through the midfoot on squats and control the eccentric descent.',
      quote: 'If you want something you’ve never had, you must be willing to do something you’ve never done.',
      quoteAuthor: 'Thomas Jefferson',
    },
    5: {
      moodId: 'fire',
      moodLabel: 'Energized',
      coachTip: 'Upper Body Pump: Keep rest periods under 75 seconds on isolation arm work for maximum hypertrophy.',
      quote: 'Don’t count the days, make the days count.',
      quoteAuthor: 'Muhammad Ali',
    },
    6: {
      moodId: 'good',
      moodLabel: 'Balanced',
      coachTip: 'Weekend Recovery: Aim for 8+ hours of deep sleep to support protein synthesis.',
      quote: 'Small disciplines repeated with consistency every day lead to great achievements.',
      quoteAuthor: 'John C. Maxwell',
    },
    0: {
      moodId: 'good',
      moodLabel: 'Balanced',
      coachTip: 'Weekly Prep: Prep your high-protein lunches for the upcoming training week.',
      quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
      quoteAuthor: 'Will Durant',
    },
  }

  const checkInNotesSample = [
    'Hit all bench sets cleanly with crisp bar speed. Feeling stronger every session.',
    'Deadlifts felt explosive today. Kept bracing tight throughout.',
    'Rest day. Took a 30m nature walk, foam rolled quads and drank 3L water.',
    'Challenging leg session! Quad pump was intense, hit 90kg on back squats.',
    'Great Friday pump. Incline dumbbells and cable work felt fantastic.',
    'Relaxed weekend recovery. Meal prepped chicken breast and rice.',
    'Reviewed weekly log: met all macro and hydration targets 7/7 days.',
    'Energy high this morning. Warmed up with dynamic band pull-aparts.',
    'Back soreness from deadlifts is real but good. Prioritized sleep.',
    'Rest day. Mobility work for hips and hamstrings felt restorative.',
    'Hit a new 4-rep PR on bench press! Spotter didn’t need to touch the bar.',
    'Shoulders and arms session was pure fire. Hydration kept energy level high.',
    'Pre-workout meal timed 90 mins prior gave sustained energy throughout.',
    'Recovery day. Re-hydrated with electrolyte water.',
    'Squat technique felt rock solid. Kept knees tracking over toes.',
    'Final week of mesocycle: pushing volume with pristine form.',
    'Ready for today! Morning readiness check complete.',
  ]

  // Inconsistent check-in days: active user misses ~9 days over the month
  const skippedCheckInDates = new Set([
    dates[1],  // 2026-09-11
    dates[3],  // 2026-09-13 (Sunday)
    dates[5],  // 2026-09-15
    dates[10], // 2026-09-20 (Sunday)
    dates[11], // 2026-09-21
    dates[15], // 2026-09-25
    dates[16], // 2026-09-26 (Saturday)
    dates[21], // 2026-10-01
    dates[24], // 2026-10-04 (Sunday)
  ])

  let noteIdx = 0
  let totalCheckIns = 0
  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i]
    if (skippedCheckInDates.has(dateStr)) {
      continue
    }

    const d = new Date(`${dateStr}T12:00:00Z`)
    const dayOfWeek = d.getUTCDay()
    const profile = checkInProfiles[dayOfWeek]

    // Provide personal athlete notes on ~75% of days
    const hasNote = i % 4 !== 3 || i === dates.length - 1
    const noteText = hasNote ? checkInNotesSample[noteIdx % checkInNotesSample.length] : null
    if (hasNote) noteIdx++

    await prisma.dailyCheckIn.create({
      data: {
        userId,
        date: dateStr,
        moodId: profile.moodId,
        moodLabel: profile.moodLabel,
        coachTip: profile.coachTip,
        quote: profile.quote,
        quoteAuthor: profile.quoteAuthor,
        notes: noteText,
        createdAt: new Date(`${dateStr}T08:15:00Z`),
        updatedAt: new Date(`${dateStr}T08:15:00Z`),
      },
    })
    totalCheckIns++
  }
  console.log(`✓ Seeded ${totalCheckIns}/${dates.length} DailyCheckIn records (realistic ~72% adherence, active 4-day current streak)`)

  // 7. Seed Completed Workout Sessions
  // Training schedule: Mon (Push), Tue (Pull), Thu (Legs), Fri (Upper)
  // Active user misses ~6 scheduled sessions out of 18 (~66% adherence)
  const missedWorkoutDates = new Set([
    dates[1],  // 2026-09-11 (Friday: skipped upper body after busy work week)
    dates[5],  // 2026-09-15 (Tuesday: skipped pull day, worked late)
    dates[11], // 2026-09-21 (Monday: skipped push day, fatigued)
    dates[15], // 2026-09-25 (Friday: skipped upper body, out with friends)
    dates[21], // 2026-10-01 (Thursday: skipped legs, slight knee ache)
    dates[26], // 2026-10-06 (Tuesday: skipped pull day)
  ])

  let totalSessionsCreated = 0

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i]
    if (missedWorkoutDates.has(dateStr)) {
      continue
    }

    const d = new Date(`${dateStr}T12:00:00Z`)
    const dayOfWeek = d.getUTCDay()

    // Week progressive scaling factor (0, 1, 2, 3, 4)
    const weekProgress = Math.min(4, Math.floor(i / 7))
    const weightBump = weekProgress * 2.5 // Add 2.5kg per week to main lifts for progressive overload!

    let sessionTitle = ''
    let sessionDuration = 50
    let sessionCalories = 380
    let sessionExercises: { name: string; sets: { weight: number; reps: number }[] }[] = []

    if (dayOfWeek === 1) {
      // Monday: Push Day
      sessionTitle = 'Push Day - Hypertrophy & Power'
      sessionDuration = 52 + (i % 5)
      sessionCalories = 390 + (i % 40)
      sessionExercises = [
        {
          name: 'Bench Press',
          sets: [
            { weight: 62.5 + weightBump, reps: 10 },
            { weight: 67.5 + weightBump, reps: 8 },
            { weight: 72.5 + weightBump, reps: 6 },
          ],
        },
        {
          name: 'Incline Barbell Bench Press',
          sets: [
            { weight: 50 + weightBump, reps: 10 },
            { weight: 52.5 + weightBump, reps: 8 },
            { weight: 55 + weightBump, reps: 8 },
          ],
        },
        {
          name: 'Cable Lateral Raises',
          sets: [
            { weight: 9, reps: 15 },
            { weight: 10, reps: 12 },
            { weight: 11, reps: 12 },
          ],
        },
        {
          name: 'EZ-Bar Skull Crushers',
          sets: [
            { weight: 25 + weightBump * 0.5, reps: 12 },
            { weight: 27.5 + weightBump * 0.5, reps: 10 },
            { weight: 30 + weightBump * 0.5, reps: 8 },
          ],
        },
      ]
    } else if (dayOfWeek === 2) {
      // Tuesday: Pull Day
      sessionTitle = 'Pull Day - Back Density & Biceps'
      sessionDuration = 56 + (i % 4)
      sessionCalories = 420 + (i % 50)
      sessionExercises = [
        {
          name: 'Conventional Barbell Deadlift',
          sets: [
            { weight: 85 + weightBump * 1.5, reps: 8 },
            { weight: 95 + weightBump * 1.5, reps: 6 },
            { weight: 105 + weightBump * 1.5, reps: 5 },
          ],
        },
        {
          name: 'Lat Pulldown',
          sets: [
            { weight: 55 + weightBump, reps: 10 },
            { weight: 60 + weightBump, reps: 8 },
            { weight: 65 + weightBump, reps: 8 },
          ],
        },
        {
          name: 'Seated Cable Row',
          sets: [
            { weight: 50 + weightBump, reps: 12 },
            { weight: 55 + weightBump, reps: 10 },
            { weight: 60 + weightBump, reps: 8 },
          ],
        },
        {
          name: 'Barbell Bicep Curl',
          sets: [
            { weight: 25 + weightBump * 0.5, reps: 12 },
            { weight: 27.5 + weightBump * 0.5, reps: 10 },
            { weight: 30 + weightBump * 0.5, reps: 8 },
          ],
        },
      ]
    } else if (dayOfWeek === 4) {
      // Thursday: Leg Day
      sessionTitle = 'Leg Day - Quad & Hamstring Focus'
      sessionDuration = 58 + (i % 6)
      sessionCalories = 450 + (i % 40)
      sessionExercises = [
        {
          name: 'Barbell Squat',
          sets: [
            { weight: 75 + weightBump * 1.5, reps: 10 },
            { weight: 82.5 + weightBump * 1.5, reps: 8 },
            { weight: 90 + weightBump * 1.5, reps: 6 },
          ],
        },
        {
          name: 'Romanian Deadlift',
          sets: [
            { weight: 65 + weightBump, reps: 10 },
            { weight: 72.5 + weightBump, reps: 8 },
            { weight: 77.5 + weightBump, reps: 8 },
          ],
        },
        {
          name: 'Bulgarian Split Squat',
          sets: [
            { weight: 16, reps: 10 },
            { weight: 18, reps: 10 },
            { weight: 20, reps: 8 },
          ],
        },
        {
          name: 'Standing Calf Raises',
          sets: [
            { weight: 45, reps: 15 },
            { weight: 50, reps: 15 },
            { weight: 55, reps: 12 },
          ],
        },
      ]
    } else if (dayOfWeek === 5) {
      // Friday: Upper Body Hypertrophy
      sessionTitle = 'Upper Body Hypertrophy & Arms'
      sessionDuration = 50 + (i % 5)
      sessionCalories = 380 + (i % 30)
      sessionExercises = [
        {
          name: 'Flat Dumbbell Bench Press',
          sets: [
            { weight: 24 + weightBump * 0.5, reps: 10 },
            { weight: 26 + weightBump * 0.5, reps: 10 },
            { weight: 28 + weightBump * 0.5, reps: 8 },
          ],
        },
        {
          name: 'Seated Dumbbell Shoulder Press',
          sets: [
            { weight: 18 + weightBump * 0.5, reps: 10 },
            { weight: 20 + weightBump * 0.5, reps: 8 },
            { weight: 22 + weightBump * 0.5, reps: 8 },
          ],
        },
        {
          name: 'Dumbbell Hammer Curls',
          sets: [
            { weight: 12, reps: 12 },
            { weight: 14, reps: 10 },
            { weight: 16, reps: 8 },
          ],
        },
        {
          name: 'Cable Face Pulls',
          sets: [
            { weight: 25, reps: 15 },
            { weight: 27.5, reps: 15 },
            { weight: 30, reps: 12 },
          ],
        },
      ]
    }

    if (sessionExercises.length > 0) {
      // Day 19 was a shorter session where user pushed through despite feeling tired
      if (i === 19 && sessionExercises.length > 2) {
        sessionExercises = sessionExercises.slice(0, 2)
        sessionDuration = 32
        sessionCalories = 240
      }

      const startTime = new Date(`${dateStr}T17:00:00.000Z`)
      const endTime = new Date(startTime.getTime() + sessionDuration * 60 * 1000)

      const session = await prisma.workoutSession.create({
        data: {
          userId,
          title: sessionTitle,
          duration: sessionDuration,
          caloriesBurned: sessionCalories,
          completed: true,
          startedAt: startTime,
          completedAt: endTime,
          createdAt: startTime,
        },
      })

      for (const ex of sessionExercises) {
        const matchedExerciseId = getExerciseId(ex.name)
        const workoutEx = await prisma.workoutExercise.create({
          data: {
            workoutSessionId: session.id,
            exerciseId: matchedExerciseId,
            name: ex.name,
            category: 'Strength',
            type: 'Compound',
          },
        })

        for (let sIdx = 0; sIdx < ex.sets.length; sIdx++) {
          const s = ex.sets[sIdx]
          await prisma.exerciseSet.create({
            data: {
              workoutExerciseId: workoutEx.id,
              setNumber: sIdx + 1,
              weight: s.weight,
              reps: s.reps,
              bodyweight: false,
              done: true,
            },
          })
        }
      }

      totalSessionsCreated++
    }
  }
  console.log(`✓ Seeded ${totalSessionsCreated} completed WorkoutSessions with full exercises and completed sets`)

  // 8. Seed Daily Food Logs & Meals (31 consecutive days)
  const mealVariations = [
    {
      breakfast: {
        title: 'Oatmeal with Whey Protein & Blueberries',
        subtitle: '1 cup rolled oats, 1 scoop whey, 1/2 cup fresh berries',
        calories: 510,
        protein: 38,
        carbs: 68,
        fat: 9,
        goalBadge: '🟢 High Protein',
        goalBadgeColor: 'green',
        icon: '🥣',
        healthNotes: 'Slow-digesting complex carbs and micronutrient-rich antioxidants',
      },
      lunch: {
        title: 'Grilled Chicken Breast & Jasmine Rice',
        subtitle: '180g lean chicken breast, 1.5 cups jasmine rice, steamed broccoli',
        calories: 720,
        protein: 54,
        carbs: 85,
        fat: 14,
        goalBadge: '🟢 High Protein',
        goalBadgeColor: 'green',
        icon: '🍗',
        healthNotes: 'Lean muscle building classic staple with micronutrients',
      },
      dinner: {
        title: 'Atlantic Salmon Fillet & Sweet Potatoes',
        subtitle: '200g grilled salmon, roasted sweet potato, grilled asparagus',
        calories: 750,
        protein: 50,
        carbs: 62,
        fat: 26,
        goalBadge: '🥑 Healthy Fats',
        goalBadgeColor: 'yellow',
        icon: '🐟',
        healthNotes: 'Packed with Omega-3 fatty acids for joint and muscle recovery',
      },
      snack: {
        title: 'Greek Yogurt with Almonds & Honey',
        subtitle: '200g 0% Greek yogurt, 15g sliced almonds, 1 tsp raw honey',
        calories: 420,
        protein: 32,
        carbs: 38,
        fat: 12,
        goalBadge: '🟢 High Protein',
        goalBadgeColor: 'green',
        icon: '🫐',
        healthNotes: 'Slow-release casein protein ideal for overnight muscle repair',
      },
    },
    {
      breakfast: {
        title: 'Scrambled Eggs & Sourdough Toast',
        subtitle: '3 whole eggs, 2 whites, 2 thick slices sourdough, 1/4 avocado',
        calories: 550,
        protein: 36,
        carbs: 52,
        fat: 22,
        goalBadge: '🥗 Balanced',
        goalBadgeColor: 'blue',
        icon: '🍳',
        healthNotes: 'Bioavailable choline, healthy fats, and sustained morning fuel',
      },
      lunch: {
        title: 'Lean Ground Beef Bowl & Sweet Potato',
        subtitle: '180g 93/7 lean ground beef, sweet potato mash, roasted green beans',
        calories: 740,
        protein: 52,
        carbs: 76,
        fat: 20,
        goalBadge: '🟢 High Protein',
        goalBadgeColor: 'green',
        icon: '🥩',
        healthNotes: 'High creatine and heme iron for strength output',
      },
      dinner: {
        title: 'Grilled Chicken Breast with Whole Grain Pasta',
        subtitle: '180g chicken, 120g whole grain penne, rich marinara sauce',
        calories: 710,
        protein: 56,
        carbs: 82,
        fat: 12,
        goalBadge: '⚡ Energy Carbs',
        goalBadgeColor: 'blue',
        icon: '🍝',
        healthNotes: 'Replenishing muscle glycogen after training',
      },
      snack: {
        title: 'Protein Smoothie & Natural Peanut Butter',
        subtitle: '1.5 scoops whey isolate, 1 banana, 20g natural peanut butter, oat milk',
        calories: 440,
        protein: 38,
        carbs: 42,
        fat: 14,
        goalBadge: '🟢 High Protein',
        goalBadgeColor: 'green',
        icon: '🥛',
        healthNotes: 'Fast absorbing post-workout muscle protein synthesis',
      },
    },
    {
      breakfast: {
        title: 'Protein Blueberry Pancakes & Banana',
        subtitle: 'Oat flour pancake mix, 1 scoop whey, sliced banana, sugar-free syrup',
        calories: 530,
        protein: 40,
        carbs: 72,
        fat: 8,
        goalBadge: '⚡ Energy Carbs',
        goalBadgeColor: 'blue',
        icon: '🥞',
        healthNotes: 'High carb morning fuel optimized for leg and push training days',
      },
      lunch: {
        title: 'Turkey & Quinoa Power Bowl',
        subtitle: '180g lean turkey breast, 1.5 cups cooked quinoa, diced avocado & bell pepper',
        calories: 700,
        protein: 52,
        carbs: 74,
        fat: 18,
        goalBadge: '🟢 High Protein',
        goalBadgeColor: 'green',
        icon: '🥗',
        healthNotes: 'Complete amino acid profile with high fiber',
      },
      dinner: {
        title: 'Sirloin Steak with Brown Rice & Stir-fry',
        subtitle: '180g top sirloin steak, 1.5 cups steamed brown rice, zucchini & mushrooms',
        calories: 760,
        protein: 54,
        carbs: 70,
        fat: 24,
        goalBadge: '🟢 High Protein',
        goalBadgeColor: 'green',
        icon: '🥩',
        healthNotes: 'Dense protein source supporting strength recovery',
      },
      snack: {
        title: 'Low-Fat Cottage Cheese & Pineapple',
        subtitle: '220g cottage cheese, fresh pineapple chunks, 15g crushed walnuts',
        calories: 390,
        protein: 34,
        carbs: 34,
        fat: 11,
        goalBadge: '🟢 High Protein',
        goalBadgeColor: 'green',
        icon: '🍍',
        healthNotes: 'Contains bromelain enzyme aiding protein digestion',
      },
    },
  ]

  let totalMealsCreated = 0
  let totalLogsCreated = 0

  // Unlogged days (~7 days skipped completely)
  const skippedNutritionDates = new Set([
    dates[3],  // 2026-09-13 (Sunday)
    dates[5],  // 2026-09-15
    dates[10], // 2026-09-20 (Sunday)
    dates[15], // 2026-09-25
    dates[16], // 2026-09-26 (Saturday)
    dates[21], // 2026-10-01
    dates[24], // 2026-10-04 (Sunday)
  ])

  // Incomplete logged days (logged partially, not finalized)
  const incompleteNutritionDates = new Map<string, string[]>([
    [dates[8], ['breakfast', 'lunch']],                 // 2026-09-18 (missed dinner/snacks)
    [dates[19], ['breakfast', 'lunch', 'snack']],       // 2026-09-29 (missed dinner)
    [dates[26], ['lunch', 'dinner']],                   // 2026-10-06 (missed breakfast & snack)
    [dates[dates.length - 1], ['breakfast', 'lunch']],  // Today (2026-10-11): in-progress morning & afternoon meals!
  ])

  for (let i = 0; i < dates.length; i++) {
    const dateStr = dates[i]
    if (skippedNutritionDates.has(dateStr)) {
      continue
    }

    const menu = mealVariations[i % mealVariations.length]
    const isIncomplete = incompleteNutritionDates.has(dateStr)
    const allowedMealTypes = incompleteNutritionDates.get(dateStr)

    const allMeals = [
      { ...menu.breakfast, mealType: 'breakfast', loggedAt: '08:15 AM' },
      { ...menu.lunch, mealType: 'lunch', loggedAt: '12:45 PM' },
      { ...menu.dinner, mealType: 'dinner', loggedAt: '07:15 PM' },
      { ...menu.snack, mealType: 'snack', loggedAt: '09:30 PM' },
    ]

    const mealList = isIncomplete && allowedMealTypes
      ? allMeals.filter((m) => allowedMealTypes.includes(m.mealType))
      : allMeals

    const totalCals = mealList.reduce((s, m) => s + m.calories, 0)
    const totalProt = mealList.reduce((s, m) => s + m.protein, 0)
    const totalCarb = mealList.reduce((s, m) => s + m.carbs, 0)
    const totalFat = mealList.reduce((s, m) => s + m.fat, 0)
    const waterMl = isIncomplete ? 1500 + ((i * 50) % 300) : 2250 + ((i * 75) % 500)

    const isCompletedDay = !isIncomplete

    const foodLog = await prisma.dailyFoodLog.create({
      data: {
        userId,
        date: dateStr,
        totalCalories: totalCals,
        totalProtein: totalProt,
        totalCarbs: totalCarb,
        totalFat: totalFat,
        waterMl,
        isCompleted: isCompletedDay,
        completedAt: isCompletedDay ? new Date(`${dateStr}T21:45:00Z`) : null,
        createdAt: new Date(`${dateStr}T08:15:00Z`),
      },
    })
    totalLogsCreated++

    for (const m of mealList) {
      await prisma.foodLogMeal.create({
        data: {
          dailyFoodLogId: foodLog.id,
          mealType: m.mealType,
          title: m.title,
          subtitle: m.subtitle,
          calories: m.calories,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          goalBadge: m.goalBadge,
          goalBadgeColor: m.goalBadgeColor,
          icon: m.icon,
          healthNotes: m.healthNotes,
          loggedAt: m.loggedAt,
          createdAt: new Date(`${dateStr}T${m.mealType === 'breakfast' ? '08:15:00' : m.mealType === 'lunch' ? '12:45:00' : m.mealType === 'dinner' ? '19:15:00' : '21:30:00'}Z`),
        },
      })
      totalMealsCreated++
    }
  }
  console.log(`✓ Seeded ${totalLogsCreated}/${dates.length} DailyFoodLogs (${totalMealsCreated} individual meals with realistic tracking gaps & in-progress days)`)

  console.log('\n================ SEEDING COMPLETE! ================')
  console.log(`User: ${user.firstName} ${user.lastName} (${TARGET_USER_EMAIL})`)
  console.log(`Active Period: ${dates[0]} to ${dates[dates.length - 1]} (${dates.length} days)`)
  console.log(`Weight Logs: ${weightLogsData.length} records (${weightLogsData[0].weight}kg -> ${weightLogsData[weightLogsData.length - 1].weight}kg)`)
  console.log(`Check-Ins: ${totalCheckIns}/${dates.length} days (Active 4-day current streak)`)
  console.log(`Workouts: ${totalSessionsCreated} completed sessions (~66% split consistency)`)
  console.log(`Nutrition: ${totalLogsCreated}/${dates.length} days tracked (${totalMealsCreated} meals logged)`)
  console.log('====================================================\n')
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
