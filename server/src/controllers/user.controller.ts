import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as userModel from '../models/user.model'
import { Goal } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler.utils'

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await userModel.findById(userId)
    if (!user) {
        return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user })
})

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const { firstName, lastName, goal } = req.body

    const updateData: {
        firstName?: string;
        lastName?: string;
        height?: number;
        weight?: number;
        age?: number;
        goal?: Goal;
    } = {}

    if (firstName && typeof firstName === 'string') {
        updateData.firstName = firstName.trim()
    }
    if (lastName && typeof lastName === 'string') {
        updateData.lastName = lastName.trim()
    }

    if (req.body.height !== undefined) {
        const height = Number(req.body.height)
        if (!Number.isInteger(height) || height <= 0 || height > 300) {
            return res.status(400).json({ error: 'Height must be between 1 and 300 cm' })
        }
        updateData.height = height
    }

    if (req.body.weight !== undefined) {
        const weight = Number(req.body.weight)
        if (Number.isNaN(weight) || weight <= 0 || weight > 500) {
            return res.status(400).json({ error: 'Weight must be between 1 and 500 kg' })
        }
        updateData.weight = weight
    }

    if (req.body.age !== undefined) {
        const age = Number(req.body.age)
        if (!Number.isInteger(age) || age <= 0 || age > 120) {
            return res.status(400).json({ error: 'Age must be between 1 and 120' })
        }
        updateData.age = age
    }

    if (goal) {
        if (goal !== 'MUSCLE_GAIN' && goal !== 'WEIGHT_LOSS') {
            return res.status(400).json({ error: 'Invalid goal value' })
        }
        updateData.goal = goal as Goal
    }

    const user = await userModel.updateUser(userId, updateData)

    res.json({ user })
})
