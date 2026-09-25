import { Router } from 'express'
import {
  getWeightLogs,
  saveWeightLog,
  deleteWeightLog,
  setTargetWeight,
} from '../controllers/weight.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { saveWeightLogSchema, setTargetWeightSchema } from '../schemas/weight.schema'

const router = Router()

router.use(authMiddleware)

router.get('/', getWeightLogs)
router.post('/', validate(saveWeightLogSchema), saveWeightLog)
router.delete('/:id', deleteWeightLog)
router.put('/target', validate(setTargetWeightSchema), setTargetWeight)

export default router
