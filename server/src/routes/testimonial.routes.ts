import { Router } from 'express'
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createTestimonialSchema } from '../schemas/testimonial.schema'
import {
  getTestimonials,
  getMyTestimonial,
  submitTestimonial,
  deleteMyTestimonial,
  toggleHelpfulTestimonial,
} from '../controllers/testimonial.controller'

const router = Router()

// Public route to view testimonials (with optional user context for vote status)
router.get('/', optionalAuthMiddleware, getTestimonials)
router.post('/:id/helpful', authMiddleware, toggleHelpfulTestimonial)

// Authenticated routes
router.get('/my', authMiddleware, getMyTestimonial)
router.post('/', authMiddleware, validate(createTestimonialSchema), submitTestimonial)
router.delete('/my', authMiddleware, deleteMyTestimonial)

export default router
