import { Router } from 'express'
import { login, register, refresh, logout, changePassword } from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { loginSchema, registerSchema, refreshSchema, changePasswordSchema } from '../schemas/auth.schema'

const router = Router()

router.post('/login', validate(loginSchema), login)
router.post('/register', validate(registerSchema), register)
router.post('/refresh', validate(refreshSchema), refresh)
router.post('/logout', logout)
router.post('/change-password', authMiddleware, validate(changePasswordSchema), changePassword)

export default router
