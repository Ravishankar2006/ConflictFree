import { Router } from 'express';
import { generate, apply } from '../controllers/scheduler.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', verifyToken, requireRole('admin'), generate);
router.post('/apply', verifyToken, requireRole('admin'), apply);

export default router;
