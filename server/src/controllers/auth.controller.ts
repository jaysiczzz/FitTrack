import { Request, Response } from 'express'
import * as userModel from '../models/user.model'
import { Goal } from '@prisma/client'
import { hashPassword, comparePassword } from '../utils/password.utils'
import { signAccessToken, createRefreshToken, rotateRefreshToken, revokeRefreshToken } from '../utils/jwt.utils'
import { asyncHandler } from '../utils/asyncHandler.utils'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address' })
    }

    const user = await userModel.findByEmail(normalizedEmail)
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' })
    }

    const accessToken = signAccessToken({ id: user.id })
    const refreshToken = await createRefreshToken(user.id)

    res.json({
        token: accessToken, // Backward compatibility with existing mobile client
        accessToken,
        refreshToken,
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

    const normalizedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address' })
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    const height = Number(req.body.height)
    const weight = Number(req.body.weight)
    const age = Number(req.body.age)

    if (!Number.isInteger(height) || height <= 0 || height > 300) {
        return res.status(400).json({ error: 'Height must be a valid number between 1 and 300 cm' })
    }
    if (Number.isNaN(weight) || weight <= 0 || weight > 500) {
        return res.status(400).json({ error: 'Weight must be a valid number between 1 and 500 kg' })
    }
    if (!Number.isInteger(age) || age <= 0 || age > 120) {
        return res.status(400).json({ error: 'Age must be a valid number between 1 and 120' })
    }

    if (goal !== 'MUSCLE_GAIN' && goal !== 'WEIGHT_LOSS') {
        return res.status(400).json({ error: 'Invalid goal value' })
    }

    const existingUser = await userModel.findByEmail(normalizedEmail)
    if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const hashedPassword = await hashPassword(password)

    const user = await userModel.createUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        height,
        weight,
        age,
        goal: goal as Goal,
    })

    const accessToken = signAccessToken({ id: user.id })
    const refreshToken = await createRefreshToken(user.id)

    res.status(201).json({
        token: accessToken, // Backward compatibility with existing mobile client
        accessToken,
        refreshToken,
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

export const refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body

    if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({ error: 'Refresh token is required' })
    }

    const rotated = await rotateRefreshToken(refreshToken)
    if (!rotated) {
        return res.status(401).json({ error: 'Invalid, expired, or revoked refresh token. Please log in again.' })
    }

    res.json({
        token: rotated.accessToken, // Backward compatibility
        accessToken: rotated.accessToken,
        refreshToken: rotated.refreshToken,
    })
})

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body

    if (refreshToken && typeof refreshToken === 'string') {
        await revokeRefreshToken(refreshToken)
    }

    res.json({ success: true, message: 'Logged out successfully' })
})
