import { Request, Response, NextFunction } from 'express'
import { Prisma } from '../generated/prisma'

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err)

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.[0] ?? 'field'
      return res.status(409).json({ error: `That ${field} is already in use` })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' })
    }
    return res.status(400).json({ error: 'Invalid request data' })
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Invalid data provided' })
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again shortly.' })
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' })
  }

  res.status(500).json({ error: 'Something went wrong on our end. Please try again.' })
}