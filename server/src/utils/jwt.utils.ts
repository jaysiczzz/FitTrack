import jwt from 'jsonwebtoken'
import { jwtSecret, jwtExpiresIn } from '../config/env'

export interface jwtPayload {
  id: string
  role?: string
}

export const signToken = (payload: jwtPayload): string => {
    return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn })
};

export const verifyToken = (token: string): jwtPayload => {
    return jwt.verify(token, jwtSecret) as jwtPayload
};