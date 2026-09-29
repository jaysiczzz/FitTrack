import { Router } from 'express'
import {
  getAdminSystemStats,
  getAdminUsers,
  updateUserRole,
  deleteUser,
  getAdminTickets,
  updateAdminTicket,
  deleteAdminTicket,
  toggleStoryFeature,
  deleteStory,
} from '../controllers/admin.controller'
import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware'

const router = Router()

// Enforce strict authentication and ADMIN-only role authorization on all routes
router.use(authMiddleware)
router.use(adminMiddleware)

// 1. Live System Health, KPIs, Engagement & AI Usage
router.get('/stats', getAdminSystemStats)

// 2. User Directory & Role Management
router.get('/users', getAdminUsers)
router.put('/users/:id/role', updateUserRole)
router.delete('/users/:id', deleteUser)

// 3. Inbound Support & Feedback Helpdesk
router.get('/tickets', getAdminTickets)
router.patch('/tickets/:id', updateAdminTicket)
router.delete('/tickets/:id', deleteAdminTicket)

// 4. Community Stories & Testimonial Moderation
router.patch('/stories/:id/feature', toggleStoryFeature)
router.delete('/stories/:id', deleteStory)

export default router
