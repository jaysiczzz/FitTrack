import { Request, Response } from 'express'
import * as userModel from '../models/user.model'
import { Goal } from '../generated/prisma'
import { hashPassword, comparePassword } from '../utils/password.utils'
import { signToken } from '../utils/jwt.utils'
import { asyncHandler } from '../utils/asyncHandler.utils'

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await userModel.findByEmail(email)
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken({ id: user.id })

    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        },
    })
})

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, goal } = req.body

    if (!firstName || !lastName || !email || !password ||
        req.body.height === undefined || req.body.weight === undefined ||
        req.body.age === undefined || !goal) {
        return res.status(400).json({ error: 'All fields are required' })
    }

    const height = Number(req.body.height)
    const weight = Number(req.body.weight)
    const age = Number(req.body.age)

    if (!Number.isInteger(height) || height <= 0) {
        return res.status(400).json({ error: 'Height must be a positive whole number' })
    }
    if (Number.isNaN(weight) || weight <= 0) {
        return res.status(400).json({ error: 'Weight must be a positive number' })
    }
    if (!Number.isInteger(age) || age <= 0) {
        return res.status(400).json({ error: 'Age must be a positive whole number' })
    }

    if (goal !== 'MUSCLE_GAIN' && goal !== 'WEIGHT_LOSS') {
        return res.status(400).json({ error: 'Invalid goal value' })
    }

    const existingUser = await userModel.findByEmail(email)
    if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' })
    }

    const hashedPassword = await hashPassword(password)

    const user = await userModel.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        height,
        weight,
        age,
        goal: goal as Goal,
    })

    const token = signToken({ id: user.id })

    res.status(201).json({
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            height: user.height,
            weight: user.weight,
            age: user.age,
            goal: user.goal,
        },
    })
})