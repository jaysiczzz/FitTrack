import { Response, NextFunction } from 'express'
import { AuthRequest } from './auth.middleware'
import { prisma } from '../config/db'

export interface OwnedSetRequest extends AuthRequest {
  exerciseSet?: any
}

export interface OwnedExerciseRequest extends AuthRequest {
  workoutExercise?: any
}

/**
 * Route param middleware for ':setId'.
 * Verifies that the requested exercise set exists and belongs to the authenticated user's workout session.
 */
export const validateSetOwnership = async (
  req: OwnedSetRequest,
  res: Response,
  next: NextFunction,
  setId: string
) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' })
  }

  try {
    const set = await prisma.exerciseSet.findFirst({
      where: {
        id: setId,
        workoutExercise: {
          workoutSession: {
            userId,
          },
        },
      },
      include: {
        workoutExercise: true,
      },
    })

    if (!set) {
      return res.status(404).json({ error: 'Exercise set not found or unauthorized' })
    }

    req.exerciseSet = set
    next()
  } catch (err) {
    next(err)
  }
}

/**
 * Route param middleware for ':exerciseId'.
 * Verifies that the requested workout exercise belongs to the authenticated user's workout session.
 */
export const validateWorkoutExerciseOwnership = async (
  req: OwnedExerciseRequest,
  res: Response,
  next: NextFunction,
  exerciseId: string
) => {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' })
  }

  try {
    const exercise = await prisma.workoutExercise.findFirst({
      where: {
        id: exerciseId,
        workoutSession: {
          userId,
        },
      },
    })

    if (!exercise) {
      return res.status(404).json({ error: 'Workout exercise not found or unauthorized' })
    }

    req.workoutExercise = exercise
    next()
  } catch (err) {
    next(err)
  }
}
