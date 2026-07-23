import { Router } from 'express';
import { generate, apply } from '../controllers/scheduler.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { applySlotsSchema } from '../validators/timetable.schema.js';

const router = Router();

router.post('/', verifyToken, requireRole('admin'), generate);
router.post('/apply', verifyToken, requireRole('admin'), validate(applySlotsSchema), apply);

export default router;
