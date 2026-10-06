import { Router } from 'express'
import {
  login,
  register,
  refresh,
  logout,
  changePassword,
  requestPasswordReset,
  resetPasswordWithCode,
  checkEmail,
  sendVerification,
  verifyEmail,
} from '../controllers/auth.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  checkEmailSchema,
  sendVerificationSchema,
  verifyEmailSchema,
} from '../schemas/auth.schema'

const router = Router()

router.post('/login', validate(loginSchema), login)
router.post('/register', validate(registerSchema), register)
router.post('/check-email', validate(checkEmailSchema), checkEmail)
router.post('/send-verification', validate(sendVerificationSchema), sendVerification)
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail)
router.post('/refresh', validate(refreshSchema), refresh)
router.post('/logout', logout)
router.post('/change-password', authMiddleware, validate(changePasswordSchema), changePassword)
router.post('/forgot-password', validate(forgotPasswordSchema), requestPasswordReset)
router.post('/reset-password', validate(resetPasswordSchema), resetPasswordWithCode)

export default router
