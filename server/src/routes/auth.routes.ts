import { Router } from 'express'
import { login, register, refresh, logout } from '../controllers/auth.controller'
import { validate } from '../middleware/validate.middleware'
import { loginSchema, registerSchema, refreshSchema } from '../schemas/auth.schema'

const router = Router()

router.post('/login', validate(loginSchema), login)
router.post('/register', validate(registerSchema), register)
router.post('/refresh', validate(refreshSchema), refresh)
router.post('/logout', logout)

export default router
