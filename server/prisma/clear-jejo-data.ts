import 'dotenv/config'
import { prisma } from '../src/config/db'

const TARGET_USER_EMAIL = 'jejo@gmail.com'

async function main() {
  console.log(`Searching for user ${TARGET_USER_EMAIL}...`)

  const user = await prisma.user.findUnique({
    where: { email: TARGET_USER_EMAIL },
  })

  if (!user) {
    console.log(`User ${TARGET_USER_EMAIL} not found. Nothing to clear.`)
    return
  }

  const userId = user.id
  console.log(`Found user ${user.firstName} ${user.lastName} (ID: ${userId})`)
  console.log('Clearing all seeded workout sessions, food logs, check-ins, and weight logs...')

  // 1. Delete Workout Exercise Sets & Exercises
  const deletedSets = await prisma.exerciseSet.deleteMany({
    where: { workoutExercise: { workoutSession: { userId } } },
  })
  const deletedExercises = await prisma.workoutExercise.deleteMany({
    where: { workoutSession: { userId } },
  })
  const deletedSessions = await prisma.workoutSession.deleteMany({
    where: { userId },
  })

  // 2. Delete Food Meals & Daily Food Logs
  const deletedMeals = await prisma.foodLogMeal.deleteMany({
    where: { dailyFoodLog: { userId } },
  })
  const deletedFoodLogs = await prisma.dailyFoodLog.deleteMany({
    where: { userId },
  })

  // 3. Delete Daily Readiness Check-Ins
  const deletedCheckIns = await prisma.dailyCheckIn.deleteMany({
    where: { userId },
  })

  // 4. Delete Weight Logs
  const deletedWeightLogs = await prisma.weightLog.deleteMany({
    where: { userId },
  })

  console.log('\n================ CLEANUP SUMMARY ================')
  console.log(`Account: ${TARGET_USER_EMAIL} (Account preserved)`)
  console.log(`Workout Sessions removed: ${deletedSessions.count}`)
  console.log(`Workout Exercises removed: ${deletedExercises.count}`)
  console.log(`Exercise Sets removed: ${deletedSets.count}`)
  console.log(`Daily Food Logs removed: ${deletedFoodLogs.count}`)
  console.log(`Food Meals removed: ${deletedMeals.count}`)
  console.log(`Daily Check-Ins removed: ${deletedCheckIns.count}`)
  console.log(`Weight Logs removed: ${deletedWeightLogs.count}`)
  console.log('==================================================')
  console.log('All activity history has been cleared. The account is reset to a clean state!\n')
}

main()
  .catch((e) => {
    console.error('Error clearing data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
