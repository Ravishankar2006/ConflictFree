import { Router } from 'express';
import { listConflicts, resolveConflict } from '../controllers/conflict.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, requireRole('admin'), listConflicts);
router.patch('/:id/resolve', verifyToken, requireRole('admin'), resolveConflict);

export default router;
