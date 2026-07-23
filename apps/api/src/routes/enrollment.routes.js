import { Router } from 'express';
import { listEnrollments, createEnrollment, deleteEnrollment } from '../controllers/enrollment.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { createEnrollmentSchema } from '../validators/enrollment.schema.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, requireRole('admin'), listEnrollments);
router.post('/', verifyToken, requireRole('admin'), validate(createEnrollmentSchema), createEnrollment);
router.delete('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteEnrollment);

export default router;
