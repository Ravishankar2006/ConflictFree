import { Router } from 'express';
import { listAvailability, setAvailability, deleteAvailability } from '../controllers/availability.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, listAvailability);
router.get('/:facultyId', verifyToken, listAvailability);
router.post('/', verifyToken, requireRole('admin'), setAvailability);
router.delete('/:id', verifyToken, requireRole('admin'), deleteAvailability);

export default router;
