import { Router } from 'express';
import { listAvailability, setAvailability, deleteAvailability, myAvailability, updateMyAvailability } from '../controllers/availability.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validate.middleware.js';
import { setAvailabilitySchema, updateMyAvailabilitySchema } from '../validators/availability.schema.js';
import { idParamSchema, facultyIdParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, listAvailability);
router.get('/me', verifyToken, requireRole('faculty', 'admin'), myAvailability);
router.put('/me', verifyToken, requireRole('faculty', 'admin'), validate(updateMyAvailabilitySchema), updateMyAvailability);
router.get('/:facultyId', verifyToken, validateParams(facultyIdParamSchema), listAvailability);
router.post('/', verifyToken, requireRole('admin'), validate(setAvailabilitySchema), setAvailability);
router.delete('/:id', verifyToken, requireRole('admin'), validateParams(idParamSchema), deleteAvailability);

export default router;
