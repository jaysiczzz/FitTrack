import { Request, Response, NextFunction } from 'express'
import { verifyToken, jwtPayload } from '../utils/jwt.utils'
import { prisma } from '../config/db'

export interface AuthRequest extends Request {
  user?: jwtPayload
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required' })
  }

  let role = req.user.role

  if (!role) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    })
    role = user?.role
  }

  if (role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Forbidden: Regular users cannot create, edit, or delete exercises in the system library.',
    })
  }

  next()
}