import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { jwtSecret } from '../config/env'
import { prisma } from '../config/db'

export interface jwtPayload {
  id: string
  role?: string
}

export const ACCESS_TOKEN_EXPIRATION = '15m'
export const REFRESH_TOKEN_EXPIRATION_DAYS = 30

/**
 * Signs a short-lived access token (15 minutes).
 */
export const signAccessToken = (payload: jwtPayload): string => {
  return jwt.sign(payload, jwtSecret, { expiresIn: ACCESS_TOKEN_EXPIRATION })
}

/**
 * Backward compatibility alias for signAccessToken.
 */
export const signToken = signAccessToken

/**
 * Verifies and decodes an access token.
 */
export const verifyToken = (token: string): jwtPayload => {
  return jwt.verify(token, jwtSecret) as jwtPayload
}

/**
 * Hashes a refresh token string using SHA-256 for secure database storage.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Generates a cryptographically random refresh token and saves its hash in the database.
 */
export const createRefreshToken = async (userId: string): Promise<string> => {
  const rawToken = crypto.randomBytes(40).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  })

  return rawToken
}

/**
 * Validates a refresh token against the database, revokes it, and generates a new pair (token rotation).
 */
export const rotateRefreshToken = async (
  rawToken: string
): Promise<{ accessToken: string; refreshToken: string; userId: string } | null> => {
  const tokenHash = hashToken(rawToken)

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, role: true } } },
  })

  if (!storedToken) {
    return null
  }

  // RFC 6819 Token Replay Detection:
  // If an already revoked token is presented, an attacker or compromised client is attempting
  // to reuse it. Invalidate the entire token family for this user to mitigate account takeover.
  if (storedToken.revoked) {
    await revokeAllUserTokens(storedToken.userId)
    return null
  }

  if (storedToken.expiresAt < new Date()) {
    return null
  }

  // Revoke the used refresh token (one-time use rotation prevents replay attacks)
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  })

  // Issue new access and refresh token
  const newAccessToken = signAccessToken({ id: storedToken.user.id, role: storedToken.user.role })
  const newRefreshToken = await createRefreshToken(storedToken.user.id)

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    userId: storedToken.user.id,
  }
}

/**
 * Revokes a specific refresh token (used on logout).
 */
export const revokeRefreshToken = async (rawToken: string): Promise<boolean> => {
  const tokenHash = hashToken(rawToken)
  const result = await prisma.refreshToken.updateMany({
    where: { tokenHash, revoked: false },
    data: { revoked: true },
  })
  return result.count > 0
}

/**
 * Revokes all refresh tokens for a user (used on password change or log out from all devices).
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  })
}