import { Request, Response } from 'express'
import * as userModel from '../models/user.model'
import { Goal } from '@prisma/client'
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.utils'
import { signAccessToken, createRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/jwt.utils'
import { asyncHandler } from '../utils/asyncHandler.utils'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../config/db'
import { validateEmailDeliverability, EMAIL_REGEX } from '../utils/emailValidation.utils'
import { sendPasswordResetEmail, sendEmailVerificationEmail } from '../services/email.service'
import { capitalizeWords } from '../utils/formatters.utils'

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
            firstName: capitalizeWords(user.firstName),
            lastName: capitalizeWords(user.lastName),
            role: user.role,
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

    // Verify that the email was confirmed via 6-digit OTP within the past 2 hours
    const verifiedRecord = await prisma.emailVerification.findFirst({
        where: {
            email: normalizedEmail,
            used: true,
            createdAt: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
    })

    if (!verifiedRecord && process.env.NODE_ENV !== 'test') {
        return res.status(400).json({
            error: 'Please verify your email address before completing registration.',
            field: 'email',
        })
    }

    const hashedPassword = await hashPassword(password)

    const cleanFirst = capitalizeWords(firstName)
    const cleanLast = capitalizeWords(lastName)

    const user = await userModel.createUser({
        firstName: cleanFirst,
        lastName: cleanLast,
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
            firstName: cleanFirst,
            lastName: cleanLast,
            role: user.role,
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

    if (!emailResult.success && process.env.NODE_ENV === 'production') {
        return res.status(503).json({ error: 'Unable to send verification code. Please check that email service is configured or try again later.' })
    }

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

/**
 * Sends a 6-digit email verification code for new user registration.
 */
export const sendVerification = asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName } = req.body

    if (!email) {
        return res.status(400).json({ error: 'Email is required', field: 'email' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // 1. Deliverability & DNS MX checks
    const emailCheck = await validateEmailDeliverability(normalizedEmail)
    if (!emailCheck.valid) {
        return res.status(400).json({ error: emailCheck.error, field: 'email' })
    }

    // 2. Uniqueness check - verify no account already exists
    const existingUser = await userModel.findByEmail(normalizedEmail)
    if (existingUser) {
        return res.status(409).json({
            error: 'An account with this email already exists. Please log in instead.',
            field: 'email',
        })
    }

    // 3. Cooldown check - prevent spamming code requests within 30 seconds
    const recentToken = await prisma.emailVerification.findFirst({
        where: {
            email: normalizedEmail,
            createdAt: { gte: new Date(Date.now() - 30 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
    })
    if (recentToken) {
        return res.status(429).json({
            error: 'A verification code was recently sent. Please wait 30 seconds before requesting a new code.',
        })
    }

    // 4. Invalidate prior unused codes for this email
    await prisma.emailVerification.updateMany({
        where: { email: normalizedEmail, used: false },
        data: { used: true },
    })

    // 5. Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes validity

    await prisma.emailVerification.create({
        data: {
            email: normalizedEmail,
            code,
            expiresAt,
            used: false,
        },
    })

    const emailResult = await sendEmailVerificationEmail(normalizedEmail, code, firstName)

    if (!emailResult.success && process.env.NODE_ENV === 'production') {
        return res.status(503).json({
            error: 'Unable to send verification email. Please check your email address or try again later.',
        })
    }

    res.json({
        success: true,
        message: 'A 6-digit verification code has been sent to your email.',
        email: normalizedEmail,
        delivered: emailResult.delivered,
        ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
    })
})

/**
 * Validates the 6-digit code for email verification.
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body

    if (!email || !code) {
        return res.status(400).json({ error: 'Email and verification code are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const trimmedCode = code.trim()

    const verificationRecord = await prisma.emailVerification.findFirst({
        where: {
            email: normalizedEmail,
            used: false,
            expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
    })

    if (!verificationRecord) {
        return res.status(400).json({
            error: 'No active verification code found for this email. Please request a new one.',
        })
    }

    if (verificationRecord.attempts >= 5) {
        await prisma.emailVerification.update({
            where: { id: verificationRecord.id },
            data: { used: true },
        })
        return res.status(400).json({
            error: 'Too many incorrect attempts. Please request a new verification code.',
        })
    }

    if (verificationRecord.code !== trimmedCode) {
        await prisma.emailVerification.update({
            where: { id: verificationRecord.id },
            data: { attempts: { increment: 1 } },
        })
        return res.status(400).json({
            error: 'Invalid verification code. Please check your code and try again.',
        })
    }

    // Mark as used/verified
    await prisma.emailVerification.update({
        where: { id: verificationRecord.id },
        data: { used: true },
    })

    res.json({
        success: true,
        message: 'Email verified successfully.',
        email: normalizedEmail,
    })
})

