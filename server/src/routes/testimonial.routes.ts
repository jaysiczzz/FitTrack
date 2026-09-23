import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createTestimonialSchema } from '../schemas/testimonial.schema'
import {
  getTestimonials,
  getMyTestimonial,
  submitTestimonial,
  deleteMyTestimonial,
} from '../controllers/testimonial.controller'

const router = Router()

// Public route to view testimonials
router.get('/', getTestimonials)

// Authenticated routes
router.get('/my', authMiddleware, getMyTestimonial)
router.post('/', authMiddleware, validate(createTestimonialSchema), submitTestimonial)
router.delete('/my', authMiddleware, deleteMyTestimonial)

export default router
