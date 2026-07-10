import { Request, Response, NextFunction } from 'express'
import { verifyToken, jwtPayload } from '../utils/jwt.utils'

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