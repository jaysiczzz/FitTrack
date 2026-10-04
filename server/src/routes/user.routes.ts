import { Router } from 'express'
import { getProfile, updateProfile, deleteAccount, deleteProfile } from '../controllers/user.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.get('/profile', authMiddleware, getProfile)
router.put('/profile', authMiddleware, updateProfile)
router.delete('/profile', authMiddleware, deleteAccount)
router.delete('/me', authMiddleware, deleteAccount)

export default router

