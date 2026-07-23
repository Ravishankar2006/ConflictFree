import { Router } from 'express';
import { listConflicts, resolveConflict } from '../controllers/conflict.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import { validateParams } from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/params.schema.js';

const router = Router();

router.get('/', verifyToken, requireRole('admin'), listConflicts);
router.patch('/:id/resolve', verifyToken, requireRole('admin'), validateParams(idParamSchema), resolveConflict);

export default router;
