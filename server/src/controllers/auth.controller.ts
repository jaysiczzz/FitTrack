import { Request, Response } from 'express'
import * as userModel from '../models/user.model'
import { Goal } from '@prisma/client'
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.utils'
import { signAccessToken, createRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/jwt.utils'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { validateEmailDeliverability, EMAIL_REGEX } from '../utils/emailValidation.utils'
import { sendPasswordResetEmail } from '../services/email.service'

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address', field: 'email' })
    }

    const user = await userModel.findByEmail(normalizedEmail)
    if (!user) {
        return res.status(401).json({
            error: 'No account found with this email address.',
            field: 'email',
        })
    }

    const valid = await comparePassword(password, user.password)
    if (!valid) {
        return res.status(401).json({
            error: 'Incorrect password. Please check your password and try again.',
            field: 'password',
        })
    }

    const accessToken = signAccessToken({ id: user.id, role: user.role })
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

    const emailCheck = await validateEmailDeliverability(normalizedEmail)
    if (!emailCheck.valid) {
        return res.status(400).json({ error: emailCheck.error, field: 'email' })
    }

    const passwordCheck = validatePasswordStrength(password)
    if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.error, field: 'password' })
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

    const accessToken = signAccessToken({ id: user.id, role: user.role })
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

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' })
    }

    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({
        where: { id: userId },
    })

    if (!user) {
        return res.status(404).json({ error: 'User not found' })
    }

    const isMatch = await comparePassword(currentPassword, user.password)
    if (!isMatch) {
        return res.status(400).json({ error: 'Incorrect current password' })
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'New password must be different from current password' })
    }

    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.error, field: 'newPassword' })
    }

    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
    })

    // Revoke all existing refresh tokens for security on password change
    await revokeAllUserTokens(userId)

    // Issue fresh token pair for the active session
    const accessToken = signAccessToken({ id: user.id, role: user.role })
    const refreshToken = await createRefreshToken(user.id)

    res.json({
        message: 'Password updated successfully',
        token: accessToken,
        accessToken,
        refreshToken,
    })
})

/**
 * Handles forgot password request by generating a 6-digit OTP code and sending it via email.
 */
export const requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({ error: 'Please enter your email address' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const emailCheck = await validateEmailDeliverability(normalizedEmail)
    if (!emailCheck.valid) {
        return res.status(400).json({ error: emailCheck.error })
    }

    const user = await userModel.findByEmail(normalizedEmail)
    if (!user) {
        return res.status(404).json({ error: 'No account found with this email address.' })
    }

    // Invalidate prior unused codes for this email
    await prisma.passwordResetToken.updateMany({
        where: { email: normalizedEmail, used: false },
        data: { used: true },
    })

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes validity

    await prisma.passwordResetToken.create({
        data: {
            email: normalizedEmail,
            code,
            expiresAt,
        },
    })

    const emailResult = await sendPasswordResetEmail(normalizedEmail, code, user.firstName)

    res.json({
        success: true,
        message: 'A 6-digit verification code has been sent to your email.',
        email: normalizedEmail,
        delivered: emailResult.delivered,
    })
})

/**
 * Verifies 6-digit OTP code and sets the new password.
 */
export const resetPasswordWithCode = asyncHandler(async (req: Request, res: Response) => {
    const { email, code, newPassword } = req.body

    if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'Email, verification code, and new password are required' })
    }

    const passwordCheck = validatePasswordStrength(newPassword)
    if (!passwordCheck.valid) {
        return res.status(400).json({ error: passwordCheck.error, field: 'newPassword' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
            email: normalizedEmail,
            code: code.trim(),
            used: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    })

    if (!resetToken) {
        return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new one.' })
    }

    const user = await userModel.findByEmail(normalizedEmail)
    if (!user) {
        return res.status(404).json({ error: 'User account not found' })
    }

    const hashedPassword = await hashPassword(newPassword)

    // Mark reset code as used
    await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
    })

    // Update user's password
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
    })

    // Invalidate all active sessions for security
    await revokeAllUserTokens(user.id)

    res.json({
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
    })
})

/**
 * Validates whether an email is deliverable and available for registration
 * before the user goes through the onboarding flow.
 */
export const checkEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({ error: 'Email is required', field: 'email' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Deliverability & DNS MX checks
    const emailCheck = await validateEmailDeliverability(normalizedEmail)
    if (!emailCheck.valid) {
        return res.status(400).json({ error: emailCheck.error, field: 'email' })
    }

    // 2. Uniqueness check
    const existingUser = await userModel.findByEmail(normalizedEmail)
    if (existingUser) {
        return res.status(409).json({
            error: 'An account with this email already exists. Please log in instead.',
            field: 'email',
            available: false,
        })
    }

    res.json({
        success: true,
        available: true,
        message: 'Email is valid and available.',
    })
})

