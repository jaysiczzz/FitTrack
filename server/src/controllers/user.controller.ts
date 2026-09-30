import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import * as userModel from '../models/user.model'
import { Goal } from '@prisma/client'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { prisma } from '../config/db'

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
        targetWeight?: number | null;
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

    if (req.body.targetWeight !== undefined) {
        if (req.body.targetWeight === null || req.body.targetWeight === '') {
            updateData.targetWeight = null
        } else {
            const targetWeight = Number(req.body.targetWeight)
            if (Number.isNaN(targetWeight) || targetWeight <= 0 || targetWeight > 500) {
                return res.status(400).json({ error: 'Target weight must be between 1 and 500 kg' })
            }
            updateData.targetWeight = targetWeight
        }
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

    // Q4: Automatically sync/upsert WeightLog when weight is updated from profile
    if (updateData.weight !== undefined) {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`

        try {
            await prisma.weightLog.upsert({
                where: {
                    userId_date: {
                        userId,
                        date: todayStr,
                    },
                },
                update: {
                    weight: updateData.weight,
                },
                create: {
                    userId,
                    date: todayStr,
                    weight: updateData.weight,
                    notes: 'Updated from profile',
                },
            })
        } catch (weightSyncErr) {
            console.warn('[User] Could not sync WeightLog on profile update:', weightSyncErr)
        }
    }

    res.json({ user })
})

export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    const user = await userModel.findById(userId)
    if (!user) {
        return res.status(404).json({ error: 'User not found' })
    }

    await userModel.deleteUser(userId)

    res.json({ success: true, message: 'Account deleted successfully' })
})

