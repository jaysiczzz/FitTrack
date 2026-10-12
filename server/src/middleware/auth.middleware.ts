import { Request, Response, NextFunction } from 'express'
import { verifyToken, jwtPayload } from '../utils/jwt.utils'
import { prisma } from '../config/db'

export interface AuthRequest extends Request {
  user?: jwtPayload
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const payload = verifyToken(token)
    req.user = payload

    if (payload.id) {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { isSuspended: true, suspendedReason: true },
      })
      if (user?.isSuspended) {
        return res.status(403).json({
          error: 'ACCOUNT_SUSPENDED',
          message: user.suspendedReason || 'Your account has been suspended by an administrator.',
        })
      }
    }

    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const optionalAuthMiddleware = (req: AuthRequest, _res: Response, next: NextFunction) => {

  const token = req.headers.authorization?.split(' ')[1]

  if (token) {
    try {
      req.user = verifyToken(token)
    } catch {
      // Ignored for optional auth
    }
  }

  next()
}

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' })
  }

  // Always check live database role to support dynamic role promotion without re-login
  const dbUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { role: true, email: true },
  })

  const isUserAdmin = dbUser?.role === 'ADMIN' || req.user.role === 'ADMIN'

  if (!isUserAdmin) {
    return res.status(403).json({
      error: 'Forbidden: Administrator privileges required.',
    })
  }

  next()
}