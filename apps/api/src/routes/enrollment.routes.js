import { Router } from 'express';
import { listEnrollments, createEnrollment, deleteEnrollment } from '../controllers/enrollment.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, requireRole('admin'), listEnrollments);
router.post('/', verifyToken, requireRole('admin'), createEnrollment);
router.delete('/:id', verifyToken, requireRole('admin'), deleteEnrollment);

export default router;
