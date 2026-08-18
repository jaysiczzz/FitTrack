import { prisma } from '../config/db'

const DEFAULT_LIBRARY = [
  {
    name: 'Bench Press',
    category: 'Chest · Primary',
    muscleGroup: 'Chest',
    type: 'Strength',
    defaultSets: [
      { weight: 60, reps: 10 },
      { weight: 65, reps: 8 },
      { weight: 70, reps: 6 },
    ],
  },
  {
    name: 'Incline Dumbbell Press',
    category: 'Chest · Secondary',
    muscleGroup: 'Chest',
    type: 'Strength',
    defaultSets: [
      { weight: 22, reps: 10 },
      { weight: 24, reps: 10 },
    ],
  },
  {
    name: 'Pull-ups',
    category: 'Back · Primary',
    muscleGroup: 'Back',
    type: 'Calisthenics',
    defaultSets: [
      { bodyweight: true, reps: 12 },
      { bodyweight: true, reps: 10 },
    ],
  },
  {
    name: 'Bent-Over Barbell Row',
    category: 'Back · Secondary',
    muscleGroup: 'Back',
    type: 'Strength',
    defaultSets: [
      { weight: 50, reps: 10 },
      { weight: 55, reps: 8 },
    ],
  },
  {
    name: 'Barbell Squat',
    category: 'Legs · Primary',
    muscleGroup: 'Legs',
    type: 'Strength',
    defaultSets: [
      { weight: 80, reps: 8 },
      { weight: 90, reps: 6 },
      { weight: 100, reps: 5 },
    ],
  },
  {
    name: 'Romanian Deadlift',
    category: 'Legs · Hamstrings',
    muscleGroup: 'Legs',
    type: 'Strength',
    defaultSets: [
      { weight: 70, reps: 10 },
      { weight: 75, reps: 8 },
    ],
  },
  {
    name: 'Overhead Shoulder Press',
    category: 'Shoulders · Primary',
    muscleGroup: 'Shoulders',
    type: 'Strength',
    defaultSets: [
      { weight: 40, reps: 10 },
      { weight: 45, reps: 8 },
    ],
  },
  {
    name: 'Lateral Dumbbell Raises',
    category: 'Shoulders · Isolation',
    muscleGroup: 'Shoulders',
    type: 'Strength',
    defaultSets: [
      { weight: 10, reps: 15 },
      { weight: 12, reps: 12 },
    ],
  },
  {
    name: 'Barbell Bicep Curl',
    category: 'Arms · Biceps',
    muscleGroup: 'Arms',
    type: 'Strength',
    defaultSets: [
      { weight: 25, reps: 12 },
      { weight: 30, reps: 10 },
    ],
  },
  {
    name: 'Hanging Leg Raise',
    category: 'Core · Abs',
    muscleGroup: 'Core',
    type: 'Calisthenics',
    defaultSets: [
      { bodyweight: true, reps: 15 },
      { bodyweight: true, reps: 15 },
    ],
  },
]

export const seedExercisesIfEmpty = async () => {
  const count = await prisma.exercise.count()
  if (count === 0) {
    for (const ex of DEFAULT_LIBRARY) {
      await prisma.exercise.create({
        data: {
          name: ex.name,
          category: ex.category,
          muscleGroup: ex.muscleGroup,
          type: ex.type,
          defaultSets: ex.defaultSets,
        },
      })
    }
  }
}

export const getAllExercises = async () => {
  await seedExercisesIfEmpty()
  return prisma.exercise.findMany({
    orderBy: { muscleGroup: 'asc' },
  })
}

export const getTodayActiveSession = async (userId: string) => {
  let session = await prisma.workoutSession.findFirst({
    where: { userId, completed: false },
    include: {
      exercises: {
        include: {
          sets: {
            orderBy: { setNumber: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // If no active session exists, create a default active session with Bench Press & Pull-ups
  if (!session) {
    session = await prisma.workoutSession.create({
      data: {
        userId,
        title: "Today's Upper Body Workout",
        completed: false,
        exercises: {
          create: [
            {
              name: 'Bench Press',
              category: 'Chest · Primary',
              type: 'Strength',
              sets: {
                create: [
                  { setNumber: 1, weight: 60, reps: 10, done: true },
                  { setNumber: 2, weight: 65, reps: 8, done: true },
                  { setNumber: 3, weight: 70, reps: 6, done: false },
                ],
              },
            },
            {
              name: 'Pull-ups',
              category: 'Back · Primary',
              type: 'Strength',
              sets: {
                create: [
                  { setNumber: 1, bodyweight: true, reps: 12, done: true },
                  { setNumber: 2, bodyweight: true, reps: 10, done: false },
                ],
              },
            },
          ],
        },
      },
      include: {
        exercises: {
          include: {
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
        },
      },
    })
  }

  return session
}

export const getCompletedSessions = async (userId: string) => {
  return prisma.workoutSession.findMany({
    where: { userId, completed: true },
    include: {
      exercises: {
        include: {
          sets: true,
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })
}

export const addExerciseToActiveSession = async (
  sessionId: string,
  data: {
    exerciseId?: string
    name: string
    category?: string
    type?: string
    defaultSets?: { weight?: number; reps?: number; bodyweight?: boolean }[]
  }
) => {
  const setsData =
    data.defaultSets && data.defaultSets.length > 0
      ? data.defaultSets.map((s, idx) => ({
          setNumber: idx + 1,
          weight: s.weight ? Number(s.weight) : null,
          reps: s.reps ? Number(s.reps) : null,
          bodyweight: Boolean(s.bodyweight),
          done: false,
        }))
      : [
          { setNumber: 1, weight: 50, reps: 10, bodyweight: false, done: false },
          { setNumber: 2, weight: 55, reps: 8, bodyweight: false, done: false },
        ]

  return prisma.workoutExercise.create({
    data: {
      workoutSessionId: sessionId,
      exerciseId: data.exerciseId,
      name: data.name,
      category: data.category,
      type: data.type || 'Strength',
      sets: {
        create: setsData,
      },
    },
    include: {
      sets: {
        orderBy: { setNumber: 'asc' },
      },
    },
  })
}

export const toggleExerciseSet = async (setId: string, done?: boolean) => {
  const existing = await prisma.exerciseSet.findUnique({ where: { id: setId } })
  if (!existing) return null

  const newDone = done !== undefined ? done : !existing.done

  return prisma.exerciseSet.update({
    where: { id: setId },
    data: { done: newDone },
  })
}

export const removeWorkoutExercise = async (workoutExerciseId: string) => {
  return prisma.workoutExercise.delete({
    where: { id: workoutExerciseId },
  })
}

export const finishWorkoutSession = async (sessionId: string) => {
  return prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      completed: true,
      completedAt: new Date(),
      duration: 35,
      caloriesBurned: 240,
    },
  })
}
